import { NextRequest, NextResponse } from 'next/server'

import { i18n } from '@/configs/i18n'
import { hasStaticRouteAccess } from '@/configs/staticRouteAccess'
import { getConfigFileServiceDefinition } from '@/features/system-settings/config-files/services/configFileServiceRegistry'
import {
  buildDataMigrationExportPayload, DATA_MIGRATION_PATH, isZipArchive
} from '@/features/system-settings/data-migration/dataMigrationConfig'
import {
  buildConfigFilesBackendHeaders,
  getConfigFilesBackendBaseUrl
} from '@/servers/system-settings/configFilesGateway.server'
import { BoContextError, boContextService } from '@/shared/services/boContextService'
import { getWorkflowErrorPresentation } from '@/shared/utils/workflowError'
import logger from '@lib/logger'

const transferPaths = {
  tables: 'getavailabletables',
  export: 'exporttableszip/export-zip',
  import: 'importtableszip/import-zip'
} as const

const archiveTypes = ['application/zip', 'application/x-zip-compressed', 'application/octet-stream']
const unsupportedStatuses = [404, 405, 501]

const errorResponse = (status: number, executionId?: string) =>
  NextResponse.json({ success: false, execution_id: executionId || undefined }, { status })

async function proxyTransfer(request: NextRequest, operation: keyof typeof transferPaths) {
  const service = getConfigFileServiceDefinition(request.nextUrl.searchParams.get('service') ?? '')

  if (!service || service.status !== 'available') return errorResponse(400)

  try {
    const headers = new Headers(await buildConfigFilesBackendHeaders(request))
    const token = headers.get('uid')

    if (!token) return errorResponse(401)

    const locale = i18n.locales.find(value => value === headers.get('lang')) ?? i18n.defaultLocale
    const context = await boContextService.getContext({ sessiontoken: token, language: locale })

    if (!hasStaticRouteAccess({
      route: DATA_MIGRATION_PATH,
      action: operation === 'import' ? 'IMPORT' : 'EXPORT',
      isSuperAdmin: context.isSuperAdmin
    })) return errorResponse(403)

    const host = getConfigFilesBackendBaseUrl()

    if (!host) return errorResponse(500)

    const upstreamUrl = new URL(`${host}/${service.key}/api/datatransfer/${transferPaths[operation]}`)

    const timezone = request.headers.get('x-timezone')

    headers.set('lang', locale)
    if (timezone) headers.set('X-Timezone', timezone)

    let body: string | FormData | undefined

    if (operation === 'export') {
      const tables: unknown = (await request.json().catch(() => null))?.table_names

      if (!Array.isArray(tables) || !tables.length ||
        !tables.every(table => typeof table === 'string' && /^[\p{L}_][\p{L}\p{N}_$]*(?:\.[\p{L}_][\p{L}\p{N}_$]*)*$/u.test(table))) {
        return errorResponse(400)
      }

      body = JSON.stringify(buildDataMigrationExportPayload(tables))
      headers.set('accept', 'application/zip')
      headers.set('content-type', 'application/json')
    } else if (operation === 'import') {
      const preserveIdentity = request.nextUrl.searchParams.get('preserveIdentity')
      const files = (await request.formData().catch(() => null))?.getAll('file')
      const file = files?.[0]

      if ((preserveIdentity !== 'true' && preserveIdentity !== 'false') ||
        files?.length !== 1 || !file || typeof file === 'string' ||
        !file.name.toLowerCase().endsWith('.zip') || !await isZipArchive(file)) {
        return errorResponse(400)
      }

      upstreamUrl.searchParams.set('preserveIdentity', preserveIdentity)
      headers.delete('content-type')
      headers.set('accept', 'application/json')
      body = new FormData()
      body.append('file', file, file.name)
    } else {
      headers.delete('content-type')
    }

    const upstream = await fetch(upstreamUrl.toString(), {
      method: operation === 'tables' ? 'GET' : 'POST',
      headers,
      body,
      cache: 'no-store',
      redirect: 'error',
      signal: operation !== 'import'
        ? AbortSignal.any([request.signal, AbortSignal.timeout(operation === 'tables' ? 30_000 : 120_000)])
        : AbortSignal.timeout(120_000)
    })
    const contentType = upstream.headers.get('content-type')?.split(';')[0].trim().toLowerCase() ?? ''

    if (operation === 'export' && upstream.ok && upstream.body && archiveTypes.includes(contentType)) {
      const responseHeaders = new Headers({
        'cache-control': 'no-store',
        'content-type': 'application/zip',
        'x-content-type-options': 'nosniff'
      })
      const disposition = upstream.headers.get('content-disposition')

      if (disposition) responseHeaders.set('content-disposition', disposition)

      return new Response(upstream.body, { headers: responseHeaders })
    }

    const payload = await upstream.json().catch(() => null)
    const businessError = [payload, payload?.data].some(value => value?.success === false ||
      ['ERROR', 'FAILED'].includes(String(value?.status ?? '').toUpperCase()) ||
      (Array.isArray(value?.errors) && value.errors.length > 0))

    if (operation === 'tables' && upstream.ok && !businessError) {
      // CMS returns the array directly, while CTH wraps it in the standard response envelope.
      const tables = payload?.success === true ? payload.data : payload

      if (Array.isArray(tables) && tables.every((name: unknown) => typeof name === 'string' && name.trim())) {
        return NextResponse.json({ tables: [...new Set(tables)] }, { headers: { 'cache-control': 'no-store' } })
      }
    }

    if (operation === 'import' && upstream.ok && !businessError &&
      payload && typeof payload === 'object' && !Array.isArray(payload)) {
      const description = [payload.description, payload.message, payload.data?.description, payload.data?.message]
        .find(value => typeof value === 'string' && value.trim() && value.length <= 300)

      return NextResponse.json({ success: true, description: description?.trim() })
    }

    const detail = getWorkflowErrorPresentation(payload)
    const nestedDetail = getWorkflowErrorPresentation(payload?.data)
    const executionId = detail.executionId || nestedDetail.executionId

    logger.warn('Data migration request rejected', {
      service: service.code,
      operation,
      status: upstream.status,
      errorCode: detail.errorCode || nestedDetail.errorCode,
      executionId
    })

    if (unsupportedStatuses.includes(upstream.status)) return errorResponse(501, executionId)
    if (!upstream.ok) return errorResponse(upstream.status, executionId)

    return errorResponse(businessError ? 422 : 502, executionId)
  } catch (error) {
    if (error instanceof BoContextError) {
      return errorResponse(error.httpStatus === 401 ? 401 : 502, error.executionId)
    }

    if (operation === 'import' && error instanceof Error && error.name === 'TimeoutError') {
      return errorResponse(504)
    }

    return errorResponse(502)
  }
}

type RouteContext = { params: Promise<{ operation: string }> }

export async function GET(request: NextRequest, { params }: RouteContext) {
  const { operation } = await params

  return operation === 'tables' ? proxyTransfer(request, operation) : errorResponse(404)
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  const { operation } = await params

  if (operation !== 'export' && operation !== 'import') return errorResponse(404)
  if (request.headers.get('origin') !== request.nextUrl.origin) return errorResponse(403)

  return proxyTransfer(request, operation)
}
