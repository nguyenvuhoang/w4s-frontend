import type { WorkflowErrorPresentation } from '@/shared/utils/workflowError'
import type { ResidentDetail } from '../../types'

export type ResidentDetailPageState = 'ready' | 'not-found' | 'error'

export const getResidentDetailPageState = (
    detail: ResidentDetail | null,
    error: WorkflowErrorPresentation | null | undefined
): ResidentDetailPageState => {
    if (detail) return 'ready'
    if (error?.errorCode?.trim().toLowerCase() === 'ips.resident.id.notfound') return 'not-found'

    return 'error'
}

export const getResidentDetailFallbackFields = (detail: ResidentDetail): Array<[string, string | number]> => {
    const candidates: Array<[string, string | number | null | undefined]> = [
        ['resident_code', detail.resident_code],
        ['full_name', detail.full_name],
        ['phone', detail.phone],
        ['email', detail.email],
        ['identity_number', detail.identity_number],
        ['date_of_birth', detail.date_of_birth],
        ['gender', detail.gender],
        ['user_code', detail.user_code],
        ['nationality', detail.nationality === '' || detail.nationality === null || detail.nationality === undefined ? '--' : detail.nationality],
        ['description', detail.description === '' || detail.description === null || detail.description === undefined ? '--' : detail.description],
        ['id', detail.id]
    ]

    return candidates.reduce<Array<[string, string | number]>>((result, [key, value]) => {
        if (value !== null && value !== undefined && value !== '') result.push([key, value])

        return result
    }, [])
}
