import { describe, expect, it } from 'vitest'

import {
    formatResidentAuditDateTime,
    getAuditActionPresentation,
    parseAuditChanges,
    sortAuditItemsNewestFirst
} from './residentAuditHistoryHelpers'

describe('resident audit history helpers', () => {
    it('parses one updated field', () => {
        expect(parseAuditChanges('[{"FieldName":"Email","OldValue":"old@example.com","NewValue":"new@example.com","Delta":null}]')).toEqual([
            { FieldName: 'Email', OldValue: 'old@example.com', NewValue: 'new@example.com', Delta: null }
        ])
    })

    it('parses multiple updated fields', () => {
        expect(parseAuditChanges('[{"FieldName":"FullName","OldValue":"A","NewValue":"B"},{"FieldName":"PhoneNumber","OldValue":"1","NewValue":"2"}]')).toHaveLength(2)
    })

    it('returns no changes for an empty value or invalid JSON', () => {
        expect(parseAuditChanges('')).toEqual([])
        expect(parseAuditChanges('{not-json')).toEqual([])
    })

    it('preserves null old and new values', () => {
        expect(parseAuditChanges('[{"FieldName":"Description","OldValue":null,"NewValue":null}]')).toEqual([
            { FieldName: 'Description', OldValue: null, NewValue: null, Delta: undefined }
        ])
    })

    it('maps known and unknown action types', () => {
        expect(getAuditActionPresentation('I').label).toBe('create')
        expect(getAuditActionPresentation('U').color).toBe('info')
        expect(getAuditActionPresentation('D').color).toBe('error')
        expect(getAuditActionPresentation('ARCHIVE').label).toBe('other')
    })

    it('sorts newest audit records first', () => {
        const items = sortAuditItemsNewestFirst([
            { id: 1, created_on_utc: '2026-09-13T01:00:00' },
            { id: 2, created_on_utc: '2026-09-13T03:00:00Z' },
            { id: 3, created_on_utc: '2026-09-13T02:00:00+00:00' }
        ])

        expect(items.map(item => item.id)).toEqual([2, 3, 1])
    })

    it('treats timestamps without an offset as UTC and does not add a second offset', () => {
        expect(formatResidentAuditDateTime('2026-09-13T00:15:00', 'vi')).toBe('13/09/2026 07:15')
        expect(formatResidentAuditDateTime('2026-09-13T00:15:00Z', 'vi')).toBe('13/09/2026 07:15')
        expect(formatResidentAuditDateTime('2026-09-13T07:15:00+07:00', 'vi')).toBe('13/09/2026 07:15')
    })
})
