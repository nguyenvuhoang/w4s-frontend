import { describe, expect, it } from 'vitest'

import { extensionItem, extensionResponse } from '../services/residentRelatedMembers.test-fixtures'
import { toResidentExtensionDrafts } from '../services/residentRelatedMembers.mapper'
import { changedResidentExtensionDrafts, mergeResidentExtensionUpsert, reconcileResidentExtensionGet, removeResidentExtensionField, validateRelatedMembers } from './residentRelatedMembers'
import { ResidentExtensionRequestGuard } from './residentExtensionRequestGuard'

describe('extension draft preservation', () => {
    const base = extensionResponse([extensionItem(), extensionItem({ id: 502, field_key: 'note', field_label: 'Ghi chú', field_value: 'Cũ', sort_order: 2 })])

    it('validates names without mutating input, dropping metadata, or requiring a value', () => {
        const rows = [{ ...toResidentExtensionDrafts(base)[0], field_label: ' ', field_value: '' }]

        expect(validateRelatedMembers(rows)).toEqual([{ field_label: 'required' }])
        expect(rows[0].field_key).toBe('contact')
        expect(rows[0].field_label).toBe(' ')
    })

    it('detects changes by backend key, not by labels, and ignores harmless surrounding whitespace', () => {
        const rows = toResidentExtensionDrafts(base)

        expect(changedResidentExtensionDrafts(rows.map(row => ({ ...row, field_value: ` ${row.field_value} ` })), base)).toEqual([])
        expect(changedResidentExtensionDrafts([{ ...rows[0], field_value: 'Mới' }, rows[1]], base)).toHaveLength(1)
    })

    it('merges a partial UPSERT by field_key and preserves unrelated records and data_map', () => {
        const drafts = toResidentExtensionDrafts(base).map(row => row.field_key === 'contact' ? { ...row, field_value: 'Mới' } : row)
        const ack = { ref_domain: 'Resident', ref_record_id: 17699, total_items: 2, items: [extensionItem({ field_value: 'Mới' })] }
        const result = mergeResidentExtensionUpsert(base, ack, drafts, changedResidentExtensionDrafts(drafts, base))

        expect(result.response.items.map(item => item.field_key)).toEqual(['contact', 'note'])
        expect(result.response.data_map).toEqual({ contact: 'Mới', note: 'Cũ' })
        expect(changedResidentExtensionDrafts(result.drafts, result.response)).toEqual([])
    })

    it('binds new temporary rows only to official response keys and keeps unacknowledged new rows', () => {
        const fresh = { clientId: 'temporary-1', field_label: 'Biển số', field_value: '29A', sort_order: 3, status: 'A' }
        const pending = { clientId: 'temporary-2', field_label: 'Chưa xác nhận', field_value: 'B', sort_order: 4, status: 'A' }
        const drafts = [...toResidentExtensionDrafts(base), fresh, pending]
        const official = extensionItem({ id: 503, field_key: 'backend_generated', field_label: fresh.field_label, field_value: fresh.field_value, sort_order: 3 })
        const result = mergeResidentExtensionUpsert(base, { ref_domain: 'Resident', ref_record_id: 17699, total_items: 3, items: [official] }, drafts, [fresh, pending])

        expect(result.drafts.find(row => row.clientId === fresh.clientId)?.field_key).toBe('backend_generated')
        expect(result.drafts.find(row => row.clientId === pending.clientId)).toEqual(pending)
        expect(changedResidentExtensionDrafts(result.drafts, result.response)).toEqual([pending])
    })

    it('does not discard unsaved values or new rows when GET refreshes', () => {
        const drafts = toResidentExtensionDrafts(base).map(row => row.field_key === 'contact' ? { ...row, field_value: 'Bản nháp' } : row)
        const newRow = { clientId: 'new', field_label: 'Mới', field_value: 'A', sort_order: 3, status: 'A' }
        const refreshed = extensionResponse([extensionItem({ field_value: 'Server changed' }), base.items[1]])
        const merged = reconcileResidentExtensionGet(refreshed, base, [...drafts, newRow])

        expect(merged.find(row => row.field_key === 'contact')?.field_value).toBe('Bản nháp')
        expect(merged).toContainEqual(newRow)
    })

    it('removes only the acknowledged deleted field and retains other unsaved changes', () => {
        const drafts = toResidentExtensionDrafts(base).map(row => row.field_key === 'note' ? { ...row, field_value: 'Bản nháp' } : row)
        const result = removeResidentExtensionField(base, drafts, 'contact')

        expect(result.response.items.map(row => row.field_key)).toEqual(['note'])
        expect(result.response.data_map).toEqual({ note: 'Cũ' })
        expect(result.drafts[0].field_value).toBe('Bản nháp')
    })

    it('reconciles a committed new field after its UPSERT response was lost, without duplicating it', () => {
        const attempted = { field_label: 'Mới', field_value: 'A', sort_order: 3, status: 'A' }
        const draft = { ...attempted, clientId: 'temp', pendingCreate: attempted }
        const official = extensionItem({ id: 503, field_key: 'real_key', ...attempted })
        const refreshed = extensionResponse([...base.items, official])
        const result = reconcileResidentExtensionGet(refreshed, base, [...toResidentExtensionDrafts(base), draft])

        expect(result).toHaveLength(3)
        expect(result.find(row => row.clientId === 'temp')).toMatchObject({ field_key: 'real_key', id: 503 })
        expect(result.find(row => row.clientId === 'temp')).not.toHaveProperty('pendingCreate')
        expect(changedResidentExtensionDrafts(result, refreshed)).toEqual([])
    })

    it('preserves later edits while matching the attempted create to the original submitted values', () => {
        const attempted = { field_label: 'Mới', field_value: 'A', sort_order: 3, status: 'A' }
        const draft = { ...attempted, field_value: 'Edited after failure', clientId: 'temp', pendingCreate: attempted }
        const refreshed = extensionResponse([...base.items, extensionItem({ id: 503, field_key: 'real_key', ...attempted })])
        const result = reconcileResidentExtensionGet(refreshed, base, [...toResidentExtensionDrafts(base), draft])

        expect(result.find(row => row.clientId === 'temp')).toMatchObject({ field_key: 'real_key', field_value: 'Edited after failure' })
    })

    it('keeps fresh server identity/status/order while preserving only locally edited values during GET', () => {
        const draft = { ...toResidentExtensionDrafts(base)[0], field_value: 'Bản nháp' }
        const refreshed = extensionResponse([extensionItem({ id: 900, status: 'SERVER_STATUS', sort_order: 5 }), base.items[1]])
        const result = reconcileResidentExtensionGet(refreshed, base, [draft, toResidentExtensionDrafts(base)[1]])

        expect(result.find(row => row.field_key === 'contact')).toMatchObject({ id: 900, status: 'SERVER_STATUS', sort_order: 5, field_value: 'Bản nháp' })
    })

    it('updates clean rows from a full UPSERT acknowledgement while retaining unrelated unsaved edits', () => {
        const drafts = toResidentExtensionDrafts(base)
        const submitted = [{ ...drafts[0], field_value: 'Mới' }]
        const ack = extensionResponse([extensionItem({ field_value: 'Mới' }), { ...base.items[1], field_value: 'Server canonical' }])
        const result = mergeResidentExtensionUpsert(base, ack, [submitted[0], drafts[1]], submitted)

        expect(result.drafts[1].field_value).toBe('Server canonical')
        expect(changedResidentExtensionDrafts(result.drafts, result.response)).toEqual([])
    })

    it('does not mark an untouched new row dirty, so Save stays correctly disabled rather than warning falsely', () => {
        const blank = { clientId: 'blank-1', field_label: '', field_value: '', sort_order: 3, status: 'A' }
        const blankWhitespace = { clientId: 'blank-2', field_label: '   ', field_value: '  ', sort_order: 4, status: 'A' }

        expect(changedResidentExtensionDrafts([...toResidentExtensionDrafts(base), blank, blankWhitespace], base)).toEqual([])
    })

    it('confirms a single new row by cardinality alone, even when the backend echoes back a different sort_order', () => {
        const draft = { clientId: 'temp-1', field_label: 'Biển số xe', field_value: '29A-888.99', sort_order: 3, status: 'A' }
        const drafts = [...toResidentExtensionDrafts(base), draft]
        // The backend reassigned sort_order server-side instead of echoing what was submitted —
        // a label/sort_order match would wrongly stay ambiguous, but there is only one new row
        // submitted and only one new official row back, so there is nothing else it could be.
        const official = extensionItem({ id: 503, field_key: 'bien_so_xe', field_label: draft.field_label, field_value: draft.field_value, sort_order: 99 })
        const ack = { ref_domain: 'Resident', ref_record_id: 17699, total_items: 3, items: [official] }
        const result = mergeResidentExtensionUpsert(base, ack, drafts, [draft])

        expect(result.drafts.find(row => row.clientId === 'temp-1')).toMatchObject({ field_key: 'bien_so_xe', id: 503 })
        expect(result.drafts).toHaveLength(3)
        expect(changedResidentExtensionDrafts(result.drafts, result.response)).toEqual([])
    })

    it('reconciles a single unconfirmed create by cardinality alone on a follow-up GET, even if its value was edited since', () => {
        const attempted = { field_label: 'Biển số xe', field_value: '29A-888.99', sort_order: 3, status: 'A' }
        const draft = { ...attempted, field_value: 'Edited after lost ack', clientId: 'temp-1', pendingCreate: attempted }
        // The server's returned row does not match `attempted` on sort_order (server-assigned),
        // which would defeat the old label/value/sort_order/status heuristic entirely.
        const official = extensionItem({ id: 503, field_key: 'bien_so_xe', field_label: attempted.field_label, field_value: attempted.field_value, sort_order: 99 })
        const refreshed = extensionResponse([...base.items, official])
        const result = reconcileResidentExtensionGet(refreshed, base, [...toResidentExtensionDrafts(base), draft])

        expect(result.find(row => row.clientId === 'temp-1')).toMatchObject({ field_key: 'bien_so_xe', field_value: 'Edited after lost ack' })
        expect(result.find(row => row.clientId === 'temp-1')).not.toHaveProperty('pendingCreate')
    })
})

describe('record/request race guard', () => {
    it('rejects double mutation and never unlocks the new resident when an old mutation completes', () => {
        const guard = new ResidentExtensionRequestGuard('17699:P1')
        const old = guard.beginMutation()!

        expect(guard.beginMutation()).toBeNull()
        guard.setContext('17700:P1')
        const current = guard.beginMutation()!
        expect(guard.isCurrent(old)).toBe(false)
        expect(guard.finishMutation(old)).toBe(false)
        expect(guard.busy).toBe(true)
        expect(guard.finishMutation(current)).toBe(true)
    })

    it('invalidates pending reads when a mutation starts or project changes', () => {
        const guard = new ResidentExtensionRequestGuard('17699:P1')
        const read = guard.ticket()

        guard.beginMutation()
        expect(guard.isCurrent(read)).toBe(false)
        const write = guard.ticket()
        guard.setContext('17699:P2')
        expect(guard.isCurrent(write)).toBe(false)
    })
})
