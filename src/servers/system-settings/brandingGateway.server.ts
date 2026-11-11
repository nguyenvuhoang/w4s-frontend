import 'server-only'

import { env } from '@/env.mjs'
import { getServerBackendToken } from '@/server/auth/getServerBackendToken'
import {
  DEFAULT_BRANDING_SETTINGS,
  parseBrandingLogos,
  parseBrandingPalette,
  serializeBrandingLogos,
  serializeBrandingPalette,
  type BrandingSettings
} from '@shared/constants/branding'

// Confirmed live on the CMS backend.
const BRANDING_GET_PATH = '/api/branding/get'
const BRANDING_SAVE_PATH = '/api/branding/setting'

const normalizeBaseUrl = (value?: string) => (value ?? '').replace(/\/$/, '')

export const getBrandingBackendBaseUrl = () => normalizeBaseUrl(env.CMS_HOST)

export class BrandingBackendError extends Error {
  status: number
  executionId?: string
  /** Whether a backend session token was actually sent with this call. False on the Login screen
   * / right after logout — that's an expected, routine state, not a real failure — so callers
   * should log it quietly (info) instead of as a warning. */
  hadAccessToken: boolean

  constructor(message: string, status: number, executionId?: string, hadAccessToken = false) {
    super(message)
    this.name = 'BrandingBackendError'
    this.status = status
    this.executionId = executionId
    this.hadAccessToken = hadAccessToken
  }
}

const buildHeaders = (accessToken: string | null): HeadersInit => {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    app: process.env.NEXT_PUBLIC_APPLICATION_CODE || 'BO'
  }

  // Real session token resolved server-side (getServerBackendToken / getBackendToken) — never a
  // client-supplied value. Omitted when the visitor has no session yet (e.g. the Login screen) —
  // the backend call still goes out, it just isn't authenticated.
  if (accessToken) headers.uid = accessToken

  return headers
}

const readPayload = async (response: Response) => {
  const text = await response.text()

  if (!text) return null

  try {
    return JSON.parse(text)
  } catch {
    return { message: text }
  }
}

const extractMessage = (payload: any, fallback: string): string => (
  payload?.message ??
  payload?.error_message ??
  payload?.description ??
  payload?.errors?.[0]?.info ??
  payload?.errors?.[0]?.message ??
  fallback
)

const extractExecutionId = (payload: any): string | undefined => (
  payload?.execution_id ?? payload?.executionId ?? payload?.data?.execution_id
)

const isNonEmptyString = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0

/** Maps the backend's snake_case response shape to the FE camelCase model. Falls back to
 * `fallback` per-field for anything missing/null — GET uses the hardcoded defaults (nothing
 * better to fall back to), POST uses the just-submitted `input` (echo back what was saved if the
 * backend response doesn't include it, instead of wrongly resetting the UI to defaults).
 *
 * The backend only has single `logo_url` and `primary_color` string fields — they each carry a
 * JSON-encoded object (all 5 logo slots, and the full 7-color palette respectively).
 * parseBrandingLogos/parseBrandingPalette handle null/empty/legacy-plain-value/malformed JSON
 * safely; nothing here ever throws on bad data. */
const mapBackendBrandingResponse = (raw: unknown, fallback: BrandingSettings): BrandingSettings => {
  const value = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>

  const brandingName = value.branding_name ?? value.brandingName
  const logoUrl = value.logo_url ?? value.logoUrl
  const primaryColor = value.primary_color ?? value.primaryColor
  const fontFamily = value.font_family ?? value.fontFamily

  return {
    brandingName: isNonEmptyString(brandingName) ? brandingName : fallback.brandingName,
    logos: typeof logoUrl === 'string' && logoUrl.trim() ? parseBrandingLogos(logoUrl) : fallback.logos,
    palette: typeof primaryColor === 'string' && primaryColor.trim() ? parseBrandingPalette(primaryColor) : fallback.palette,
    fontFamily: isNonEmptyString(fontFamily) ? fontFamily : fallback.fontFamily
  }
}

/** Maps the FE camelCase model to the backend's snake_case request shape. All 5 logo slots are
 * packed into `logo_url`, and the full 7-color palette into `primary_color`, both as JSON
 * strings — no per-logo/per-color backend fields. */
const mapBrandingRequestBody = (input: BrandingSettings) => ({
  branding_name: input.brandingName,
  logo_url: serializeBrandingLogos(input.logos),
  primary_color: serializeBrandingPalette(input.palette),
  font_family: input.fontFamily
})

/** Reads branding config from the CMS backend (GET /cms/api/branding/get). The backend currently
 * requires an authenticated session for this endpoint, so this resolves the current visitor's
 * backend token server-side — same mechanism (getServerBackendToken, next-auth session cookie)
 * used by every other server-side backend call in this app — and sends it as `uid`, exactly like
 * an authenticated screen would.
 *
 * Branding is also rendered before login (Login screen, favicon, loading screen), where there is
 * no session yet. That is a normal, expected state, not a bug: no token is available, the call
 * still goes out (unauthenticated), the backend will reject it, and the thrown error carries
 * `hadAccessToken: false` so callers log that quietly instead of as a warning — see
 * BrandingBackendError above. Throws on any failure; callers decide the ENV/themeConfig fallback,
 * this module never fakes data. */
export const fetchBrandingConfig = async (): Promise<BrandingSettings> => {
  const baseUrl = getBrandingBackendBaseUrl()

  if (!baseUrl) {
    throw new BrandingBackendError('CMS_HOST chưa được cấu hình.', 500, undefined, false)
  }

  const accessToken = await getServerBackendToken()

  const response = await fetch(`${baseUrl}${BRANDING_GET_PATH}`, {
    method: 'GET',
    headers: buildHeaders(accessToken),
    cache: 'no-store'
  })

  const payload = await readPayload(response)

  if (!response.ok) {
    throw new BrandingBackendError(
      extractMessage(payload, 'Không thể tải cấu hình branding từ backend.'),
      response.status || 500,
      extractExecutionId(payload),
      Boolean(accessToken)
    )
  }

  return mapBackendBrandingResponse(payload?.data ?? payload, DEFAULT_BRANDING_SETTINGS)
}

/** Writes branding config to the CMS backend (POST /cms/api/branding/setting). Unlike the GET
 * above, this always requires a real authenticated session token — the backend enforces SADMIN
 * permission on this endpoint, and this call must never be made anonymous. Throws
 * BrandingBackendError on any failure — the caller must surface the real error, never pretend
 * the save succeeded. */
export const saveBrandingConfig = async (
  accessToken: string,
  input: BrandingSettings
): Promise<BrandingSettings> => {
  const baseUrl = getBrandingBackendBaseUrl()

  if (!baseUrl) {
    throw new BrandingBackendError('CMS_HOST chưa được cấu hình.', 500, undefined, true)
  }

  const response = await fetch(`${baseUrl}${BRANDING_SAVE_PATH}`, {
    method: 'POST',
    headers: { ...buildHeaders(accessToken), 'Content-Type': 'application/json' },
    body: JSON.stringify(mapBrandingRequestBody(input)),
    cache: 'no-store'
  })

  const payload = await readPayload(response)

  if (!response.ok) {
    throw new BrandingBackendError(
      extractMessage(payload, 'Không thể lưu cấu hình branding lên backend.'),
      response.status || 500,
      extractExecutionId(payload),
      true
    )
  }

  return mapBackendBrandingResponse(payload?.data ?? payload, input)
}
