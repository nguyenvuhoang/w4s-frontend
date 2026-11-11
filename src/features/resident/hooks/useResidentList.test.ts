import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

// useResidentList is a React hook (useState/useEffect/useRef) and the wider component tree it
// feeds (ResidentListContent, ResidentSummaryBar) needs a DOM to render/click-test — this project
// has no jsdom/@testing-library/react dependency (vitest.config.ts runs environment: 'node'), so a
// true render-and-click integration test isn't possible here without adding new test
// infrastructure, which is out of scope for this fix. This is a source-level regression check
// instead — consistent with this repo's existing convention for hard-to-render modules (see
// src/shared/components/layout/AuthorizedLayout.test.ts, useResidentAuditHistory.test.ts). The
// paired behavioral test in residentListSearchRace.simulation.test.ts exercises the actual async
// control flow (URL sync before the network await, request-id guard, stale-response handling) as
// a plain Promise-based simulation of this exact shape, without needing React.
const hookSource = readFileSync(new URL('./useResidentList.ts', import.meta.url), 'utf8')
const summaryBarSource = readFileSync(new URL('../components/resident-list/ResidentSummaryBar.tsx', import.meta.url), 'utf8')

// Regression coverage for the confirmed race and its fix: a stale search response used to call
// syncUrl() -> router.replace() from inside its .then handler, which could fire after the user
// had already triggered a *different*, still-pending navigation (e.g. router.push to
// /resident/create) — Next.js's router-reducer always discards whichever navigation is currently
// pending in favor of a newer one (ACTION_NAVIGATE priority — see
// next/dist/client/components/app-router-instance.js), so that late replace silently cancelled the
// Add navigation. The fix is structural, not a manual "did the user navigate away" flag: syncUrl
// is now called synchronously, before the network request even starts, so a response handler never
// calls router.replace at all — there is no async gap left for any other navigation to race
// against. A prior version of this fix used a manually-toggled navigatingAwayRef/
// markNavigatingAway() guard instead; that approach was rejected because it only covered
// navigations the hook explicitly knew about (Add/detail clicks) and missed sidebar/breadcrumb/
// back-forward/future-added navigations, plus risked leaving the list stuck if the tracked
// navigation itself failed to commit. Both must be structurally absent now.
describe('useResidentList — URL sync happens before the network request, never inside a response handler', () => {
    it('does not contain any manually-toggled "navigating away" guard (rejected approach — see hook history)', () => {
        expect(hookSource).not.toContain('navigatingAwayRef')
        expect(hookSource).not.toContain('markNavigatingAway')
    })

    it('calls syncUrl synchronously, before the request id is even taken and before the network await', () => {
        const loadDataIndex = hookSource.indexOf('const loadData = async')
        const syncUrlCallIndex = hookSource.indexOf('syncUrl(normalized_filter)', loadDataIndex)
        const requestIdIndex = hookSource.indexOf('const requestId = ++requestIdRef.current', loadDataIndex)
        const awaitIndex = hookSource.indexOf('await residentService.get_residents', loadDataIndex)

        expect(syncUrlCallIndex).toBeGreaterThan(loadDataIndex)
        expect(requestIdIndex).toBeGreaterThan(syncUrlCallIndex)
        expect(awaitIndex).toBeGreaterThan(requestIdIndex)
    })

    it('never calls syncUrl from inside the try/catch/finally that follows the network await', () => {
        const awaitIndex = hookSource.indexOf('await residentService.get_residents')
        const afterAwait = hookSource.slice(awaitIndex)

        expect(afterAwait).not.toContain('syncUrl(')
    })

    it('normalizes the filter once, and both syncUrl and the request are built from that same normalized value', () => {
        expect(hookSource).toContain('const normalized_filter = normalizeFilter(next_filter)')
        expect(hookSource).toContain('syncUrl(normalized_filter)')
        expect(hookSource).toContain('filter: normalized_filter')
    })

    it('skips router.replace entirely when the target URL is already canonical (no-op sync never dispatches a navigation)', () => {
        expect(hookSource).toContain('if (query === searchParams.toString()) return')
    })

    it('guards stale responses with a request-generation id, never with a navigation/unmount flag, for data/error', () => {
        expect(hookSource).toContain('if (requestId !== requestIdRef.current || !isMountedRef.current) return')
    })

    it('only the latest request is allowed to clear the loading flag', () => {
        expect(hookSource).toMatch(/if \(requestId === requestIdRef\.current\) \{\s*setLoadingResidents\(false\)\s*\}/)
    })

    it('the unmounted guard exists only for setState hygiene, documented as not gating navigation', () => {
        expect(hookSource).toContain('isMountedRef')
        expect(hookSource).toMatch(/Deliberately not used to decide[\s\S]{0,40}whether syncUrl\/navigation happens/)
    })

    it('does not expose markNavigatingAway (or any navigation-marking function) from the hook\'s public API', () => {
        const returnBlock = hookSource.slice(hookSource.lastIndexOf('return {'))

        expect(returnBlock).not.toMatch(/mark\w*Navigat/i)
    })
})

// Regression coverage for the UI/backend page_index convention: the URL and the hook's filter
// state stay on the project's existing UI convention (1-based, page_index omitted from the URL
// for page 1) — this hook never adopted the backend's 0-based convention for its own state/URL.
// The UI-to-backend conversion (page_index - 1, floored at 0) lives entirely in
// residentService.get_residents (see residentListPagination.test.ts) and is untouched by this
// hook's normalizeFilter, which only clamps to >= 1 on the UI side.
describe('useResidentList — page_index stays on the existing UI (1-based) URL convention', () => {
    it('normalizeFilter clamps to a UI page number (>= 1), not a backend page_index (>= 0)', () => {
        expect(hookSource).toContain('page_index: Math.max(input_filter.page_index, 1)')
    })

    it('syncUrl writes the UI (1-based) page_index to the URL, omitted for page 1 — same as before this fix', () => {
        expect(hookSource).toContain("if (next_filter.page_index > 1) params.set('page_index', String(next_filter.page_index))")
    })

    it('never performs its own UI<->backend page_index conversion (e.g. no "- 1" or "+ 1" arithmetic on page_index in this file)', () => {
        expect(hookSource).not.toMatch(/page_index\s*[-+]\s*1/)
    })
})

describe('ResidentSummaryBar — explicit button type (defensive, not inside a form today)', () => {
    it('Add and Export buttons declare type="button" so they can never implicit-submit if ever placed inside a form', () => {
        const addButtonBlock = summaryBarSource.slice(summaryBarSource.indexOf('action="ADD"'))
        const exportButtonBlock = summaryBarSource.slice(
            summaryBarSource.indexOf('action="EXPORT"'),
            summaryBarSource.indexOf('action="ADD"')
        )

        expect(addButtonBlock).toContain('type="button"')
        expect(exportButtonBlock).toContain('type="button"')
    })
})

// Performance regression: under React Strict Mode (development) the project-bootstrap effect runs
// twice on the same instance before the first run's setFilter commits, so the stale-closure check
// `filter.project_id === workingProject.id` alone let both runs through and fired
// WF_BO_SIMPLE_SEARCH_RESIDENTS and WF_BO_SIMPLE_SEARCH_BUILDINGS twice per page open. The fix is a
// per-instance ref set synchronously before the load starts; a real remount (Back/Forward or a new
// navigation) gets a fresh ref and still loads.
describe('useResidentList — initial project load is idempotent under Strict Mode', () => {
    const effectStart = hookSource.indexOf('const loadedProjectIdRef = useRef<number | null>(null)')
    const effectBlock = hookSource.slice(effectStart, hookSource.indexOf('}, [workingProject?.id])', effectStart))

    it('declares a per-instance ref for the project the initial load was started for', () => {
        expect(effectStart).toBeGreaterThan(-1)
    })

    it('marks the project as loaded before starting the requests, and skips when already marked', () => {
        const guardIndex = effectBlock.indexOf('if (loadedProjectIdRef.current === workingProject.id) return')
        const markIndex = effectBlock.indexOf('loadedProjectIdRef.current = workingProject.id')
        const loadIndex = effectBlock.indexOf('void loadData(')
        const buildingsIndex = effectBlock.indexOf('void loadBuildingOptions(')

        expect(guardIndex).toBeGreaterThan(-1)
        expect(markIndex).toBeGreaterThan(guardIndex)
        expect(loadIndex).toBeGreaterThan(markIndex)
        expect(buildingsIndex).toBeGreaterThan(markIndex)
    })

    it('resets the marker when the working project is cleared, so re-selecting it loads again', () => {
        expect(effectBlock).toMatch(/if \(!workingProject\) \{\s*loadedProjectIdRef\.current = null/)
    })

    it('simulated Strict Mode double effect run starts each request once; a project switch loads again', () => {
        // Mirrors the effect body exactly: stale `filter` closure + ref guard.
        const calls: string[] = []
        const ref = { current: null as number | null }
        const staleFilterProjectId = 0
        const runEffect = (projectId: number) => {
            if (staleFilterProjectId === projectId) return
            if (ref.current === projectId) return
            ref.current = projectId
            calls.push(`residents:${projectId}`, `buildings:${projectId}`)
        }

        runEffect(7)
        runEffect(7) // Strict Mode re-run with the same stale closure
        expect(calls).toEqual(['residents:7', 'buildings:7'])

        runEffect(8)
        expect(calls).toEqual(['residents:7', 'buildings:7', 'residents:8', 'buildings:8'])
    })
})

// Navigation performance: a filter/page change must not trigger a server render (router.replace
// re-rendered page.tsx -> AuthorizedLayout -> WF_BO_GET_BO_CONTEXT + WF_BO_LOAD_MENU each time).
// Source-level because this hook needs a DOM to render (no jsdom in this repo — see top of file).
describe('useResidentList — URL sync without a server round trip, data kept during refetch', () => {
    const syncStart = hookSource.indexOf('const syncUrl = useCallback(')
    const syncBlock = hookSource.slice(syncStart, hookSource.indexOf('}, [pathname, searchParams])', syncStart))

    it('syncs the URL with history.replaceState, never router.replace/push', () => {
        expect(syncBlock).toContain("window.history.replaceState(window.history.state, '', query ? `${pathname}?${query}` : pathname)")
        expect(hookSource).not.toContain("from '@shared/hooks/useRouter'")
        const codeOnly = hookSource.split(/\r?\n/).filter(line => !line.trim().startsWith('//')).join('\n')

        expect(codeOnly).not.toMatch(/\brouter\.(replace|push)\(/)
    })

    it('keeps rows of the same project on screen while refetching; clears them on project change and on error', () => {
        const loadBlock = hookSource.slice(hookSource.indexOf('const loadData = async'), hookSource.indexOf('useEffect(() => {', hookSource.indexOf('const loadData = async')))

        expect(loadBlock).toContain('const isProjectChange = normalized_filter.project_id !== filter.project_id')
        expect(loadBlock).toContain('if (isProjectChange) setRows([])')
        expect(loadBlock).toMatch(/catch \(err\) \{[\s\S]*?setRows\(\[\]\)/)
    })
})
