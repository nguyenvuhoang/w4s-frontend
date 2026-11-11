import type { BrandingLogos, BrandingPalette, BrandingSettings } from '@shared/constants/branding'

export type BrandingFormPayload = {
    brandingName: string
    logos: BrandingLogos
    palette: BrandingPalette
    fontFamily: string
}

const parseJsonSafe = async (response: Response) => response.json().catch(() => ({}))

/** Carries the raw API error payload (message + execution_id, when the backend returns one) so
 * callers can hand it straight to SwalAlert and get the same error-reference rendering used
 * elsewhere in the app, instead of just a bare message string. */
export class BrandingApiError extends Error {
    payload: unknown

    constructor(message: string, payload: unknown) {
        super(message)
        this.name = 'BrandingApiError'
        this.payload = payload
    }
}

export const brandingService = {
    async save(payload: BrandingFormPayload): Promise<BrandingSettings> {
        const response = await fetch('/api/system-settings/branding', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        })
        const json = await parseJsonSafe(response)

        if (!response.ok || !json?.success) {
            throw new BrandingApiError(json?.message || 'Save failed', json)
        }

        return json.data as BrandingSettings
    },

    async uploadLogo(file: File): Promise<string> {
        const content_type = file.type || 'image/png'

        const presignResponse = await fetch('/api/system-settings/branding/logo/presign-upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                file_name: file.name,
                content_type,
                file_size: file.size
            })
        })
        const presignJson = await parseJsonSafe(presignResponse)

        if (!presignResponse.ok || !presignJson?.success) {
            throw new Error(presignJson?.message || 'Presign failed')
        }

        const upload_url = presignJson.data?.upload_url
        const logo_url = presignJson.data?.logo_url

        if (!upload_url || !logo_url) {
            throw new Error('Presign failed')
        }

        const uploadResponse = await fetch(upload_url, {
            method: 'PUT',
            headers: { 'Content-Type': content_type },
            body: file
        })

        if (!uploadResponse.ok) {
            throw new Error(`Upload failed (${uploadResponse.status})`)
        }

        return logo_url
    }
}
