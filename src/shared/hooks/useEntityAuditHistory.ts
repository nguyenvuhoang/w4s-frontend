import { useCallback, useEffect, useRef, useState } from 'react'

import { EntityAuditError } from '@/shared/services/entityAuditService'
import type { EntityAuditItem } from '@/shared/types/entityAudit'

export type EntityAuditHistoryError = { message: string; executionId?: string }

type Loader = (entityId: number, signal: AbortSignal) => Promise<EntityAuditItem[]>

/**
 * Loads the change history of one record. No request is made while disabled or without a valid id.
 * When the id (or loader) changes, the previous record's history is cleared right away and any in-flight
 * request is aborted, so another entity's history is never shown.
 * `refreshKey` lets the parent screen trigger a reload (e.g. after a successful update); changing it aborts
 * any in-flight request so only the latest response is applied.
 */
export const useEntityAuditHistory = ({ entityId, loader, enabled, refreshKey = 0 }: { entityId: number | null | undefined; loader: Loader; enabled: boolean; refreshKey?: number }) => {
    const [items, setItems] = useState<EntityAuditItem[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<EntityAuditHistoryError | null>(null)
    const [reloadKey, setReloadKey] = useState(0)
    const requestRef = useRef<AbortController | null>(null)
    const reload = useCallback(() => setReloadKey(value => value + 1), [])

    useEffect(() => {
        requestRef.current?.abort()
        if (!enabled || !entityId || !Number.isInteger(entityId) || entityId <= 0) {
            return undefined
        }
        const controller = new AbortController()
        requestRef.current = controller
        let current = true
        void Promise.resolve().then(async () => {
            if (!current || controller.signal.aborted) return
            setItems([]); setLoading(true); setError(null)
            try {
                const data = await loader(entityId, controller.signal)
                if (current && !controller.signal.aborted) setItems(data)
            } catch (reason: unknown) {
                if (!current || controller.signal.aborted) return
                setError(reason instanceof EntityAuditError
                    ? { message: reason.message, executionId: reason.executionId }
                    : { message: reason instanceof Error ? reason.message : 'Không thể tải lịch sử thao tác.' })
                setItems([])
            } finally {
                if (current && !controller.signal.aborted) setLoading(false)
            }
        })
        return () => { current = false; controller.abort() }
    }, [enabled, entityId, loader, reloadKey, refreshKey])

    return { items, loading, error, reload }
}
