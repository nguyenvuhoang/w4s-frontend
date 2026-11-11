import { afterEach, describe, expect, it, vi } from 'vitest'

import { residentAuditHistoryService } from './residentAuditHistoryService'

describe('residentAuditHistoryService', () => {
    afterEach(() => vi.unstubAllGlobals())

    it('sends only the confirmed Resident.Id as entity_id to the BFF', async () => {
        const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ data: [] }), { status: 200 }))
        vi.stubGlobal('fetch', fetchMock)

        await residentAuditHistoryService.getHistory(27968, 'vi')

        expect(fetchMock).toHaveBeenCalledWith('/api/resident/audit-history', expect.objectContaining({
            method: 'POST',
            headers: { 'content-type': 'application/json', lang: 'vi' },
            body: JSON.stringify({ entity_id: 27968 })
        }))
    })

    it('retains the backend execution_id on errors', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({
            message: 'Không thể tải lịch sử.',
            execution_id: 'audit-execution-123'
        }), { status: 422 })))

        await expect(residentAuditHistoryService.getHistory(27968, 'vi')).rejects.toMatchObject({
            message: 'Không thể tải lịch sử.',
            executionId: 'audit-execution-123'
        })
    })

    it('accepts the endpoint array response without client-side pagination', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify([
            { id: 2, entity_name: 'Resident', entity_id: 27968, action_type: 'U', changes: '', user_id: 'actor', execution_id: 'e2', created_on_utc: '2026-09-13T03:00:00' }
        ]), { status: 200 })))

        await expect(residentAuditHistoryService.getHistory(27968, 'vi')).resolves.toMatchObject([{ id: 2, entity_id: 27968 }])
    })

    it('rejects invalid entity ids before making a request', async () => {
        const fetchMock = vi.fn()
        vi.stubGlobal('fetch', fetchMock)

        await expect(residentAuditHistoryService.getHistory(0, 'vi')).rejects.toThrow('Invalid resident entity id.')
        expect(fetchMock).not.toHaveBeenCalled()
    })
})
