import type { EntityAuditEntityName, EntityAuditItem } from '@/shared/types/entityAudit'

const ENTITY_AUDIT_PATH = '/api/entity-audit'
const DEFAULT_ERROR_MESSAGE = 'Không thể tải lịch sử thao tác.'

export class EntityAuditError extends Error {
    executionId?: string

    constructor(message: string, executionId?: string) {
        super(message)
        this.name = 'EntityAuditError'
        this.executionId = executionId
    }
}

const getString = (value: unknown) => value === null || value === undefined ? '' : String(value)

const toNumber = (value: unknown) => {
    const numberValue = Number(value)

    return Number.isFinite(numberValue) ? numberValue : 0
}

const mapItem = (item: Record<string, unknown>): EntityAuditItem => ({
    id: toNumber(item.id),
    entity_name: getString(item.entity_name),
    entity_id: toNumber(item.entity_id),
    user_id: getString(item.user_id),
    user_name: getString(item.user_name).trim(),
    execution_id: getString(item.execution_id),
    action_type: getString(item.action_type),
    changes: getString(item.changes),
    created_on_utc: item.created_on_utc === null || item.created_on_utc === undefined ? null : String(item.created_on_utc),
    updated_on_utc: item.updated_on_utc === null || item.updated_on_utc === undefined ? null : String(item.updated_on_utc)
})

/** Accepts the endpoint's array response as well as { data: [...] } / { data: { items } } shapes. */
export const parseEntityAuditItems = (payload: unknown): EntityAuditItem[] => {
    if (Array.isArray(payload)) {
        return payload
            .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object' && !Array.isArray(item))
            .map(mapItem)
    }
    const root = payload && typeof payload === 'object' ? payload as Record<string, unknown> : {}
    const data = root.data && typeof root.data === 'object' ? root.data as Record<string, unknown> : root
    const rawItems = Array.isArray(root.data) ? root.data : Array.isArray(data.items) ? data.items : Array.isArray(root.items) ? root.items : data.id !== undefined ? [data] : []

    return rawItems
        .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object' && !Array.isArray(item))
        .map(mapItem)
}

export const getEntityAuditErrorDetails = (payload: unknown) => {
    const root = payload && typeof payload === 'object' ? payload as Record<string, unknown> : {}
    const errors = Array.isArray(root.errors) ? root.errors : []
    const firstError = errors[0] && typeof errors[0] === 'object' ? errors[0] as Record<string, unknown> : {}
    const message = getString(firstError.info ?? firstError.message ?? root.message ?? DEFAULT_ERROR_MESSAGE)
    const executionId = getString(firstError.execution_id ?? firstError.execute_id ?? root.execution_id ?? root.executionId) || undefined

    return { message, executionId }
}

/** POSTs `body` to a same-origin audit BFF and maps the response (shared by the generic and Resident BFFs). */
export const requestEntityAudit = async (path: string, body: Record<string, unknown>, language: string, signal?: AbortSignal): Promise<EntityAuditItem[]> => {
    const response = await fetch(path, {
        method: 'POST',
        headers: { 'content-type': 'application/json', lang: language },
        body: JSON.stringify(body),
        signal
    })
    const payload = await response.json().catch(() => null)

    if (!response.ok || (payload && typeof payload === 'object' && (payload as Record<string, unknown>).success === false)) {
        const { message, executionId } = getEntityAuditErrorDetails(payload)

        throw new EntityAuditError(message, executionId)
    }

    return parseEntityAuditItems(payload)
}

export const entityAuditService = {
    /** Change history of one record: { entity_name, entity_id } where entity_id is the id of the opened record. */
    async getHistory(entityName: EntityAuditEntityName, entityId: number, language: string, signal?: AbortSignal): Promise<EntityAuditItem[]> {
        if (!Number.isInteger(entityId) || entityId <= 0) {
            throw new EntityAuditError('Invalid audit entity id.')
        }

        return requestEntityAudit(ENTITY_AUDIT_PATH, { entity_name: entityName, entity_id: entityId }, language, signal)
    }
}
