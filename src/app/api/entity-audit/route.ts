import { NextRequest, NextResponse } from 'next/server'

import { proxyEntityAudit, readEntityAuditId } from '@/app/api/_lib/entityAuditProxy'
import { isEntityAuditEntityName } from '@/shared/types/entityAudit'

/**
 * Generic change history BFF for the detail screens: { entity_name, entity_id } -> POST
 * /ips/api/entity-audit/get. Only whitelisted entity names are forwarded.
 */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null)
  const root = body && typeof body === 'object' ? body as Record<string, unknown> : {}
  const entityName = root.entity_name
  const entityId = readEntityAuditId(root.entity_id)

  if (!isEntityAuditEntityName(entityName)) {
    return NextResponse.json({ success: false, message: 'Unsupported audit entity.' }, { status: 400 })
  }

  if (!Number.isInteger(entityId) || entityId <= 0) {
    return NextResponse.json({ success: false, message: 'Invalid audit entity id.' }, { status: 400 })
  }

  return proxyEntityAudit(request, entityName, entityId)
}
