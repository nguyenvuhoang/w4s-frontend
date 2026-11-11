import { NextRequest, NextResponse } from 'next/server'

import {
  buildServiceSettingsHeaders,
  buildServiceSettingsUrl,
  isServiceSettingsService,
  parseServiceSettingsUpdateBody,
  readServiceSettingsPayload,
  serviceSettingsErrorResponse
} from '@/servers/system-settings/serviceSettingsGateway.server'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const service = request.nextUrl.searchParams.get('service')?.toUpperCase() ?? ''
  // Same proxy for search and update; only the backend endpoint and payload differ.
  const operation = request.nextUrl.searchParams.get('operation') === 'update' ? 'update' : 'search'

  if (!isServiceSettingsService(service)) {
    return NextResponse.json({ success: false, message: 'Unknown service.' }, { status: 400 })
  }

  let body: Record<string, unknown> = {}

  if (operation === 'update') {
    const updateBody = parseServiceSettingsUpdateBody(await request.json().catch(() => null))

    if (!updateBody) return NextResponse.json({ success: false, message: 'Invalid service setting payload.' }, { status: 400 })
    body = updateBody
  }

  const backendUrl = buildServiceSettingsUrl(service, operation)
  if (!backendUrl) return NextResponse.json({ success: false, message: 'CMS_HOST is not configured.' }, { status: 500 })

  const fallbackMessage = operation === 'update' ? 'Unable to update service setting.' : 'Unable to load service settings.'

  try {
    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: await buildServiceSettingsHeaders(request),
      // The confirmed O24 settings-search contract has no request model: search is performed
      // against the returned settings client-side until the backend publishes filter/paging fields.
      // Update forwards only { name, value, organization_id, id }.
      body: JSON.stringify(body),
      cache: 'no-store'
    })
    const payload = await readServiceSettingsPayload(response)

    if (!response.ok || payload?.success === false) {
      return serviceSettingsErrorResponse(payload, response.ok ? 500 : response.status || 500, fallbackMessage)
    }

    return NextResponse.json(operation === 'update' ? payload ?? { success: true } : payload)
  } catch (error) {
    return NextResponse.json({ success: false, message: error instanceof Error ? error.message : fallbackMessage }, { status: 500 })
  }
}
