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

type RouteContext = {
  params: Promise<{ serviceCode: string }>
}

const getRelativePath = (request: NextRequest) => request.nextUrl.searchParams.get('relative_path')?.trim() ?? ''

// GET is the UI-facing shape (?relative_path=...); the backend itself expects
// POST {serviceCode}/api/json-static-files/get with { relative_path } in the body.
export async function GET(request: NextRequest, { params }: RouteContext) {
  const { serviceCode } = await params

  if (!isValidConfigFileServiceCode(serviceCode)) {
    return invalidConfigFileServiceCodeResponse()
  }

  const relativePath = getRelativePath(request)

  if (!relativePath) {
    return NextResponse.json({ success: false, message: 'relative_path is required.' }, { status: 400 })
  }

  const backendBaseUrl = getConfigFilesBackendBaseUrl()

  if (!backendBaseUrl) {
    return missingConfigFilesBackendHostResponse()
  }

  try {
    const response = await fetch(`${backendBaseUrl}/${serviceCode}/api/json-static-files/get`, {
      method: 'POST',
      headers: await buildConfigFilesBackendHeaders(request),
      body: JSON.stringify({ relative_path: relativePath }),
      cache: 'no-store'
    })

    const payload = await readConfigFilesBackendPayload(response)

    if (!response.ok || payload?.success === false) {
      return createConfigFilesErrorResponse(payload, response.ok ? 500 : response.status || 500, 'Unable to load config file.')
    }

    return NextResponse.json(payload)
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : 'Unable to load config file.' },
      { status: 500 }
    )
  }
}
