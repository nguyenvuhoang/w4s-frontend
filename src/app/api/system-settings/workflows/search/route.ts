import { NextRequest, NextResponse } from 'next/server'

import { getBackendToken } from '@/server/auth/getBackendToken'
import { i18n } from '@/configs/i18n'
import type { Locale } from '@/configs/i18n'
import { env } from '@/env.mjs'
import logger from '@lib/logger'

export const dynamic = 'force-dynamic'

const WORKFLOW_SIMPLE_SEARCH_PATH = '/wfo/api/workflows/advance-search'
const DEFAULT_PAGE_SIZE = 10
const MAX_PAGE_SIZE = 100

type JsonRecord = Record<string, unknown>

const isRecord = (value: unknown): value is JsonRecord => (
  typeof value === 'object' && value !== null && !Array.isArray(value)
)

const normalizeBaseUrl = (value?: string) => (value ?? '').replace(/\/$/, '')

const getBackendBaseUrl = () => normalizeBaseUrl(
  env.CMS_HOST
)

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

const isSameOriginRequest = (req: NextRequest) => {
  const origin = req.headers.get('origin')

  if (!origin) return false

  try {
    return new URL(origin).origin === req.nextUrl.origin
  } catch {
    return false
  }
}

const getStringField = (source: unknown, keys: string[]): string => {
  if (!isRecord(source)) return ''

  for (const key of keys) {
    const value = source[key]

    if (typeof value === 'string' && value.trim()) return value.trim()
  }

  return ''
}

const getFirstError = (payload: unknown): unknown => {
  if (!isRecord(payload)) return null

  const errors = payload.errors ?? payload.error

  return Array.isArray(errors) ? errors[0] : null
}

const extractErrorDetail = (payload: unknown, fallback: string) => {
  const firstError = getFirstError(payload)
  const data = isRecord(payload) ? payload.data : null
  const dataError = getFirstError(data)

  const message = getStringField(firstError, ['error_message', 'description', 'message', 'info', 'code'])
    || getStringField(dataError, ['error_message', 'description', 'message', 'info', 'code'])
    || getStringField(payload, ['error_message', 'description', 'message', 'error'])
    || fallback

  const executionId = getStringField(firstError, ['execution_id', 'executionId', 'execute_id', 'executionid'])
    || getStringField(dataError, ['execution_id', 'executionId', 'execute_id', 'executionid'])
    || getStringField(payload, ['execution_id', 'executionId', 'execute_id', 'executionid'])

  return { message, executionId }
}

const buildBackendHeaders = (req: NextRequest, uid: string, language: Locale): HeadersInit => {
  const headers: Record<string, string> = {
    'content-type': 'application/json',
    lang: language,
    app: process.env.NEXT_PUBLIC_APPLICATION_CODE || 'BO',
    uid
  }

  const userAgent = req.headers.get('user-agent')
  const deviceId = req.headers.get('device_id')

  if (userAgent) headers['user-agent'] = userAgent
  if (deviceId) headers.my_device = JSON.stringify({ device_id: deviceId })

  return headers
}

export async function POST(req: NextRequest) {
  if (!isSameOriginRequest(req)) {
    return NextResponse.json({ success: false, error_message: 'Cross-origin request rejected.' }, { status: 403 })
  }

  const uid = (await getBackendToken(req))?.accessToken

  if (!uid) {
    return NextResponse.json({ success: false, error_message: 'Unauthorized.', next_action: 'logout' }, { status: 401 })
  }

  const body = await req.json().catch(() => ({}))
  const requestBody = isRecord(body) ? body : {}
  const language = parseLanguage(req.nextUrl.searchParams.get('lang'))
  const backendBaseUrl = getBackendBaseUrl()

  if (!backendBaseUrl) {
    logger.error('Workflow simple-search: backend base URL is not configured.')

    return NextResponse.json(
      { success: false, error_message: 'Backend endpoint is not configured.' },
      { status: 500 }
    )
  }

  const channelId = typeof requestBody.channel_id === 'string' ? requestBody.channel_id.trim() : ''

  const payload = {
    search_text: typeof requestBody.search_text === 'string' ? requestBody.search_text.trim() : '',
    page_index: parsePageIndex(requestBody.page_index),
    page_size: parsePageSize(requestBody.page_size),
    ...(channelId ? { channel_id: channelId } : {})
  }

  if (process.env.NODE_ENV === 'development') {
    logger.info(`Workflow simple-search request: ${JSON.stringify(payload)}`)
  }

  let response: Response

  try {
    response = await fetch(`${backendBaseUrl}${WORKFLOW_SIMPLE_SEARCH_PATH}`, {
      method: 'POST',
      headers: buildBackendHeaders(req, uid, language),
      body: JSON.stringify(payload),
      cache: 'no-store',
      signal: AbortSignal.timeout(15000)
    })
  } catch (error) {
    logger.error('Workflow simple-search request failed:', error)

    return NextResponse.json(
      { success: false, error_message: 'Bad gateway: unable to reach backend service.' },
      { status: 502 }
    )
  }

  const backendPayload = await response.json().catch(() => null)

  if (process.env.NODE_ENV === 'development') {
    logger.info(`Workflow simple-search response status: ${response.status}`)
  }

  if (response.status === 401) {
    const detail = extractErrorDetail(backendPayload, 'Session expired or unauthorized. Please login again.')

    return NextResponse.json(
      { success: false, error_message: detail.message, execution_id: detail.executionId, next_action: 'logout' },
      { status: 401 }
    )
  }

  if (!response.ok || (isRecord(backendPayload) && backendPayload.success === false)) {
    const detail = extractErrorDetail(backendPayload, 'Backend service returned an error.')

    logger.error(`Workflow simple-search backend error: HTTP ${response.status} - ${detail.message}`)

    return NextResponse.json(
      { success: false, error_message: detail.message, description: detail.message, execution_id: detail.executionId },
      { status: response.ok ? 502 : response.status }
    )
  }

  const responseData = isRecord(backendPayload) && isRecord(backendPayload.data)
    ? backendPayload.data
    : backendPayload

  return NextResponse.json({ success: true, data: responseData }, { status: 200 })
}
