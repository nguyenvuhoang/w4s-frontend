import type { EntityExtensionDataItem, GetEntityExtensionDataResponse, ResidentExtensionDataRequest, ResidentRelatedMember, UpsertEntityExtensionDataResponse } from '../relatedMembers.types'

const record = (value: unknown): Record<string, unknown> => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid entity extension data response.')

    return value as Record<string, unknown>
}

export function parseResidentExtensionData(data: unknown, residentId: number, requireMap: true): GetEntityExtensionDataResponse
export function parseResidentExtensionData(data: unknown, residentId: number, requireMap: false): UpsertEntityExtensionDataResponse
export function parseResidentExtensionData(data: unknown, residentId: number, requireMap: boolean): UpsertEntityExtensionDataResponse {
    const root = record(data)

    if (root.ref_domain !== 'Resident' || root.ref_record_id !== residentId
        || !Number.isInteger(root.total_items) || Number(root.total_items) < 0 || !Array.isArray(root.items))
        throw new Error('Invalid entity extension data reference or collection.')

    const keys = new Set<string>()
    const items = root.items.map((value): EntityExtensionDataItem => {
        const item = record(value)

        if (!Number.isInteger(item.id) || Number(item.id) <= 0
            || item.ref_domain !== 'Resident' || item.ref_record_id !== residentId
            || typeof item.field_key !== 'string' || !item.field_key.trim() || keys.has(item.field_key)
            || typeof item.field_label !== 'string' || typeof item.field_value !== 'string'
            || !Number.isInteger(item.sort_order) || typeof item.status !== 'string')
            throw new Error('Invalid entity extension data item.')

        keys.add(item.field_key)

        return {
            id: item.id as number, ref_domain: item.ref_domain, ref_record_id: residentId,
            field_key: item.field_key, field_label: item.field_label, field_value: item.field_value,
            sort_order: item.sort_order as number, status: item.status
        }
    }).sort((a, b) => a.sort_order - b.sort_order)

    let dataMap: Record<string, string> | undefined

    if (root.data_map !== undefined || requireMap) {
        const rawMap = record(root.data_map)

        if (Object.values(rawMap).some(value => typeof value !== 'string')) throw new Error('Invalid entity extension data map.')
        dataMap = Object.fromEntries(Object.entries(rawMap)) as Record<string, string>
    }

    return {
        ref_domain: 'Resident', ref_record_id: residentId, total_items: root.total_items as number, items,
        ...(dataMap === undefined ? {} : { data_map: dataMap })
    }
}

export const toResidentExtensionDrafts = (response: Pick<GetEntityExtensionDataResponse, 'items'>): ResidentRelatedMember[] =>
    response.items.map(item => ({ ...item, clientId: `saved:${item.ref_record_id}:${item.field_key}` }))

export const buildResidentExtensionDataRequest = (residentId: number, rows: ResidentRelatedMember[]): ResidentExtensionDataRequest => ({
    ref_domain: 'Resident',
    ref_record_id: residentId,
    items: rows.map(row => ({
        // Retain an existing official key; a new field deliberately has no field_key.
        ...(row.field_key ? { field_key: row.field_key } : {}),
        field_label: row.field_label.trim(), field_value: row.field_value.trim(),
        sort_order: row.sort_order, status: row.status
    }))
})
