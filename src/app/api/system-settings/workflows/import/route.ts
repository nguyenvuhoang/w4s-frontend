import { NextRequest, NextResponse } from 'next/server'

import { getBackendToken } from '@/server/auth/getBackendToken'
import { i18n } from '@/configs/i18n'
import type { Locale } from '@/configs/i18n'
import { env } from '@/env.mjs'
import logger from '@lib/logger'

export const dynamic = 'force-dynamic'

const WORKFLOW_IMPORT_PATH = '/wfo/api/workflows/import'

type JsonRecord = Record<string, unknown>

const isRecord = (value: unknown): value is JsonRecord => (
  typeof value === 'object' && value !== null && !Array.isArray(value)
)

const normalizeBaseUrl = (value?: string) => (value ?? '').replace(/\/$/, '')

const getBackendBaseUrl = () => normalizeBaseUrl(env.CMS_HOST)

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
  // Không set 'content-type' — để fetch tự sinh multipart boundary cho FormData.
  const headers: Record<string, string> = {
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

  const language = parseLanguage(req.nextUrl.searchParams.get('lang'))
  const backendBaseUrl = getBackendBaseUrl()

  if (!backendBaseUrl) {
    logger.error('Workflow import: backend base URL is not configured.')

    return NextResponse.json(
      { success: false, error_message: 'Backend endpoint is not configured.' },
      { status: 500 }
    )
  }

  const incomingFormData = await req.formData().catch(() => null)
  const file = incomingFormData?.get('File')

  if (!(file instanceof File)) {
    return NextResponse.json(
      { success: false, error_message: 'Missing file field "File".' },
      { status: 400 }
    )
  }

  const outgoingFormData = new FormData()

  outgoingFormData.append('File', file)

  let response: Response

  try {
    response = await fetch(`${backendBaseUrl}${WORKFLOW_IMPORT_PATH}`, {
      method: 'POST',
      headers: buildBackendHeaders(req, uid, language),
      body: outgoingFormData,
      cache: 'no-store',
      signal: AbortSignal.timeout(30000)
    })
  } catch (error) {
    logger.error('Workflow import request failed:', error)

    return NextResponse.json(
      { success: false, error_message: 'Bad gateway: unable to reach backend service.' },
      { status: 502 }
    )
  }

  const backendPayload = await response.json().catch(() => null)

  if (response.status === 401) {
    const detail = extractErrorDetail(backendPayload, 'Session expired or unauthorized. Please login again.')

    return NextResponse.json(
      { success: false, error_message: detail.message, execution_id: detail.executionId, next_action: 'logout' },
      { status: 401 }
    )
  }

  if (!response.ok || (isRecord(backendPayload) && backendPayload.success === false)) {
    const detail = extractErrorDetail(backendPayload, 'Backend service returned an error.')

    logger.error(`Workflow import backend error: HTTP ${response.status} - ${detail.message}`)

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
