import { describe, expect, it, vi, beforeEach } from 'vitest'

import { workflowService } from '@/servers/system-service'
import { createResidentRelatedMembersService } from './residentRelatedMembersService'
import { extensionItem, extensionResponse } from './residentRelatedMembers.test-fixtures'
import { toResidentExtensionDrafts } from './residentRelatedMembers.mapper'

vi.mock('@/servers/system-service', () => ({ workflowService: { runFODynamic: vi.fn() } }))
beforeEach(() => vi.resetAllMocks())

const response = (data: unknown) => ({ status: 200, payload: { dataresponse: { success: true, data } } }) as any
const createService = () => createResidentRelatedMembersService({ sessiontoken: 'session', language: 'vi', scope: 'PROJECT_A' })

describe('all three Resident Entity Extension workflows', () => {
    it('GET sends request fields, not response fields, and retains metadata', async () => {
        vi.mocked(workflowService.runFODynamic).mockResolvedValue(response(extensionResponse()))
        const result = await createService().load(17699)

        expect(result).toEqual(extensionResponse())
        expect(workflowService.runFODynamic).toHaveBeenCalledWith({ sessiontoken: 'session', language: 'vi', scope: 'PROJECT_A',
            workflowid: 'WF_BO_GET_ENTITY_EXTENSION_DATA', input: { ref_domain: 'Resident', ref_record_id: 17699, status: 'A' } })
    })

    it('deduplicates in-flight GETs, including quick tab changes', async () => {
        let finish!: (value: any) => void
        vi.mocked(workflowService.runFODynamic).mockImplementation(() => new Promise(resolve => { finish = resolve }))
        const service = createService()
        const first = service.load(17699)
        const second = service.load(17699)

        expect(workflowService.runFODynamic).toHaveBeenCalledTimes(1)
        finish(response(extensionResponse()))
        expect(await first).toEqual(await second)
    })

    it('returns UPSERT items directly without GET, keeping official keys and partial count', async () => {
        const ack = { ref_domain: 'Resident', ref_record_id: 17699, total_items: 3, items: [extensionItem({ field_value: 'Mới' })] }
        vi.mocked(workflowService.runFODynamic).mockResolvedValue(response(ack))
        const drafts = toResidentExtensionDrafts(extensionResponse()).map(row => ({ ...row, field_value: ' Mới ' }))

        expect(await createService().save({ residentId: 17699, members: drafts })).toEqual(ack)
        expect(workflowService.runFODynamic).toHaveBeenCalledTimes(1)
        expect(vi.mocked(workflowService.runFODynamic).mock.calls[0][0]).toMatchObject({ workflowid: 'WF_BO_UPSERT_ENTITY_EXTENSION_DATA', input: {
            ref_domain: 'Resident', ref_record_id: 17699,
            items: [{ field_key: 'contact', field_label: 'Người liên hệ', field_value: 'Mới', sort_order: 1, status: 'A' }]
        } })
    })

    it('does not generate keys or send a field id as a Resident id for new rows', async () => {
        vi.mocked(workflowService.runFODynamic).mockResolvedValue(response({ ...extensionResponse(), data_map: undefined }))
        await createService().save({ residentId: 17699, members: [{ clientId: 'temporary', field_label: ' Tên ', field_value: ' A ', sort_order: 1, status: 'A' }] })
        const input = vi.mocked(workflowService.runFODynamic).mock.calls[0][0].input

        expect(input.ref_record_id).toBe(17699)
        expect(input.items).toEqual([{ field_label: 'Tên', field_value: 'A', sort_order: 1, status: 'A' }])
    })

    it('DELETE uses the real key and invalidates old in-flight GET reuse', async () => {
        vi.mocked(workflowService.runFODynamic).mockResolvedValue(response({ deleted: true }))
        await createService().delete({ residentId: 17699, fieldKey: 'backend:key' })

        expect(vi.mocked(workflowService.runFODynamic).mock.calls[0][0]).toMatchObject({ workflowid: 'WF_BO_DELETE_ENTITY_EXTENSION_DATA',
            input: { ref_domain: 'Resident', ref_record_id: 17699, field_key: 'backend:key' } })
    })

    it.each(['GET', 'UPSERT', 'DELETE'])('preserves workflow execution references on %s failure', async operation => {
        vi.mocked(workflowService.runFODynamic).mockResolvedValue({ status: 200, payload: { dataresponse: {
            success: false, execution_id: 'exec-123', errors: [{ info: 'Access denied' }]
        } } } as any)
        const service = createService()
        const request = operation === 'GET' ? service.load(17699) : operation === 'DELETE'
            ? service.delete({ residentId: 17699, fieldKey: 'contact' })
            : service.save({ residentId: 17699, members: toResidentExtensionDrafts(extensionResponse()) })

        await expect(request).rejects.toMatchObject({ executionId: 'exec-123' })
    })

    it('rejects malformed UPSERT acknowledgements and mismatched GET data', async () => {
        vi.mocked(workflowService.runFODynamic).mockResolvedValue(response({ updated_count: 1 }))
        await expect(createService().save({ residentId: 17699, members: toResidentExtensionDrafts(extensionResponse()) })).rejects.toThrow()
        vi.mocked(workflowService.runFODynamic).mockResolvedValue(response({ ...extensionResponse(), ref_record_id: 501 }))
        await expect(createService().load(17699)).rejects.toThrow()
    })

    it('unwraps a double-nested data.data envelope the same as a direct data envelope', async () => {
        const ack = { ref_domain: 'Resident', ref_record_id: 17699, total_items: 1, items: [extensionItem({ field_key: 'bien_so_xe', field_value: '29A-888.99' })] }

        vi.mocked(workflowService.runFODynamic).mockResolvedValue({ status: 200, payload: { dataresponse: { success: true, data: { data: ack } } } } as any)
        await expect(createService().save({ residentId: 17699, members: [{ clientId: 't', field_label: 'Biển số xe', field_value: '29A-888.99', sort_order: 1, status: 'A' }] }))
            .resolves.toEqual(ack)
    })

    it('rejects rather than swallows a network/timeout failure during UPSERT, keeping the draft unconfirmed', async () => {
        vi.mocked(workflowService.runFODynamic).mockRejectedValue(new Error('network timeout'))
        await expect(createService().save({ residentId: 17699, members: [{ clientId: 't', field_label: 'Biển số xe', field_value: '29A-888.99', sort_order: 1, status: 'A' }] }))
            .rejects.toThrow('network timeout')
    })

    it('uses the exact same ref_record_id for GET, UPSERT and DELETE on resident 18601', async () => {
        vi.mocked(workflowService.runFODynamic).mockResolvedValue(response({ ref_domain: 'Resident', ref_record_id: 18601, total_items: 0, items: [], data_map: {} }))
        const service = createService()

        await service.load(18601)
        await service.save({ residentId: 18601, members: [{ clientId: 't', field_label: 'Biển số xe', field_value: '29A-888.99', sort_order: 1, status: 'A' }] })
        await service.delete({ residentId: 18601, fieldKey: 'bien_so_xe' })

        const refRecordIds = vi.mocked(workflowService.runFODynamic).mock.calls.map(call => call[0].input.ref_record_id)

        expect(refRecordIds).toEqual([18601, 18601, 18601])
    })

    it('rejects missing names, credentials, empty UPSERT, invalid record ids and blank delete keys before transport', async () => {
        const service = createService()
        await expect(service.save({ residentId: 17699, members: [] })).rejects.toThrow()
        await expect(service.save({ residentId: 17699, members: [{ clientId: 't', field_label: ' ', field_value: '', sort_order: 1, status: 'A' }] })).rejects.toThrow()
        await expect(service.load(0)).rejects.toThrow()
        await expect(service.delete({ residentId: 17699, fieldKey: ' ' })).rejects.toThrow()
        await expect(createResidentRelatedMembersService({}).load(17699)).rejects.toThrow()
        expect(workflowService.runFODynamic).not.toHaveBeenCalled()
    })
})
