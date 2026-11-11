import { describe, expect, it } from 'vitest'

import { buildResidentExtensionDataRequest, parseResidentExtensionData, toResidentExtensionDrafts } from './residentRelatedMembers.mapper'
import { extensionItem, extensionResponse } from './residentRelatedMembers.test-fixtures'

describe('confirmed Entity Extension Data schema', () => {
    it('retains all backend identities, metadata, Unicode, and data_map, ordered by sort_order', () => {
        const input = extensionResponse([extensionItem({ id: 502, field_key: 'other', sort_order: 10 }), extensionItem({ sort_order: 2, status: 'BACKEND_STATUS' })])
        const result = parseResidentExtensionData(input, 17699, true)

        expect(result.items.map(item => item.id)).toEqual([501, 502])
        expect(result.items[0]).toEqual(input.items[1])
        expect(result.data_map).toEqual(input.data_map)
        expect(result.total_items).toBe(2)
        expect(input.items[0].sort_order).toBe(10)
    })

    it('represents an empty confirmed GET as a real empty collection', () => {
        expect(parseResidentExtensionData(extensionResponse([]), 17699, true)).toEqual(extensionResponse([]))
    })

    it('accepts partial UPSERT without manufacturing a data_map or assuming full replacement', () => {
        const input = { ref_domain: 'Resident', ref_record_id: 17699, total_items: 3, items: [extensionItem()] }

        expect(parseResidentExtensionData(input, 17699, false)).toEqual(input)
    })

    it.each([
        {},
        { ...extensionResponse(), ref_record_id: 501 },
        { ...extensionResponse(), ref_domain: 'Apartment' },
        { ...extensionResponse(), data_map: { contact: 123 } },
        extensionResponse([extensionItem({ ref_record_id: 9 })]),
        extensionResponse([extensionItem({ field_key: '' })]),
        extensionResponse([extensionItem(), extensionItem()])
    ])('rejects malformed or mismatched records rather than clearing the form', input => {
        expect(() => parseResidentExtensionData(input, 17699, true)).toThrow()
    })

    it('uses field_key for saved identity and a separate client id for new drafts', () => {
        const row = toResidentExtensionDrafts(extensionResponse())[0]
        const request = buildResidentExtensionDataRequest(17699, [
            { ...row, field_value: ' Trần Thị B ' },
            { clientId: 'draft-1', field_label: ' Ghi chú ', field_value: ' Tiếng Việt ', sort_order: 2, status: 'A' }
        ])

        expect(request).toEqual({ ref_domain: 'Resident', ref_record_id: 17699, items: [
            { field_key: 'contact', field_label: 'Người liên hệ', field_value: 'Trần Thị B', sort_order: 1, status: 'A' },
            { field_label: 'Ghi chú', field_value: 'Tiếng Việt', sort_order: 2, status: 'A' }
        ] })
        expect(request.items[0]).not.toHaveProperty('id')
        expect(request.items[1]).not.toHaveProperty('field_key')
        expect(row.id).toBe(501)
    })
})
