import { MAX_ANNOUNCEMENT_FILE_SIZE } from '../types'

const ALLOWED_AVATAR_CONTENT_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
const ALLOWED_AVATAR_EXTENSIONS = ['png', 'jpg', 'jpeg', 'webp']
const UPLOAD_TIMEOUT_MS = 30000

export type AnnouncementAvatarUploadResult = {
    upload_url: string
    object_key: string
    object_name: string
    bucket_name?: string
    expires_in?: number
}

export const validateAnnouncementAvatarFile = (file: File) => {
    const extension = file.name.split('.').pop()?.toLowerCase() ?? ''

    return ALLOWED_AVATAR_CONTENT_TYPES.includes(file.type)
        && ALLOWED_AVATAR_EXTENSIONS.includes(extension)
        && file.size <= MAX_ANNOUNCEMENT_FILE_SIZE
}

export const isAnnouncementAvatarObjectKey = (value?: string | null) => (
    Boolean(value)
    && String(value).startsWith('announcements/avatar/')
    && !String(value).includes('..')
    && !String(value).includes('\\')
)

const parsePrepareResponse = (json: any): AnnouncementAvatarUploadResult => {
    const data = json?.data ?? json
    const upload_url = String(data?.upload_url ?? '')
    const object_name = String(data?.object_name ?? data?.object_key ?? '')

    if (!upload_url || !object_name) {
        throw new Error(json?.message ?? 'Invalid upload URL response.')
    }

    return {
        upload_url,
        object_key: String(data?.object_key ?? object_name),
        object_name,
        bucket_name: data?.bucket_name,
        expires_in: data?.expires_in
    }
}

const fetchWithTimeout = async (input: RequestInfo | URL, init: RequestInit, timeoutMs = UPLOAD_TIMEOUT_MS) => {
    const controller = new AbortController()
    const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs)

    try {
        return await fetch(input, {
            ...init,
            signal: controller.signal
        })
    } finally {
        window.clearTimeout(timeoutId)
    }
}

export const announcementAvatarUploadService = {
    async upload(file: File): Promise<AnnouncementAvatarUploadResult> {
        const prepareResponse = await fetch('/api/announcements/avatar/presign-upload', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                file_name: file.name,
                content_type: file.type,
                file_size: file.size
            })
        })

        const prepareJson = await prepareResponse.json().catch(() => ({}))

        if (!prepareResponse.ok || prepareJson?.success === false) {
            throw new Error(prepareJson?.message ?? 'Unable to prepare upload URL.')
        }

        const prepared = parsePrepareResponse(prepareJson)
        const uploadResponse = await fetchWithTimeout(prepared.upload_url, {
            method: 'PUT',
            headers: {
                'Content-Type': file.type
            },
            body: file
        })

        if (!uploadResponse.ok) {
            throw new Error('Unable to upload image.')
        }

        return prepared
    },

    async prepareViewUrl(object_key: string): Promise<string> {
        const params = new URLSearchParams({ object_key })
        const response = await fetch(`/api/storage/prepare-view?${params.toString()}`)
        const json = await response.json().catch(() => ({}))

        if (!response.ok || json?.success === false) {
            throw new Error(json?.message ?? 'Unable to prepare view URL.')
        }

        const viewUrl = String(json?.data?.view_url ?? json?.data?.download_url ?? '')

        if (!viewUrl) throw new Error('View URL is empty.')

        return viewUrl
    }
}
