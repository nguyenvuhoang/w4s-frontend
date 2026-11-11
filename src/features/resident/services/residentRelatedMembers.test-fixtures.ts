import type { EntityExtensionDataItem, GetEntityExtensionDataResponse } from '../relatedMembers.types'

export const extensionItem = (overrides: Partial<EntityExtensionDataItem> = {}): EntityExtensionDataItem => ({
    id: 501, ref_domain: 'Resident', ref_record_id: 17699,
    field_key: 'contact', field_label: 'Người liên hệ', field_value: 'Nguyễn Văn A', sort_order: 1, status: 'A',
    ...overrides
})

export const extensionResponse = (items = [extensionItem()]): GetEntityExtensionDataResponse => ({
    ref_domain: 'Resident', ref_record_id: 17699, total_items: items.length, items,
    data_map: Object.fromEntries(items.map(item => [item.field_key, item.field_value]))
})
