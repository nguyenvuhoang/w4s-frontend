export type UserSessionFilterModel = {
    search_text: string
    channel_code: 'BO'
    page_index: number
    page_size: number
}

export type UserSessionSearchRequest = {
    page_size: number
    page_index: number
    search_text: string
    channel_code: 'BO'
}

export type UserSessionItem = {
    id: number
    user_id: string
    login_name: string
    ip_address: string
    expires_at: string | null
    is_revoked: boolean
    channel_id: string
    created_on_utc: string | null
    updated_on_utc: string | null
    channel_roles: string | null
    user_code: string
    branch_code: string
    user_name: string
    device: string | null
}

export type UserSessionSearchResponse = {
    items: UserSessionItem[]
    total_count: number
    total_pages: number
    has_previous_page: boolean
    has_next_page: boolean
    page_index: number
    page_size: number
}
