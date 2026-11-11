import { readFileSync } from 'node:fs'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import type { EntityAuditItem } from '@/shared/types/entityAudit'

vi.mock('@mui/material', async () => {
    const { createElement: h, Fragment } = await import('react')
    const Stub = ({ children, label, title }: { children?: React.ReactNode; label?: React.ReactNode; title?: React.ReactNode }) => h(Fragment, null, label ?? null, children ?? null, typeof title === 'string' ? null : null)

    return {
        Alert: Stub, Box: Stub, Button: Stub, Chip: Stub, CircularProgress: () => h('progress'), Divider: Stub, IconButton: Stub,
        Paper: Stub, Stack: Stub, Tooltip: Stub, Typography: Stub
    }
})
vi.mock('@mui/icons-material/CalendarMonthOutlined', () => ({ default: () => createElement('i', { 'data-icon': 'calendar' }) }))
vi.mock('@mui/icons-material/ContentCopyOutlined', () => ({ default: () => null }))
vi.mock('@mui/icons-material/HistoryOutlined', () => ({ default: () => null }))
vi.mock('@mui/icons-material/RefreshOutlined', () => ({ default: () => null }))

let service: typeof import('@/shared/services/entityAuditService')
let EntityAuditHistoryView: typeof import('./EntityAuditHistory').EntityAuditHistoryView
let helpers: typeof import('@/shared/utils/entityAuditHelpers')

beforeAll(async () => {
    service = await import('@/shared/services/entityAuditService')
    ;({ EntityAuditHistoryView } = await import('./EntityAuditHistory'))
    helpers = await import('@/shared/utils/entityAuditHelpers')
})

afterEach(() => vi.unstubAllGlobals())

describe('entityAuditService', () => {
    it('posts { entity_name, entity_id } to the generic BFF', async () => {
        const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify([]), { status: 200 }))
        vi.stubGlobal('fetch', fetchMock)

        await service.entityAuditService.getHistory('Building', 76, 'vi')

        expect(fetchMock).toHaveBeenCalledWith('/api/entity-audit', expect.objectContaining({
            method: 'POST',
            headers: { 'content-type': 'application/json', lang: 'vi' },
            body: JSON.stringify({ entity_name: 'Building', entity_id: 76 })
        }))
    })

    it('does not call the API without a valid id', async () => {
        const fetchMock = vi.fn()
        vi.stubGlobal('fetch', fetchMock)

        await expect(service.entityAuditService.getHistory('Project', 0, 'vi')).rejects.toThrow('Invalid audit entity id.')
        await expect(service.entityAuditService.getHistory('Floor', Number.NaN, 'vi')).rejects.toThrow()
        expect(fetchMock).not.toHaveBeenCalled()
    })

    it('keeps the execution_id of an error', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ message: 'Lỗi', execution_id: 'exec-1' }), { status: 422 })))

        await expect(service.entityAuditService.getHistory('Project', 1, 'vi')).rejects.toMatchObject({ message: 'Lỗi', executionId: 'exec-1' })
    })

    it('maps the array response', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify([
            { id: 5, entity_name: 'Floor', entity_id: 3, action_type: 'U', changes: '[]', user_id: 'u', execution_id: 'e', created_on_utc: '2026-09-13T00:15:00' }
        ]), { status: 200 })))

        await expect(service.entityAuditService.getHistory('Floor', 3, 'vi')).resolves.toMatchObject([{ id: 5, entity_name: 'Floor', entity_id: 3 }])
    })
})

describe('useEntityAuditHistory', () => {
    const hook = readFileSync(new URL('../../hooks/useEntityAuditHistory.ts', import.meta.url), 'utf8')

    it('does not request without a valid id and refetches when the id changes', () => {
        expect(hook).toContain('if (!enabled || !entityId || !Number.isInteger(entityId) || entityId <= 0)')
        expect(hook).toContain('}, [enabled, entityId, loader, reloadKey, refreshKey])')
    })

    it('reloads when the parent bumps refreshKey (e.g. after a successful update)', () => {
        expect(hook).toContain('refreshKey = 0')
        expect(hook).toContain('refreshKey?: number')
    })

    it('clears the previous record history before loading another one and ignores stale responses', () => {
        expect(hook).toContain('setItems([]); setLoading(true); setError(null)')
        expect(hook).toContain('requestRef.current?.abort()')
        expect(hook).toContain('if (current && !controller.signal.aborted) setItems(data)')
    })
})

describe('EntityAuditHistory component', () => {
    const t = (_key: string, fallback: string) => fallback
    const item = (overrides: Partial<EntityAuditItem> = {}): EntityAuditItem => ({
        id: 1, entity_name: 'Building', entity_id: 76, user_id: 'actor-1', user_name: 'Admin Supper', execution_id: 'exec-9', action_type: 'U',
        changes: JSON.stringify([{ FieldName: 'SomeNewColumn', OldValue: null, NewValue: 'B' }]),
        created_on_utc: '2026-09-13T00:15:00', updated_on_utc: null, ...overrides
    })
    const render = (props: Record<string, unknown>) => renderToStaticMarkup(createElement(EntityAuditHistoryView, {
        title: 'Lịch sử thay đổi', t, locale: 'vi', items: [], loading: false, error: null, onReload: vi.fn(), ...props
    }))

    it('shows loading, error (with reference) and empty states', () => {
        expect(render({ loading: true })).toContain('Đang tải lịch sử thao tác')
        expect(render({ error: { message: 'Boom', executionId: 'ref-1' } })).toContain('Mã tra cứu lỗi: ref-1')
        expect(render({})).toContain('Chưa có lịch sử thao tác')
    })

    it('renders unknown fields generically with "--"-style empty values, and the time in Vietnam time', () => {
        const html = render({ items: [item()] })

        expect(html).toContain('Lịch sử thay đổi')
        expect(html).toContain('SomeNewColumn')
        expect(html).toContain('Trống')
        expect(html).toContain('B')
        expect(html).toContain('13/09/2026 07:15:00')
        expect(html).toContain('exec-9')
    })

    it('highlights the timestamp: calendar icon on the same row, primary text, fontWeight 600, with seconds', () => {
        const html = render({ items: [item()] })
        const source = readFileSync(new URL('./EntityAuditHistory.tsx', import.meta.url), 'utf8')

        expect(html).toContain('data-icon="calendar"')
        expect(html.indexOf('data-icon="calendar"')).toBeLessThan(html.indexOf('13/09/2026 07:15:00'))
        expect(source).toContain('<CalendarMonthOutlinedIcon color="primary" sx={{ fontSize: 18 }} />')
        expect(source).toContain("color=\"text.primary\" sx={{ fontWeight: 600")
        expect(source).toContain('formatAuditDateTime(item.created_on_utc, locale, { withSeconds: true })')
    })

    it('timestamp comes before the action and actor (visual hierarchy)', () => {
        const html = render({ items: [item()] })

        expect(html.indexOf('13/09/2026 07:15:00')).toBeLessThan(html.indexOf('update'))
        expect(html.indexOf('13/09/2026 07:15:00')).toBeLessThan(html.indexOf('Người thực hiện'))
    })

    it('reuses the existing UTC -> Asia/Ho_Chi_Minh formatter (datetime, not date-only)', () => {
        expect(helpers.formatAuditDateTime('2026-09-13T00:15:00', 'vi')).toBe('13/09/2026 07:15')
        expect(helpers.formatAuditDateTime('2026-09-12T20:30:00Z', 'en')).toBe('13/09/2026 03:30')
        expect(helpers.formatAuditDateTime('2026-09-27T03:35:42', 'vi', { withSeconds: true })).toBe('27/09/2026 10:35:42')
    })

    it('"Người thực hiện" shows user_name (not the user id)', () => {
        const html = render({ items: [item()] })
        const actor = html.slice(html.indexOf('Người thực hiện'))

        expect(actor).toMatch(/^Người thực hiện:\s*(<[^>]*>)*Admin Supper/)
        expect(actor.slice(0, 80)).not.toContain('actor-1')
    })

    it('user_name wins over the older actor fields when both are present', () => {
        const html = render({ items: [item({ user_id: 'c998a642-0000-4000-8000-000000000001', user_name: 'Nguyễn Văn A' })] })

        expect(html).toContain('Nguyễn Văn A')
        expect(html).not.toContain('c998a642…')
    })

    it('empty user_name (null / "" / whitespace) falls back to "-", never "undefined" / "null"', async () => {
        for (const raw of [null, '', '   ', undefined]) {
            const [mapped] = service.parseEntityAuditItems([{ id: 1, entity_name: 'Floor', entity_id: 3, user_id: 'u-1', user_name: raw, action_type: 'I', changes: '[]' }])
            const html = render({ items: [mapped] })

            expect(mapped.user_name).toBe('')
            expect(html).toMatch(/Người thực hiện:\s*(<[^>]*>)*-/)
            expect(html).not.toMatch(/undefined|>null</)
        }
    })

    it('only fetches when active (lazy) and follows the entity id', () => {
        const source = readFileSync(new URL('./EntityAuditHistory.tsx', import.meta.url), 'utf8')

        expect(source).toContain('useEntityAuditHistory({ entityId, loader, enabled: active, refreshKey })')
    })

    it('fetches with the given entity name and the id of the opened record', () => {
        const source = readFileSync(new URL('./EntityAuditHistory.tsx', import.meta.url), 'utf8')

        expect(source).toContain('entityAuditService.getHistory(entityName, id, locale, signal)')
    })
})

describe('audit noise cleanup (generic)', () => {
    const change = (OldValue: unknown, NewValue: unknown, FieldName = 'Field') => ({ FieldName, OldValue, NewValue, Delta: null })

    it('hides EMPTY -> EMPTY and same-value changes', () => {
        expect(helpers.isMeaningfulAuditChange(change(null, null))).toBe(false)
        expect(helpers.isMeaningfulAuditChange(change('', ''))).toBe(false)
        expect(helpers.isMeaningfulAuditChange(change(' ', null))).toBe(false)
        expect(helpers.isMeaningfulAuditChange(change(null, ''))).toBe(false)
        expect(helpers.isMeaningfulAuditChange(change(undefined, '   '))).toBe(false)
        expect(helpers.isMeaningfulAuditChange(change('A', 'A'))).toBe(false)
        expect(helpers.isMeaningfulAuditChange(change(' A ', 'A'))).toBe(false)
    })

    it('keeps real changes, including deletions, without over-normalizing', () => {
        expect(helpers.isMeaningfulAuditChange(change(null, 'A'))).toBe(true)
        expect(helpers.isMeaningfulAuditChange(change('A', null))).toBe(true)
        expect(helpers.isMeaningfulAuditChange(change('A', ''))).toBe(true)
        expect(helpers.isMeaningfulAuditChange(change('A', 'B'))).toBe(true)
        expect(helpers.isMeaningfulAuditChange(change('abc', 'ABC'))).toBe(true)
        expect(helpers.isMeaningfulAuditChange(change(1, '1'))).toBe(true)
    })

    it('drops metadata fields shown in the header (UpdatedBy, ...) and configured hidden fields', () => {
        const changes = [
            change('RESIDENTIAL', null, 'ProjectType'),
            change(null, 'c998a642', 'UpdatedBy'),
            change(null, '2026-09-06', 'updated_on_utc'),
            change(null, 'Test description', 'Description')
        ]

        expect(helpers.getVisibleAuditChanges(changes).map(item => item.FieldName)).toEqual(['ProjectType', 'Description'])
        expect(helpers.getVisibleAuditChanges(changes, ['ProjectType']).map(item => item.FieldName)).toEqual(['Description'])
        expect(helpers.AUDIT_METADATA_FIELDS).toEqual(['UpdatedBy', 'CreatedBy', 'UpdatedOnUtc', 'CreatedOnUtc', 'ExecutionId', 'UserName'])
    })

    const record = (id: number, action: string, changes: unknown) => ({
        id, entity_name: 'Project', entity_id: 1, user_id: 'c998a642', user_name: 'Admin Supper', execution_id: `e${id}`, action_type: action,
        changes: typeof changes === 'string' ? changes : JSON.stringify(changes), created_on_utc: `2026-09-0${id}T09:59:00`, updated_on_utc: null
    })

    it('user_name is audit metadata, never a business changed field (any casing)', () => {
        const changes = [change('Old', 'Admin Supper', 'user_name'), change(null, 'X', 'UserName'), change('A', 'B', 'Name')]

        expect(helpers.getVisibleAuditChanges(changes).map(item => item.FieldName)).toEqual(['Name'])
    })

    it('drops update records left without business changes, keeps create/delete and unreadable ones', () => {
        const entries = helpers.buildAuditDisplayEntries([
            record(1, 'U', [change(null, null, 'Investor'), change(null, 'c998', 'UpdatedBy')]),
            record(2, 'I', [change(null, 'c998', 'CreatedBy')]),
            record(3, 'D', []),
            record(4, 'U', 'not json'),
            record(5, 'U', [change(null, 'Test description', 'Description')])
        ])

        expect(entries.map(entry => entry.item.id)).toEqual([5, 4, 3, 2])
        expect(entries.find(entry => entry.item.id === 4)?.malformed).toBe(true)
    })

    it('screenshot example: only Description remains for the Project update of 06/09', () => {
        const html = renderToStaticMarkup(createElement(EntityAuditHistoryView, {
            title: 'Lịch sử thay đổi',
            t: (_key: string, fallback: string) => fallback,
            locale: 'vi',
            loading: false,
            error: null,
            onReload: vi.fn(),
            hiddenFields: ['ProjectType'],
            items: [record(6, 'U', [
                change('RESIDENTIAL', null, 'ProjectType'),
                change(null, null, 'Investor'),
                change(null, null, 'Province'),
                change(null, 'Test description', 'Description'),
                change(null, null, 'LogoUrl'),
                change(null, 'c998a642861a40e29989ca77873ddbd7', 'UpdatedBy')
            ])]
        }))

        expect(html).toContain('Description')
        expect(html).toContain('Test description')
        expect(html).toContain('Trống')
        for (const hidden of ['ProjectType', 'RESIDENTIAL', 'Investor', 'Province', 'LogoUrl', 'UpdatedBy', 'c998a642861a40e29989ca77873ddbd7']) {
            expect(html).not.toContain(hidden)
        }
    })

    it('shows the empty state instead of empty cards when nothing meaningful is left', () => {
        const html = renderToStaticMarkup(createElement(EntityAuditHistoryView, {
            title: 'Lịch sử thay đổi',
            t: (_key: string, fallback: string) => fallback,
            locale: 'vi',
            loading: false,
            error: null,
            onReload: vi.fn(),
            items: [record(1, 'U', [change('', null, 'Investor')])]
        }))

        expect(html).toContain('Chưa có lịch sử thao tác')
        expect(html).not.toContain('data-icon="calendar"')
    })
})

describe('EntityAuditHistory with an entity label map', () => {
    it('Apartment: posts entity_name "Apartment" with the apartment id', async () => {
        const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify([]), { status: 200 }))
        vi.stubGlobal('fetch', fetchMock)

        await service.entityAuditService.getHistory('Apartment', 123, 'vi')

        expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ entity_name: 'Apartment', entity_id: 123 })
    })

    it('uses the provided label for known fields and the Backend name for unknown ones', () => {
        const html = renderToStaticMarkup(createElement(EntityAuditHistoryView, {
            title: 'Lịch sử thay đổi',
            t: (_key: string, fallback: string) => fallback,
            fieldLabel: (fieldName: string) => ({ WaterMeterCode: 'Mã đồng hồ nước' } as Record<string, string>)[fieldName] ?? fieldName,
            locale: 'vi',
            loading: false,
            error: null,
            onReload: vi.fn(),
            items: [{
                id: 1, entity_name: 'Apartment', entity_id: 123, user_id: 'u', user_name: 'Admin Supper', execution_id: 'e', action_type: 'U',
                changes: JSON.stringify([
                    { FieldName: 'WaterMeterCode', OldValue: 'W1', NewValue: 'W2' },
                    { FieldName: 'SomethingNew', OldValue: null, NewValue: 'X' },
                    { FieldName: 'Area', OldValue: 70, NewValue: 70 },
                    { FieldName: 'UpdatedBy', OldValue: null, NewValue: 'u' }
                ]),
                created_on_utc: '2026-09-27T03:35:42', updated_on_utc: null
            }]
        }))

        expect(html).toContain('Mã đồng hồ nước')
        expect(html).not.toContain('WaterMeterCode')
        expect(html).toContain('SomethingNew')
        expect(html).not.toContain('Area')
        expect(html).not.toContain('UpdatedBy')
        expect(html).toContain('27/09/2026 10:35:42')
        expect(html).toContain('data-icon="calendar"')
    })

    it('generic component resolves labels from the map with a raw-name fallback', () => {
        const source = readFileSync(new URL('./EntityAuditHistory.tsx', import.meta.url), 'utf8')

        expect(source).toContain('const fieldLabel = (fieldName: string) => fieldLabels?.[fieldName] ?? rawFieldLabel(fieldName)')
    })
})
