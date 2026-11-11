import 'server-only'

import { NextRequest, NextResponse } from 'next/server'

import { getBackendToken } from '@/server/auth/getBackendToken'
import { env } from '@/env.mjs'
import { CONFIG_FILE_SERVICE_CODES } from '@/features/system-settings/config-files/services/configFileServiceRegistry'

const normalizeBaseUrl = (value?: string) => (value ?? '').replace(/\/$/, '')

export const getConfigFilesBackendBaseUrl = () => normalizeBaseUrl(env.CMS_HOST)

// Every json-static-files call is proxied through this whitelist before the serviceCode is
// interpolated into the backend URL, so an unknown/arbitrary path segment can never reach the
// backend gateway. Source of truth is CONFIG_FILE_SERVICES — adding a service there is enough.
export const isValidConfigFileServiceCode = (serviceCode: string) =>
  CONFIG_FILE_SERVICE_CODES.includes(serviceCode?.toLowerCase())

const getStringField = (source: any, keys: string[]) => {
  if (!source || typeof source !== 'object') return ''

  for (const key of keys) {
    const value = source[key]

    if (typeof value === 'string' && value.trim()) return value.trim()
  }

  return ''
}

const extractErrorMessage = (payload: any, fallback: string) => (
  getStringField(payload, ['error_message', 'description', 'message', 'detail', 'title', 'error'])
  || getStringField(Array.isArray(payload?.errors) ? payload.errors[0] : null, ['error_message', 'description', 'message', 'info', 'code'])
  || fallback
)

const extractExecutionId = (payload: any) => (
  getStringField(payload, ['execution_id', 'executionId', 'execute_id'])
  || getStringField(payload?.data, ['execution_id', 'executionId', 'execute_id'])
)

export const buildConfigFilesBackendHeaders = async (request: NextRequest): Promise<HeadersInit> => {
  const backendCredential = await getBackendToken(request)
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    app: process.env.NEXT_PUBLIC_APPLICATION_CODE || 'BO'
  }

  const uid = backendCredential?.accessToken
  const language = request.headers.get('lang')
  const userAgent = request.headers.get('user-agent')
  const deviceId = request.headers.get('device_id')

  if (uid) headers.uid = uid
  if (language) headers.lang = language
  if (userAgent) headers['user-agent'] = userAgent
  if (deviceId) headers.my_device = JSON.stringify({ device_id: deviceId })

  return headers
}

export const readConfigFilesBackendPayload = async (response: Response) => {
  const text = await response.text()

  if (!text) return null

  try {
    return JSON.parse(text)
  } catch {
    return { message: text }
  }
}

export const createConfigFilesErrorResponse = (payload: any, status: number, fallback: string) => NextResponse.json(
  {
    success: false,
    message: extractErrorMessage(payload, fallback),
    error_message: extractErrorMessage(payload, fallback),
    detail: payload?.detail,
    title: payload?.title,
    execution_id: extractExecutionId(payload)
  },
  { status }
)

export const invalidConfigFileServiceCodeResponse = () => NextResponse.json(
  { success: false, message: 'Unknown service code.' },
  { status: 404 }
)

export const missingConfigFilesBackendHostResponse = () => NextResponse.json(
  { success: false, message: 'CMS_HOST is not configured.' },
  { status: 500 }
)
