import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const source = readFileSync(new URL('./useResidentAuditHistory.ts', import.meta.url), 'utf8')
// The request lifecycle now lives in the shared entity-audit hook.
const sharedHook = readFileSync(new URL('../../../shared/hooks/useEntityAuditHistory.ts', import.meta.url), 'utf8')

describe('useResidentAuditHistory', () => {
    it('delegates to the shared hook with the Resident BFF loader', () => {
        expect(source).toContain('useEntityAuditHistory({ entityId, loader, enabled })')
        expect(source).toContain('residentAuditHistoryService.getHistory(id, language, signal)')
    })

    it('aborts and ignores stale requests when the tab closes or resident changes', () => {
        expect(sharedHook).toContain('requestRef.current?.abort()')
        expect(sharedHook).toContain('const controller = new AbortController()')
        expect(sharedHook).toContain('if (current && !controller.signal.aborted)')
        expect(sharedHook).toContain('return () => { current = false; controller.abort() }')
    })
})
