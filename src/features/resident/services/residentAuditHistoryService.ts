import { EntityAuditError, requestEntityAudit } from '@/shared/services/entityAuditService'

import type { ResidentAuditItem } from '../types'

// Resident keeps its dedicated BFF (entity fixed server-side); parsing/errors are the shared entity-audit ones.
const AUDIT_HISTORY_PATH = '/api/resident/audit-history'

export class ResidentAuditHistoryError extends EntityAuditError {
    constructor(message: string, executionId?: string) {
        super(message, executionId)
        this.name = 'ResidentAuditHistoryError'
    }
}

export const residentAuditHistoryService = {
    async getHistory(entityId: number, language: string, signal?: AbortSignal): Promise<ResidentAuditItem[]> {
        if (!Number.isInteger(entityId) || entityId <= 0) {
            throw new ResidentAuditHistoryError('Invalid resident entity id.')
        }

        return requestEntityAudit(AUDIT_HISTORY_PATH, { entity_id: entityId }, language, signal)
    }
}
