import { NextRequest, NextResponse } from 'next/server'

import { getBackendToken } from '@/server/auth/getBackendToken'
import { i18n } from '@/configs/i18n'
import type { Locale } from '@/configs/i18n'
import logger from '@lib/logger'
import { ApplicationLogsGatewayError, searchApplicationLogsAdvanced } from '@/servers/log/applicationLogs.server'

const MAX_PAGE_SIZE = 100
const DEFAULT_PAGE_SIZE = 10

const toTrimmedString = (value: unknown) => (typeof value === 'string' ? value.trim() : '')

const toNullableDate = (value: unknown) => (typeof value === 'string' && value.trim() ? value.trim() : null)

const parsePageIndex = (value: unknown) => {
  const parsed = Number(value)

  return Number.isInteger(parsed) && parsed >= 0 ? parsed : 0
}

const parsePageSize = (value: unknown) => {
  const parsed = Number(value)

  if (!Number.isInteger(parsed) || parsed <= 0) return DEFAULT_PAGE_SIZE

  return Math.min(parsed, MAX_PAGE_SIZE)
}

const parseLanguage = (raw: string | null): Locale => (
  raw && (i18n.locales as readonly string[]).includes(raw) ? (raw as Locale) : i18n.defaultLocale
)

// Authenticated via httpOnly session cookie; this project has no CSRF middleware for /api routes
// (see src/proxy.ts), so require same-origin like the other authenticated POST search routes.
const isSameOriginRequest = (req: NextRequest): boolean => {
  const origin = req.headers.get('origin')

  if (!origin) return false

  try {
    return new URL(origin).origin === req.nextUrl.origin
  } catch {
    return false
  }
}

const errorResponse = (error: unknown, fallbackMessage: string) => {
  if (error instanceof ApplicationLogsGatewayError) {
    return NextResponse.json(
      { success: false, message: error.message, next_action: error.next_action },
      { status: error.status }
    )
  }

  logger.error('❌ Application logs advanced-search route failed:', error)

  return NextResponse.json({ success: false, message: fallbackMessage }, { status: 500 })
}

export async function POST(req: NextRequest) {
  if (!isSameOriginRequest(req)) {
    return NextResponse.json({ success: false, message: 'Cross-origin request rejected.' }, { status: 403 })
  }

  const uid = (await getBackendToken(req))?.accessToken

  if (!uid) {
    return NextResponse.json({ success: false, message: 'Unauthorized.' }, { status: 401 })
  }

  const body = await req.json().catch(() => ({}))
  const language = parseLanguage(req.nextUrl.searchParams.get('lang'))

  const request = {
    page_index: parsePageIndex(body?.page_index),
    page_size: parsePageSize(body?.page_size),
    search_text: toTrimmedString(body?.search_text),
    from_date: toNullableDate(body?.from_date),
    to_date: toNullableDate(body?.to_date),
    log_level: toTrimmedString(body?.log_level),
    service_name: toTrimmedString(body?.service_name),
    correlation_id: toTrimmedString(body?.correlation_id),
    log_type: toTrimmedString(body?.log_type),
    direction: toTrimmedString(body?.direction),
    action_name: toTrimmedString(body?.action_name)
  }

  try {
    const result = await searchApplicationLogsAdvanced(request, { uid, language })

    return NextResponse.json({ success: true, data: result }, { status: 200 })
  } catch (error) {
    return errorResponse(error, 'Unable to load application logs.')
  }
}
