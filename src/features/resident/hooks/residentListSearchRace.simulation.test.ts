import { describe, expect, it, vi } from 'vitest'

/**
 * IMPORTANT — what this file does and does NOT prove:
 *
 * This is a plain-Promise SIMULATION of the exact control flow implemented in
 * useResidentList.ts's loadData/syncUrl/normalizeFilter (URL synced synchronously before the
 * network await; requestIdRef decides whose response wins; the response handler never touches
 * navigation). It does NOT import or render the real hook — useResidentList uses
 * useState/useEffect/useRef/useSearchParams and the button that triggers the race lives in
 * ResidentListContent/ResidentSummaryBar, which would need a DOM (jsdom) and
 * @testing-library/react to click-test end to end. Neither is a dependency of this project
 * (vitest.config.ts runs environment: 'node'), and adding that test infrastructure is out of
 * scope for this fix.
 *
 * What DOES tie this simulation to the real code: useResidentList.test.ts asserts (via source
 * inspection of the real file) that the real loadData has this exact shape and ordering —
 * syncUrl called synchronously before the request id is taken and before the network await, never
 * from inside the response handler. Together the two files give: "the real code has this shape"
 * (source test) + "this shape is actually race-safe" (this test).
 */
function createExecuteSearchSimulation({
    search,
    router
}: {
    search: (filter: { keyword: string }) => Promise<{ items: string[] }>
    router: { push: (url: string) => void; replace: (url: string) => void }
}) {
    let requestIdCounter = 0
    let currentUrl = '/vi/resident/list'
    let data: { items: string[] } | null = null
    let loading = false

    const normalizeFilter = (filter: { keyword: string }) => ({ keyword: filter.keyword.trim() })

    // Mirrors useResidentList.ts's syncUrl: skips the replace when the target is already
    // canonical, otherwise fires immediately — never deferred, never called from a response.
    const syncUrl = (filter: { keyword: string }) => {
        const target = filter.keyword ? `/vi/resident/list?keyword=${filter.keyword}` : '/vi/resident/list'

        if (target === currentUrl) return

        currentUrl = target
        router.replace(target)
    }

    // Mirrors useResidentList.ts's loadData: normalize -> syncUrl (sync, before network) ->
    // requestId -> await -> guarded response handling. The response handler never calls syncUrl,
    // router.push, or router.replace — it only ever updates local data/loading state.
    const executeSearch = async (filter: { keyword: string }) => {
        const normalized = normalizeFilter(filter)

        syncUrl(normalized)

        const requestId = ++requestIdCounter

        loading = true

        try {
            const result = await search(normalized)

            if (requestId !== requestIdCounter) return

            data = result
        } finally {
            if (requestId === requestIdCounter) {
                loading = false
            }
        }
    }

    return { executeSearch, getData: () => data, isLoading: () => loading }
}

describe('resident list search-vs-navigation (control-flow simulation)', () => {
    it('scenario 1: search pending, click Add — push happens once, and a search resolving afterward calls replace zero more times', async () => {
        let resolveSearch!: (value: { items: string[] }) => void
        const pendingSearch = new Promise<{ items: string[] }>(resolve => {
            resolveSearch = resolve
        })

        const push = vi.fn()
        const replace = vi.fn()

        const { executeSearch } = createExecuteSearchSimulation({
            search: () => pendingSearch,
            router: { push, replace }
        })

        // Initial search starts (e.g. right after mount) and is still pending.
        const searchPromise = executeSearch({ keyword: '' })

        // syncUrl already ran synchronously above — for the default/canonical filter this is a
        // no-op, so replace was not even called yet.
        expect(replace).not.toHaveBeenCalled()

        // User clicks "Add Resident" — a real navigation, unrelated to this hook.
        push('/vi/resident/create')

        expect(push).toHaveBeenCalledTimes(1)

        // The stale search finally resolves, after the click.
        resolveSearch({ items: ['late'] })
        await searchPromise

        // It must not have called replace at all after the click.
        expect(replace).not.toHaveBeenCalled()
        expect(push).toHaveBeenCalledTimes(1)
    })

    it('scenario 2: an external navigation the hook does not know about (sidebar/breadcrumb/Link) is never overridden by a late response', async () => {
        let resolveSearch!: (value: { items: string[] }) => void
        const pendingSearch = new Promise<{ items: string[] }>(resolve => {
            resolveSearch = resolve
        })

        const push = vi.fn()
        const replace = vi.fn()

        const { executeSearch } = createExecuteSearchSimulation({
            search: (filter) => (filter.keyword === 'urgent' ? pendingSearch : Promise.resolve({ items: [] })),
            router: { push, replace }
        })

        const searchPromise = executeSearch({ keyword: 'urgent' })

        expect(replace).toHaveBeenCalledTimes(1)
        expect(replace).toHaveBeenCalledWith('/vi/resident/list?keyword=urgent')

        // A navigation the hook has no visibility into at all — a sidebar menu item, a
        // breadcrumb <Link>, browser back/forward. Nothing in the hook is told about this.
        push('/vi/some-other-module')

        resolveSearch({ items: ['late'] })
        await searchPromise

        // The late response must not have issued a second replace/push of its own.
        expect(replace).toHaveBeenCalledTimes(1)
        expect(push).toHaveBeenCalledTimes(1)
    })

    it('scenario 3: even if the triggered navigation never commits, the search still resolves normally, clears loading, and updates data', async () => {
        // Simulates a router.push() call whose promise/transition never settles — the search
        // logic must not depend on it in any way.
        const push = vi.fn((_url: string) => { })
        const replace = vi.fn()

        const { executeSearch, getData, isLoading } = createExecuteSearchSimulation({
            search: async () => ({ items: ['ok'] }),
            router: { push, replace }
        })

        const searchPromise = executeSearch({ keyword: '' })

        push('/vi/resident/create') // never "commits" in this simulation — no further effect

        await searchPromise

        expect(isLoading()).toBe(false)
        expect(getData()).toEqual({ items: ['ok'] })
    })

    it('scenario 4: two consecutive searches — the older response never overwrites the newer one\'s data or loading state', async () => {
        let resolveFirst!: (value: { items: string[] }) => void
        const firstSearch = new Promise<{ items: string[] }>(resolve => {
            resolveFirst = resolve
        })

        const push = vi.fn()
        const replace = vi.fn()
        let callCount = 0

        const { executeSearch, getData, isLoading } = createExecuteSearchSimulation({
            search: () => {
                callCount += 1

                return callCount === 1 ? firstSearch : Promise.resolve({ items: ['second'] })
            },
            router: { push, replace }
        })

        const firstPromise = executeSearch({ keyword: 'first' })
        const secondPromise = executeSearch({ keyword: 'second' })

        await secondPromise
        expect(getData()).toEqual({ items: ['second'] })
        expect(isLoading()).toBe(false)

        // The older request now resolves, after the newer one already finished.
        resolveFirst({ items: ['first-stale'] })
        await firstPromise

        // Must still reflect the newer request's result — the stale one must not have overwritten
        // it, and must not have re-flipped loading to true/false around the newer request.
        expect(getData()).toEqual({ items: ['second'] })
        expect(isLoading()).toBe(false)
    })

    it('scenario 5: URL sync happens before the network call is made — never inside resolve/reject/finally', async () => {
        const callOrder: string[] = []
        const push = vi.fn()
        const replace = vi.fn(() => callOrder.push('replace'))

        const { executeSearch } = createExecuteSearchSimulation({
            search: async (filter) => {
                callOrder.push('search-invoked')

                return { items: [filter.keyword] }
            },
            router: { push, replace }
        })

        await executeSearch({ keyword: 'ordering-check' })

        expect(callOrder).toEqual(['replace', 'search-invoked'])
    })

    it('control case: syncUrl is skipped (no replace call) when the target URL is already canonical', async () => {
        const push = vi.fn()
        const replace = vi.fn()

        const { executeSearch } = createExecuteSearchSimulation({
            search: async () => ({ items: [] }),
            router: { push, replace }
        })

        // Default/empty filter maps to the already-current URL ('/vi/resident/list') — see
        // createExecuteSearchSimulation's initial currentUrl.
        await executeSearch({ keyword: '' })

        expect(replace).not.toHaveBeenCalled()
    })
})
