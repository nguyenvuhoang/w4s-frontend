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

const isRecord = (value: unknown): value is Record<string, unknown> => (
  typeof value === 'object' && value !== null && !Array.isArray(value)
)

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

    if (!isRecord(body)) {
      return NextResponse.json({ success: false, error_message: 'Invalid request body.' }, { status: 400 })
    }

    const relativePath = typeof body.relative_path === 'string' ? body.relative_path.trim() : ''
    const content = typeof body.content === 'string' ? body.content : ''

    if (!relativePath) {
      return NextResponse.json({ success: false, error_message: 'relative_path is required.' }, { status: 400 })
    }

    if (!content.trim()) {
      return NextResponse.json({ success: false, error_message: 'content is required.' }, { status: 400 })
    }

    const response = await fetch(`${backendBaseUrl}/${serviceCode}/api/json-static-files/update`, {
      method: 'POST',
      headers: await buildConfigFilesBackendHeaders(request),
      body: JSON.stringify({
        relative_path: relativePath,
        content
      }),
      cache: 'no-store'
    })

    const payload = await readConfigFilesBackendPayload(response)

    if (!response.ok || payload?.success === false) {
      return createConfigFilesErrorResponse(payload, response.ok ? 500 : response.status || 500, 'Unable to update config file.')
    }

    return NextResponse.json(payload ?? { success: true })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error_message: error instanceof Error ? error.message : 'Unable to update config file.'
      },
      { status: 500 }
    )
  }
}
