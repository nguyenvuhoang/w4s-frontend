import { env } from '@/env.mjs'
import { NextRequest, NextResponse } from 'next/server'
import { getBackendToken } from '@/server/auth/getBackendToken'

const REVERSE_PROXY_CONFIG_FILE_PATH = '/app/StaticConfig/ReverseProxyConfig.json'
const GET_REVERSE_PROXY_CONFIG_PATH = '/api/file/getreverseproxyconfig'
const UPDATE_REVERSE_PROXY_CONFIG_PATH = '/api/file/updatereverseproxyconfig'

const getCmsApiBaseUrl = () => env.CMS_HOST?.replace(/\/$/, '')

const buildBackendUrl = (path: string) => {
  const baseUrl = getCmsApiBaseUrl()

  if (!baseUrl) {
    throw new Error('CMS_HOST is not configured.')
  }

  const url = new URL(`${baseUrl}${path}`)
  url.searchParams.set('file_path', REVERSE_PROXY_CONFIG_FILE_PATH)

  return url
}

const readBackendPayload = async (response: Response) => {
  const text = await response.text()

  if (!text) return null

  try {
    return JSON.parse(text)
  } catch {
    return { message: text }
  }
}

const extractErrorMessage = (payload: any, fallback: string) => (
  payload?.detail ??
  payload?.message ??
  payload?.title ??
  payload?.error ??
  payload?.errors?.[0]?.info ??
  payload?.errors?.[0]?.message ??
  fallback
)

const extractExecutionId = (payload: any): string | undefined => (
  payload?.execution_id ??
  payload?.executionId ??
  payload?.execute_id ??
  payload?.dataresponse?.execution_id ??
  payload?.dataresponse?.execute_id
)

const backendHeaders = (request: NextRequest, accessToken: string) => {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    uid: accessToken
  }

  const scope = request.headers.get('scope')

  if (scope) headers.scope = scope

  return headers
}

const createErrorResponse = (payload: any, status: number, fallback: string) => NextResponse.json(
  {
    success: false,
    message: extractErrorMessage(payload, fallback),
    detail: payload?.detail,
    title: payload?.title,
    execution_id: extractExecutionId(payload)
  },
  { status }
)

export async function GET(request: NextRequest) {
  try {
    const backendCredential = await getBackendToken(request)

    if (!backendCredential) {
      return NextResponse.json({ message: 'Phiên đăng nhập không hợp lệ.' }, { status: 401 })
    }

    const response = await fetch(buildBackendUrl(GET_REVERSE_PROXY_CONFIG_PATH), {
      method: 'GET',
      headers: backendHeaders(request, backendCredential.accessToken),
      cache: 'no-store'
    })

    const payload = await readBackendPayload(response)

    if (!response.ok) {
      return createErrorResponse(payload, response.status || 500, 'Unable to load ReverseProxyConfig.json.')
    }

    return NextResponse.json(payload)
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Unable to load ReverseProxyConfig.json.' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const backendCredential = await getBackendToken(request)

    if (!backendCredential) {
      return NextResponse.json({ message: 'Phiên đăng nhập không hợp lệ.' }, { status: 401 })
    }

    const body = await request.json()

    const response = await fetch(buildBackendUrl(UPDATE_REVERSE_PROXY_CONFIG_PATH), {
      method: 'PUT',
      headers: {
        ...backendHeaders(request, backendCredential.accessToken),
        Accept: '*/*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body),
      cache: 'no-store'
    })

    const payload = await readBackendPayload(response)

    if (!response.ok || payload?.success === false) {
      return createErrorResponse(payload, response.ok ? 500 : response.status || 500, 'Unable to update ReverseProxyConfig.json.')
    }

    return NextResponse.json(payload ?? { success: true })
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Unable to update ReverseProxyConfig.json.' },
      { status: 500 }
    )
  }
}
