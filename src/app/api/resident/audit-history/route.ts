import { NextRequest, NextResponse } from 'next/server'

import { proxyEntityAudit, readEntityAuditId } from '@/app/api/_lib/entityAuditProxy'

// Resident keeps its dedicated BFF: the entity is fixed server-side and the body only carries the id.
export async function POST(request: NextRequest) {
    const body = await request.json().catch(() => null)
    const entityId = readEntityAuditId(body && typeof body === 'object' ? (body as Record<string, unknown>).entity_id : undefined)

    if (!Number.isInteger(entityId) || entityId <= 0) {
        return NextResponse.json({ success: false, message: 'Invalid resident entity id.' }, { status: 400 })
    }

    return proxyEntityAudit(request, 'Resident', entityId)
}
