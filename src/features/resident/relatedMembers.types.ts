export interface EntityExtensionDataItem {
    id: number
    ref_domain: string
    ref_record_id: number
    field_key: string
    field_label: string
    field_value: string
    sort_order: number
    status: string
}

export interface UpsertEntityExtensionDataResponse {
    ref_domain: string
    ref_record_id: number
    total_items: number
    items: EntityExtensionDataItem[]
    data_map?: Record<string, string>
}

export interface GetEntityExtensionDataResponse extends UpsertEntityExtensionDataResponse {
    data_map: Record<string, string>
}

// A temporary clientId is not a backend key. Saved rows retain every server field.
export type ResidentRelatedMember = Partial<Pick<EntityExtensionDataItem, 'id' | 'ref_domain' | 'ref_record_id' | 'field_key'>> & {
    clientId: string
    pendingCreate?: { field_label: string; field_value: string; sort_order: number; status: string }
    field_label: string
    field_value: string
    sort_order: number
    status: string
}

export type ResidentExtensionDataRequest = {
    ref_domain: 'Resident'
    ref_record_id: number
    items: Array<{
        field_key?: string
        field_label: string
        field_value: string
        sort_order: number
        status: string
    }>
}

export type ResidentRelatedMembersSaveRequest = {
    residentId: number
    members: ResidentRelatedMember[]
}

export interface ResidentRelatedMembersService {
    load(residentId: number): Promise<GetEntityExtensionDataResponse>
    save(request: ResidentRelatedMembersSaveRequest): Promise<UpsertEntityExtensionDataResponse>
    delete(request: { residentId: number; fieldKey: string }): Promise<void>
}
