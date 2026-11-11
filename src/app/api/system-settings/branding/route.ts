import { NextRequest, NextResponse } from 'next/server'
import logger from '@lib/logger'
import { env } from '@/env.mjs'
import { getBackendToken } from '@/server/auth/getBackendToken'
import {
  BrandingBackendError,
  fetchBrandingConfig,
  saveBrandingConfig
} from '@/servers/system-settings/brandingGateway.server'
import {
  BRANDING_LOGO_KEYS,
  BRANDING_PALETTE_COLOR_KEYS,
  DEFAULT_BRANDING_LOGOS,
  DEFAULT_BRANDING_PALETTE,
  DEFAULT_BRANDING_SETTINGS,
  type BrandingLogos,
  type BrandingPalette
} from '@shared/constants/branding'

export const dynamic = 'force-dynamic'

const HEX_COLOR_PATTERN = /^#[0-9A-Fa-f]{6}$/

// Same-origin guard for the mutating POST — this route is authenticated via an httpOnly session
// cookie, so a cross-site page could still make the browser send a POST here. GET is read-only
// and intentionally not gated. Matches the convention already used in
// src/app/api/service-requests/[serviceRequestId]/messages/route.ts.
const isSameOriginRequest = (req: NextRequest): boolean => {
  const origin = req.headers.get('origin')

  if (!origin) return false

  try {
    return new URL(origin).origin === req.nextUrl.origin
  } catch {
    return false
  }
}

const logTokenResolution = (route: string, accessToken: string | null | undefined) => {
  if (process.env.NODE_ENV !== 'development') return

  // Never log the token value itself — only whether one was resolved, to help tell apart
  // "FE never got a session token" from "backend rejected a token we did send".
  logger.info(`${route}: backend access token resolved = ${Boolean(accessToken)} (length ${accessToken?.length ?? 0})`)
}

// Client -> this Next.js Router API -> CMS backend:
//   GET  /cms/api/branding/get      (backend still requires a session — see fetchBrandingConfig)
//   POST /cms/api/branding/setting  (requires an authenticated SADMIN session)
// The browser never calls the backend directly — see brandingGateway.server.ts.
export async function GET() {
  try {
    // fetchBrandingConfig() resolves the visitor's backend token itself (getServerBackendToken)
    // and sends it when present. No token is available on the Login screen / right after
    // logout — that's expected, not an error, and is never retried.
    const settings = await fetchBrandingConfig()

    return NextResponse.json({ success: true, data: settings })
  } catch (error) {
    // Falls back to ENV -> themeConfig default so the UI still renders either way. Log level
    // reflects the actual cause: no session yet (Login screen, routine) logs quietly at info;
    // an authenticated call still failing (backend down/misconfigured) is a real warning.
    const hadAccessToken = error instanceof BrandingBackendError ? error.hadAccessToken : true
    const message = (error as Error)?.message ?? error

    if (hadAccessToken) {
      logger.warn('GET /api/system-settings/branding: backend unavailable, falling back to ENV/default —', message)
    } else {
      logger.info('GET /api/system-settings/branding: no session yet (e.g. Login screen), falling back to ENV/default —', message)
    }

    return NextResponse.json({
      success: true,
      data: {
        ...DEFAULT_BRANDING_SETTINGS,
        brandingName: env.NEXT_PUBLIC_APPLICATION_TITLE || DEFAULT_BRANDING_SETTINGS.brandingName
      }
    })
  }
}

export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ success: false, message: 'Yêu cầu bị từ chối (cross-origin).' }, { status: 403 })
  }

  try {
    const credential = await getBackendToken(request)

    logTokenResolution('POST /api/system-settings/branding', credential?.accessToken)

    // Fail fast with a clear, actionable message instead of letting a request with no uid header
    // reach the backend and come back as a confusing generic error.
    if (!credential?.accessToken) {
      return NextResponse.json(
        { success: false, message: 'Phiên đăng nhập đã hết hạn hoặc không hợp lệ. Vui lòng đăng nhập lại.', next_action: 'logout' },
        { status: 401 }
      )
    }

    const body = await request.json().catch(() => null)

    if (!body || typeof body !== 'object') {
      return NextResponse.json({ success: false, message: 'Dữ liệu gửi lên không hợp lệ.' }, { status: 400 })
    }

    const { brandingName, logos, palette, fontFamily } = body as Record<string, unknown>

    if (typeof brandingName !== 'string' || !brandingName.trim()) {
      return NextResponse.json({ success: false, message: 'Tên thương hiệu không được để trống.' }, { status: 400 })
    }

    if (logos !== undefined && (typeof logos !== 'object' || logos === null || Array.isArray(logos))) {
      return NextResponse.json({ success: false, message: 'Dữ liệu logo không hợp lệ.' }, { status: 400 })
    }

    const logosInput = (logos ?? {}) as Record<string, unknown>
    const normalizedLogos: BrandingLogos = { ...DEFAULT_BRANDING_LOGOS }

    for (const key of BRANDING_LOGO_KEYS) {
      const value = logosInput[key]

      if (value !== undefined && typeof value !== 'string') {
        return NextResponse.json({ success: false, message: `URL logo "${key}" không hợp lệ.` }, { status: 400 })
      }

      if (typeof value === 'string') normalizedLogos[key] = value
    }

    if (!palette || typeof palette !== 'object' || Array.isArray(palette)) {
      return NextResponse.json({ success: false, message: 'Dữ liệu bảng màu không hợp lệ.' }, { status: 400 })
    }

    const paletteInput = palette as Record<string, unknown>
    const normalizedPalette: BrandingPalette = { ...DEFAULT_BRANDING_PALETTE }

    if (typeof paletteInput.name === 'string' && paletteInput.name.trim()) {
      normalizedPalette.name = paletteInput.name.trim()
    } else {
      return NextResponse.json({ success: false, message: 'Tên bảng màu không được để trống.' }, { status: 400 })
    }

    for (const key of BRANDING_PALETTE_COLOR_KEYS) {
      const value = paletteInput[key]

      if (typeof value !== 'string' || !HEX_COLOR_PATTERN.test(value)) {
        return NextResponse.json(
          { success: false, message: `Màu "${key}" phải theo định dạng mã HEX, ví dụ #225087.` },
          { status: 400 }
        )
      }

      normalizedPalette[key] = value
    }

    if (typeof fontFamily !== 'string' || !fontFamily.trim()) {
      return NextResponse.json({ success: false, message: 'Font chữ không được để trống.' }, { status: 400 })
    }

    // Save genuinely goes to the backend — no local fallback, no fake success. If the backend
    // rejects it this surfaces a real error instead of silently no-op'ing.
    const saved = await saveBrandingConfig(credential.accessToken, {
      brandingName: brandingName.trim(),
      logos: normalizedLogos,
      palette: normalizedPalette,
      fontFamily
    })

    return NextResponse.json({ success: true, data: saved })
  } catch (error) {
    logger.error('POST /api/system-settings/branding error:', error)

    const status = error instanceof BrandingBackendError ? error.status : 500
    const message = error instanceof BrandingBackendError
      ? error.message
      : 'Không thể lưu cấu hình branding. Vui lòng thử lại.'
    const execution_id = error instanceof BrandingBackendError ? error.executionId : undefined

    return NextResponse.json({ success: false, message, execution_id }, { status })
  }
}
