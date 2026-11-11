import type { Locale } from '@/configs/i18n'
import { workflowService } from '@/servers/system-service'

import { toOptionalText } from '../../propertyFieldHelpers'

import type {
    ApartmentResidentApartmentInfo,
    ApartmentResidentItem,
    ApartmentResidentManagementResult
} from '../../types'

export const GET_RESIDENTS_BY_APARTMENT_ID_WORKFLOW_ID = 'WF_BO_GET_LIST_RESIDENT_BY_APARTMENT_ID'

const normalizeKey = (key: string) => key.toLowerCase().replace(/[_\-\s]/g, '')

const getField = (item: any, keys: string[]) => {
    if (!item || typeof item !== 'object') return undefined

    for (const key of keys) {
        if (item[key] !== undefined && item[key] !== null) return item[key]
    }

    const normalizedMap = Object.keys(item).reduce<Record<string, any>>((acc, key) => {
        acc[normalizeKey(key)] = item[key]

        return acc
    }, {})

    for (const key of keys) {
        const value = normalizedMap[normalizeKey(key)]

        if (value !== undefined && value !== null) return value
    }

    return undefined
}

const pickDataRoot = (payload: any) => {
    const dataresponse = payload?.dataresponse ?? payload?.payload?.dataresponse
    const data = dataresponse?.data ?? payload?.data ?? payload

    return data?.data ?? data?.input ?? data
}

const toNumber = (value: any, fallback: number) => {
    const number_value = Number(value)

    return Number.isFinite(number_value) ? number_value : fallback
}

const toNullableNumber = (value: any) => {
    if (value === null || value === undefined || value === '') return null

    const number_value = Number(value)

    return Number.isFinite(number_value) ? number_value : null
}

const toBoolean = (value: any) => (
    value === true || value === 1 || value === '1' || value === 'true' || value === 'T' || value === 'Y'
)

const getWorkflowErrorMessage = (response: any, fallback: string) => {
    const dataresponse = response?.payload?.dataresponse ?? response?.dataresponse
    const errors = dataresponse?.errors ?? response?.payload?.errors ?? response?.errors ?? []

    if (Array.isArray(errors) && errors.length > 0) {
        return errors[0]?.info ?? errors[0]?.message ?? errors[0]?.description ?? fallback
    }

    return dataresponse?.message
        ?? dataresponse?.data?.message
        ?? response?.payload?.message
        ?? response?.message
        ?? fallback
}

const assertWorkflowSuccess = (response: any, fallback: string) => {
    const dataresponse = response?.payload?.dataresponse ?? response?.dataresponse
    const data = dataresponse?.data ?? response?.payload?.data ?? response?.data
    const errors = dataresponse?.errors ?? response?.payload?.errors ?? response?.errors ?? []
    const failed = response?.success === false
        || dataresponse?.success === false
        || data?.success === false
        || dataresponse?.code === 'failed'
        || data?.code === 'failed'

    if ((Array.isArray(errors) && errors.length > 0) || failed) {
        throw new Error(getWorkflowErrorMessage(response, fallback))
    }
}

const mapApartment = (item: any): ApartmentResidentApartmentInfo | null => {
    if (!item || typeof item !== 'object') return null

    return {
        apartment_id: toNumber(getField(item, ['apartment_id']), 0),
        apartment_code: String(getField(item, ['apartment_code']) ?? ''),
        project_id: toNumber(getField(item, ['project_id']), 0),
        building_id: toNumber(getField(item, ['building_id']), 0),
        floor_id: toNumber(getField(item, ['floor_id']), 0),
        floor: getField(item, ['floor']) ?? null,
        unit_number: getField(item, ['unit_number']) ?? null,
        area: toNullableNumber(getField(item, ['area'])),
        water_meter_code: getField(item, ['water_meter_code']) ?? null,
        payment_qr_code: getField(item, ['payment_qr_code']) ?? null,
        apartment_type: String(getField(item, ['apartment_type']) ?? ''),
        status: String(getField(item, ['status']) ?? '')
    }
}

const mapResident = (item: any): ApartmentResidentItem => ({
    resident_id: toNumber(getField(item, ['resident_id']), 0),
    apartment_id: toNumber(getField(item, ['apartment_id']), 0),
    project_id: toNumber(getField(item, ['project_id']), 0),
    resident_code: String(getField(item, ['resident_code']) ?? ''),
    login_name: toOptionalText(getField(item, ['login_name'])),
    user_code: getField(item, ['user_code']) ?? null,
    full_name: String(getField(item, ['full_name']) ?? ''),
    gender: String(getField(item, ['gender']) ?? ''),
    date_of_birth: getField(item, ['date_of_birth']) ?? null,
    phone: getField(item, ['phone']) ?? null,
    email: getField(item, ['email']) ?? null,
    avatar_url: getField(item, ['avatar_url']) ?? null,
    identity_number: getField(item, ['identity_number']) ?? null,
    role: String(getField(item, ['role']) ?? ''),
    is_representative: toBoolean(getField(item, ['is_representative'])),
    is_primary: toBoolean(getField(item, ['is_primary'])),
    is_location: toBoolean(getField(item, ['is_location'])),
    relationship_with_owner: getField(item, ['relationship_with_owner']) ?? null,
    effective_from: getField(item, ['effective_from']) ?? null,
    effective_to: getField(item, ['effective_to']) ?? null,
    resident_status: String(getField(item, ['resident_status']) ?? ''),
    resident_apartment_status: String(getField(item, ['resident_apartment_status']) ?? '')
})

export const apartmentResidentService = {
    getResidentsByApartmentId: async ({
        sessiontoken,
        language,
        apartment_id
    }: {
        sessiontoken?: string
        language?: Locale
        apartment_id: number
    }): Promise<ApartmentResidentManagementResult> => {
        if (!sessiontoken || !Number.isInteger(apartment_id) || apartment_id <= 0) {
            return { apartment: null, residents: [] }
        }

        const response = await workflowService.runFODynamic({
            sessiontoken,
            workflowid: GET_RESIDENTS_BY_APARTMENT_ID_WORKFLOW_ID,
            input: { apartment_id },
            language
        })

        assertWorkflowSuccess(response, 'Unable to load residents for this apartment.')

        const root = pickDataRoot(response?.payload ?? response)
        const apartment = mapApartment(getField(root, ['apartment']))
        const residentsRaw = getField(root, ['residents'])
        const residents = Array.isArray(residentsRaw) ? residentsRaw.map(mapResident) : []

        return { apartment, residents }
    }
}
