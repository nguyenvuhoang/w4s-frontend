import { useCallback } from 'react'

import { useEntityAuditHistory } from '@/shared/hooks/useEntityAuditHistory'

import { residentAuditHistoryService } from '../services/residentAuditHistoryService'

// Resident history = shared entity-audit hook (abort/stale handling) over the Resident BFF.
export const useResidentAuditHistory = ({ entityId, language, enabled }: { entityId: number | null | undefined; language: string; enabled: boolean }) => {
    const loader = useCallback(
        (id: number, signal: AbortSignal) => residentAuditHistoryService.getHistory(id, language, signal),
        [language]
    )

    return useEntityAuditHistory({ entityId, loader, enabled })
}
