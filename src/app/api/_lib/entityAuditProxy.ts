import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

import { env } from '@/env.mjs'
import { resolveImportGatewayBaseUrl } from '@/app/api/_lib/importValidationProxy'
import { getBackendToken } from '@/server/auth/getBackendToken'
import type { EntityAuditEntityName } from '@/shared/types/entityAudit'

const ENTITY_AUDIT_PATH = '/ips/api/entity-audit/get'
const DEFAULT_ERROR_MESSAGE = 'Không thể tải lịch sử thao tác.'

const getString = (value: unknown) => typeof value === 'string' && value.trim() ? value.trim() : ''

const getErrorPayload = (payload: unknown, fallback: string) => {
  const root = payload && typeof payload === 'object' ? payload as Record<string, unknown> : {}
  const errors = Array.isArray(root.errors) ? root.errors : []
  const firstError = errors[0] && typeof errors[0] === 'object' ? errors[0] as Record<string, unknown> : {}

  return {
    success: false,
    message: getString(firstError.info ?? firstError.message ?? root.message) || fallback,
    execution_id: getString(firstError.execution_id ?? firstError.execute_id ?? root.execution_id ?? root.executionId) || undefined
  }
}

/** Positive integer entity id from a JSON body value, NaN otherwise. */
export const readEntityAuditId = (value: unknown) => (typeof value === 'number' && Number.isInteger(value) && value > 0 ? value : NaN)

/**
 * Shared BFF call to POST /ips/api/entity-audit/get { entity_name, entity_id }. The backend credential
 * is resolved server-side (never trusted from the browser) and error execution ids are preserved.
 * Callers are responsible for validating/whitelisting `entityName` and `entityId`.
 */
export async function proxyEntityAudit(request: NextRequest, entityName: EntityAuditEntityName, entityId: number) {
  try {
    const credential = await getBackendToken(request)

    if (!credential?.accessToken) {
      return NextResponse.json({ success: false, message: 'Phiên đăng nhập không hợp lệ.' }, { status: 401 })
    }

    const baseUrl = resolveImportGatewayBaseUrl()

    if (!baseUrl) {
      return NextResponse.json({ success: false, message: 'Entity audit endpoint is not configured.' }, { status: 500 })
    }

    const headers: Record<string, string> = {
      'content-type': 'application/json',
      uid: credential.accessToken
    }
    const language = request.headers.get('lang')
    const application = env.NEXT_PUBLIC_APPLICATION_CODE
    const deviceId = request.headers.get('device_id')
    const userAgent = request.headers.get('user-agent')

    if (language) headers.lang = language
    if (application) headers.app = application
    if (deviceId) headers.my_device = JSON.stringify({ device_id: deviceId })
    if (userAgent) headers['user-agent'] = userAgent

    const upstream = await fetch(`${baseUrl}${ENTITY_AUDIT_PATH}`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ entity_name: entityName, entity_id: entityId }),
      cache: 'no-store'
    })
    const payload = await upstream.json().catch(() => null)

    if (!upstream.ok || (payload && typeof payload === 'object' && (payload as Record<string, unknown>).success === false)) {
      return NextResponse.json(getErrorPayload(payload, DEFAULT_ERROR_MESSAGE), { status: upstream.ok ? 422 : upstream.status })
    }

    return NextResponse.json(payload ?? { data: [] }, { status: upstream.status })
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : DEFAULT_ERROR_MESSAGE
    }, { status: 500 })
  }
}
