import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

// useResidentRelatedMembersForm is a React hook (useState/useEffect/useFieldArray) that needs a
// DOM to mount — this repo has no jsdom/@testing-library/react (vitest.config.ts runs
// environment: 'node'), so a true render-and-interact test is not possible here without new test
// infrastructure. This follows the repo's existing convention for hard-to-render hooks (see
// useResidentDetailActions.test.ts, ResidentHistoryTab.test.ts): a source-level regression check
// that pins down the control flow fixed in this change. The pure-function behavior these flows
// call into (merge/reconcile/dirty detection) is covered with real assertions in
// residentRelatedMembers.test.ts.
const source = readFileSync(new URL('./useResidentRelatedMembersForm.ts', import.meta.url), 'utf8')

const getFunctionBody = (name: string, startMarker = `const ${name} = `) => {
    const start = source.indexOf(startMarker)

    if (start === -1) throw new Error(`"${startMarker}" not found in source.`)

    const nextMarkers = ['\n    useEffect(', '\n    const deleteField = ', '\n    return {']
    const nextIndexes = nextMarkers
        .map(marker => source.indexOf(marker, start + startMarker.length))
        .filter(index => index !== -1)

    const end = nextIndexes.length > 0 ? Math.min(...nextIndexes) : source.length

    return source.slice(start, end)
}

describe('useResidentRelatedMembersForm — install keeps fields/rows in sync', () => {
    it('install resets the form exactly once with the final reconciled drafts, never a separate setValue afterwards', () => {
        const body = getFunctionBody('install')

        // A reset-then-setValue two-step previously desynced useFieldArray's rendered `fields`
        // from the watched `rows`/isDirty values: a row could be fully unresolved in state
        // (driving the unsaved-changes/unconfirmed-create warnings) while the table rendered no
        // row for the user to see or act on. A single reset with the already-merged drafts keeps
        // both in sync.
        const resetCalls = body.match(/\breset\(/g) ?? []

        expect(resetCalls).toHaveLength(1)
        expect(body).toContain('reset({ members: drafts })')
        expect(body).not.toContain('setValue(')
    })
})

describe('useResidentRelatedMembersForm — save never silently resubmits or hides an unresolved create', () => {
    it('reconciles an unconfirmed UPSERT ack with one follow-up GET before giving up, and never calls service.save twice', () => {
        const body = getFunctionBody('save', 'const save = async () => {')
        const ackCallIndex = body.indexOf('await service.save(')
        const mergeIndex = body.indexOf('mergeResidentExtensionUpsert(')
        const reconcileGetIndex = body.indexOf('await service.load(residentId)')
        const reconcileMergeIndex = body.indexOf('reconcileResidentExtensionGet(')

        expect(ackCallIndex).toBeGreaterThanOrEqual(0)
        expect(mergeIndex).toBeGreaterThan(ackCallIndex)
        expect(reconcileGetIndex).toBeGreaterThan(mergeIndex)
        expect(reconcileMergeIndex).toBeGreaterThan(reconcileGetIndex)
        // Exactly one UPSERT call per save() — the reconciliation path only ever reads (GET).
        expect(body.match(/service\.save\(/g) ?? []).toHaveLength(1)
    })

    it('blocks resubmission up front while any row still has an unconfirmed pendingCreate', () => {
        const body = getFunctionBody('save', 'const save = async () => {')

        expect(body).toContain("if (snapshot.some(row => !row.field_key && row.pendingCreate)) return")
    })
})

describe('useResidentRelatedMembersForm — switching Resident drops the previous warning', () => {
    it('clears notice/error/data as soon as the context key changes, before any new request starts', () => {
        const effectStart = source.indexOf('useEffect(() => {')
        const effectBody = source.slice(effectStart, source.indexOf('useEffect(() => () => guard.invalidate()', effectStart))

        expect(effectBody).toContain('const contextChanged = baseline.current.context !== contextKey')
        expect(effectBody).toContain('setData(null); setError(null); setNotice(null); setDeleteTarget(null)')
    })
})
