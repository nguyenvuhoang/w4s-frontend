import { NextRequest, NextResponse } from 'next/server'

import {
  buildConfigFilesBackendHeaders,
  createConfigFilesErrorResponse,
  getConfigFilesBackendBaseUrl,
  invalidConfigFileServiceCodeResponse,
  isValidConfigFileServiceCode,
  missingConfigFilesBackendHostResponse,
  readConfigFilesBackendPayload
} from '@/servers/system-settings/configFilesGateway.server'

export const dynamic = 'force-dynamic'

const isRecord = (value: unknown): value is Record<string, unknown> => (
  typeof value === 'object' && value !== null && !Array.isArray(value)
)

// POST {serviceCode}/api/json-static-files/search — page_index is backend-native (base 0).
const parseSearchRequest = (body: unknown) => {
  const requestBody = isRecord(body) ? body : {}
  const pageSize = Number(requestBody.page_size)
  const pageIndex = Number(requestBody.page_index)

  return {
    page_size: Number.isInteger(pageSize) && pageSize > 0 ? pageSize : 10,
    page_index: Number.isInteger(pageIndex) && pageIndex >= 0 ? pageIndex : 0,
    search_text: typeof requestBody.search_text === 'string' ? requestBody.search_text.trim() : ''
  }
}

type RouteContext = {
  params: Promise<{ serviceCode: string }>
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  const { serviceCode } = await params

  if (!isValidConfigFileServiceCode(serviceCode)) {
    return invalidConfigFileServiceCodeResponse()
  }

  const backendBaseUrl = getConfigFilesBackendBaseUrl()

  if (!backendBaseUrl) {
    return missingConfigFilesBackendHostResponse()
  }

  try {
    const body = await request.json().catch(() => ({}))
    const response = await fetch(`${backendBaseUrl}/${serviceCode}/api/json-static-files/search`, {
      method: 'POST',
      headers: await buildConfigFilesBackendHeaders(request),
      body: JSON.stringify(parseSearchRequest(body)),
      cache: 'no-store'
    })

    const payload = await readConfigFilesBackendPayload(response)

    if (!response.ok || payload?.success === false) {
      return createConfigFilesErrorResponse(payload, response.ok ? 500 : response.status || 500, 'Unable to load config files.')
    }

    return NextResponse.json(payload)
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : 'Unable to load config files.' },
      { status: 500 }
    )
  }
}
