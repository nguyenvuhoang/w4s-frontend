import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const source = readFileSync(new URL('./ResidentHistoryTab.tsx', import.meta.url), 'utf8')
// The presentation moved to the shared change-history component; Resident only supplies texts and labels.
const sharedView = readFileSync(new URL('../../../../shared/components/entity-audit/EntityAuditHistory.tsx', import.meta.url), 'utf8')

describe('ResidentHistoryTab', () => {
    it('renders through the shared change-history view with the Resident texts', () => {
        expect(source).toContain('<EntityAuditHistoryView')
        expect(source).toContain("residentText(dictionary, 'detail_tab_history', 'Lịch sử thao tác')")
        expect(source).toContain('useResidentAuditHistory({ entityId: residentEntityId, language: locale, enabled: active })')
    })

    it('shared view contains a loading state and empty state', () => {
        expect(sharedView).toContain('CircularProgress')
        expect(sharedView).toContain("'history_loading'")
        expect(sharedView).toContain("'history_empty'")
    })

    it('shared view contains error references, actor copy, and audit change renderers', () => {
        expect(sharedView).toContain("'history_error_reference'")
        expect(sharedView).toContain('navigator.clipboard.writeText')
        expect(sharedView).toContain('buildAuditDisplayEntries(items, hiddenFields)')
        expect(sharedView).toContain("'history_created_fallback'")
        expect(sharedView).toContain("'history_invalid_changes'")
        // Resident keeps its own "created" wording
        expect(source).toContain('Hồ sơ cư dân được khởi tạo')
    })

    it('maps fields and action types through the approved helpers', () => {
        expect(source).toContain('AUDIT_FIELD_LABEL_KEYS')
        expect(sharedView).toContain('getAuditActionPresentation')
        expect(sharedView).toContain('buildAuditDisplayEntries')
    })
})
