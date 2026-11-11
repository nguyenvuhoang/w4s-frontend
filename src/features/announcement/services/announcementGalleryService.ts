// Browses images already stored under the announcement avatar folder in MinIO
// (`announcements/avatar/`). Upload and presigned-view are intentionally NOT duplicated here —
// this reuses `announcementAvatarUploadService.upload` / `.prepareViewUrl`, which already own the
// upload + view contract for that same prefix.
export const ANNOUNCEMENT_AVATAR_PREFIX = 'announcements/avatar/'

export type AnnouncementGalleryImage = {
    object_key: string
    file_name: string
    size: number
    last_modified: string
    content_type: string
}

export type AnnouncementGalleryListResult = {
    items: AnnouncementGalleryImage[]
    total_count: number
    page: number
    page_size: number
    has_next_page: boolean
}

export const announcementGalleryService = {
    async listImages({
        searchText = '',
        page = 1,
        pageSize = 30
    }: { searchText?: string; page?: number; pageSize?: number } = {}): Promise<AnnouncementGalleryListResult> {
        const params = new URLSearchParams({
            prefix: ANNOUNCEMENT_AVATAR_PREFIX,
            page: String(page),
            page_size: String(pageSize)
        })

        if (searchText.trim()) params.set('search', searchText.trim())

        const response = await fetch(`/api/storage/images?${params.toString()}`)
        const json = await response.json().catch(() => ({}))

        if (!response.ok || json?.success === false) {
            throw new Error(json?.message ?? 'Unable to load gallery images.')
        }

        const data = json?.data ?? {}

        return {
            items: Array.isArray(data.items) ? data.items : [],
            total_count: Number(data.total_count) || 0,
            page: Number(data.page) || page,
            page_size: Number(data.page_size) || pageSize,
            has_next_page: Boolean(data.has_next_page)
        }
    }
}
