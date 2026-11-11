import type { Locale } from '@/configs/i18n'
import { workflowService } from '@/servers/system-service'
import { createWorkflowError } from '@/shared/utils/workflowError'

import type { GetEntityExtensionDataResponse, ResidentRelatedMembersService } from '../relatedMembers.types'
import { validateRelatedMembers } from '../utils/residentRelatedMembers'
import { buildResidentExtensionDataRequest, parseResidentExtensionData } from './residentRelatedMembers.mapper'
import { DELETE_ENTITY_EXTENSION_DATA_WORKFLOW_ID, GET_ENTITY_EXTENSION_DATA_WORKFLOW_ID, UPSERT_ENTITY_EXTENSION_DATA_WORKFLOW_ID } from './residentWorkflowIds'

type Options = { sessiontoken?: string; language?: Locale; scope?: string }

const assertSuccess = (response: any): unknown => {
    const payload = response?.payload ?? response
    const root = payload?.dataresponse ?? payload
    const data = root?.data
    const failed = [payload, root, data].some(value => value && (
        value.success === false || value.code === 'failed' || String(value.result ?? '').toUpperCase() === 'ERROR'
        || (Array.isArray(value.errors) && value.errors.length > 0)
        || (Array.isArray(value.error) && value.error.length > 0)
        || (value.error && typeof value.error === 'object' && !Array.isArray(value.error))
    ))

    if ((response?.status ?? 200) >= 400 || failed || !(root?.success === true || payload?.success === true || data !== undefined))
        throw createWorkflowError(response, { fallback: 'Unable to process entity extension data.' })

    return data?.data ?? data?.input ?? data
}

const readCollection = (response: unknown, residentId: number, requireMap: boolean) => {
    const data = assertSuccess(response)

    try {
        return requireMap ? parseResidentExtensionData(data, residentId, true) : parseResidentExtensionData(data, residentId, false)
    } catch {
        throw createWorkflowError(response, { fallback: 'Invalid entity extension data response.' })
    }
}

export const createResidentRelatedMembersService = (options: Options): ResidentRelatedMembersService => {
    const inFlightReads = new Map<number, Promise<GetEntityExtensionDataResponse>>()
    const execute = (workflowid: string, input: Record<string, unknown>) => {
        if (!options.sessiontoken) throw new Error('RELATED_MEMBERS_AUTH_REQUIRED')
        if (!Number.isInteger(input.ref_record_id) || Number(input.ref_record_id) <= 0) throw new Error('RELATED_MEMBERS_INVALID')

        return workflowService.runFODynamic({ ...options, sessiontoken: options.sessiontoken, workflowid, input })
    }

    return {
        load: async residentId => {
            const pending = inFlightReads.get(residentId)

            if (pending) return pending
            const request = (async () => {
                const response = await execute(GET_ENTITY_EXTENSION_DATA_WORKFLOW_ID, { ref_domain: 'Resident', ref_record_id: residentId, status: 'A' })

                return readCollection(response, residentId, true) as GetEntityExtensionDataResponse
            })()

            inFlightReads.set(residentId, request)
            try { return await request }
            finally { if (inFlightReads.get(residentId) === request) inFlightReads.delete(residentId) }
        },
        save: async ({ residentId, members }) => {
            if (!members.length || validateRelatedMembers(members).some(row => row.field_label)) throw new Error('RELATED_MEMBERS_INVALID')
            const response = await execute(UPSERT_ENTITY_EXTENSION_DATA_WORKFLOW_ID, { ...buildResidentExtensionDataRequest(residentId, members) })
            const result = readCollection(response, residentId, false)

            inFlightReads.delete(residentId)

            return result
        },
        delete: async ({ residentId, fieldKey }) => {
            if (!fieldKey.trim()) throw new Error('RELATED_MEMBERS_INVALID')
            const response = await execute(DELETE_ENTITY_EXTENSION_DATA_WORKFLOW_ID, {
                ref_domain: 'Resident', ref_record_id: residentId, field_key: fieldKey
            })

            assertSuccess(response)
            inFlightReads.delete(residentId)
        }
    }
}
