'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useFieldArray, useForm } from 'react-hook-form'

import type { Locale } from '@/configs/i18n'
import { useWorkingProjectStore } from '@/@core/stores/useWorkingProjectStore'
import { usePermission } from '@/shared/permissions/usePermission'
import SwalAlert from '@/shared/utils/SwalAlert'
import { getWorkflowErrorPresentation, type WorkflowErrorPresentation } from '@/shared/utils/workflowError'

import { residentText, type ResidentDictionary } from '../components/resident-list/residentListHelpers'
import type { GetEntityExtensionDataResponse, ResidentRelatedMember } from '../relatedMembers.types'
import { createResidentRelatedMembersService } from '../services/residentRelatedMembersService'
import { toResidentExtensionDrafts } from '../services/residentRelatedMembers.mapper'
import { changedResidentExtensionDrafts, mergeResidentExtensionUpsert, reconcileResidentExtensionGet, removeResidentExtensionField, summarizeRelatedMembers, validateRelatedMembers } from '../utils/residentRelatedMembers'
import type { NestedValueBridge } from '../utils/residentNestedJsonValue'
import { ResidentExtensionRequestGuard } from '../utils/residentExtensionRequestGuard'

type FormValues = { members: ResidentRelatedMember[] }
type DeleteTarget = { context: string; fieldKey: string; label: string }

export const useResidentRelatedMembersForm = ({ residentId, active, dictionary, sessiontoken, language }: {
    residentId: number; active: boolean; dictionary: ResidentDictionary; sessiontoken?: string; language: Locale
}) => {
    const permission = usePermission({ href: '/resident/list' })
    const projectCode = useWorkingProjectStore(state => state.project?.code)
    const projectReady = useWorkingProjectStore(state => state.status === 'READY')
    const contextKey = `${residentId}:${projectCode ?? ''}`
    const guard = useRef(new ResidentExtensionRequestGuard(contextKey)).current

    // Invalidate old callbacks as soon as a new resident/project renders, before effects.
    guard.setContext(contextKey)
    const service = useMemo(() => createResidentRelatedMembersService({ sessiontoken, language, scope: projectCode ?? '' }), [sessiontoken, language, projectCode])
    const [data, setData] = useState<GetEntityExtensionDataResponse | null>(null)
    const baseline = useRef<{ context: string; response: GetEntityExtensionDataResponse | null }>({ context: contextKey, response: null })
    const [loading, setLoading] = useState(false)
    const loadingRef = useRef(false)
    const [reloadKey, setReloadKey] = useState(0)
    const lastReload = useRef(0)
    const [saving, setSaving] = useState(false)
    const [deleting, setDeleting] = useState(false)
    const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null)
    const [showValidation, setShowValidation] = useState(false)
    const [error, setError] = useState<WorkflowErrorPresentation | null>(null)
    const [notice, setNotice] = useState<string | null>(null)
    // Per-row state reported by nested value editors: invalid sub-field names, and edits not yet
    // serialized into `field_value` (they are committed on blur and flushed before saving).
    const [invalidNestedRows, setInvalidNestedRows] = useState<ReadonlySet<string>>(() => new Set())
    const [pendingNestedRows, setPendingNestedRows] = useState<ReadonlySet<string>>(() => new Set())
    const nestedFlushers = useRef(new Map<string, () => void>())
    const nestedBridges = useRef(new Map<string, NestedValueBridge>())
    const nestedValueBridge = useCallback((clientId: string) => {
        let bridge = nestedBridges.current.get(clientId)

        if (!bridge) {
            const toggle = (set: typeof setInvalidNestedRows) => (on: boolean) => set(current => {
                if (current.has(clientId) === on) return current
                const next = new Set(current)

                if (on) next.add(clientId)
                else next.delete(clientId)

                return next
            })

            bridge = {
                onValidityChange: toggle(setInvalidNestedRows),
                onPendingChange: toggle(setPendingNestedRows),
                registerFlush: flush => {
                    nestedFlushers.current.set(clientId, flush)

                    return () => { if (nestedFlushers.current.get(clientId) === flush) nestedFlushers.current.delete(clientId) }
                }
            }
            nestedBridges.current.set(clientId, bridge)
        }

        return bridge
    }, [])
    const flushNestedValues = () => { for (const flush of nestedFlushers.current.values()) flush() }
    const form = useForm<FormValues>({ defaultValues: { members: [] } })
    const { control, reset, getValues, setValue, watch } = form
    // Keep the numeric backend id intact; RHF supplies a separate React key.
    const { fields, append, remove } = useFieldArray({ control, name: 'members', keyName: 'formKey' })
    // This hook lives in ResidentDetailPage: subscribing with useWatch re-rendered the whole page on
    // every keystroke. Instead keep a summary that only changes when something visible changes.
    const [summary, setSummary] = useState(() => summarizeRelatedMembers([], null))
    const refreshSummary = useCallback(() => {
        const next = summarizeRelatedMembers(getValues('members') ?? [], baseline.current.response)

        setSummary(current => current.signature === next.signature ? current : next)
    }, [getValues])

    useEffect(() => {
        const subscription = watch(() => refreshSummary())

        return () => subscription.unsubscribe()
    }, [watch, refreshSummary])
    const dirtyRef = useRef(false)
    const sameContext = baseline.current.context === contextKey
    const available = sameContext && data !== null && projectReady
    const validation = summary.labelInvalid.map(invalid => invalid ? { field_label: 'required' as const } : {})
    const changedCount = available && data ? summary.changedCount : 0
    const unresolvedCreate = summary.unresolvedCreate
    const hasInvalidJson = summary.clientIds.some(id => invalidNestedRows.has(id))
    const hasPendingNested = available && summary.clientIds.some(id => pendingNestedRows.has(id))
    const isDirty = changedCount > 0 || hasPendingNested
    const hasInvalidJsonRef = useRef(false)

    hasInvalidJsonRef.current = hasInvalidJson

    dirtyRef.current = isDirty
    const loadErrorMessage = residentText(dictionary, 'related_members_load_error', '')

    // A single reset with the final, already-reconciled draft keeps useFieldArray's `fields`
    // (what actually renders) and the raw form values (what isDirty/unresolvedCreate read) as
    // one source of truth. A reset-then-setValue two-step previously desynced them: fields kept
    // whatever reset last produced while the watched values moved on, so a row could be fully
    // unconfirmed in state (driving the "unsaved changes"/unconfirmed-create warnings) while the
    // table rendered no row for the user to act on.
    const install = useCallback((response: GetEntityExtensionDataResponse, drafts: ResidentRelatedMember[], context: string) => {
        baseline.current = { context, response }
        setData(response)
        reset({ members: drafts })
        refreshSummary()
        dirtyRef.current = changedResidentExtensionDrafts(drafts, response).length > 0
    }, [reset, refreshSummary])

    useEffect(() => {
        const contextChanged = baseline.current.context !== contextKey
        const forced = lastReload.current !== reloadKey

        lastReload.current = reloadKey
        if (contextChanged) {
            baseline.current = { context: contextKey, response: null }
            reset({ members: [] })
            dirtyRef.current = false
            setData(null); setError(null); setNotice(null); setDeleteTarget(null)
            setSaving(false); setDeleting(false); setShowValidation(false)
        }

        if (!active || !projectReady || guard.busy || (!forced && baseline.current.response !== null)) {
            loadingRef.current = false
            setLoading(false)

            return
        }

        const ticket = guard.ticket()
        let current = true

        loadingRef.current = true
        setLoading(true); setError(null); setNotice(null)
        void service.load(residentId).then(response => {
            if (!current || !guard.isCurrent(ticket) || guard.busy) return
            const previous = baseline.current.response
            const drafts = previous ? reconcileResidentExtensionGet(response, previous, getValues('members')) : toResidentExtensionDrafts(response)

            install(response, drafts, contextKey)
        }).catch(failure => {
            if (!current || !guard.isCurrent(ticket)) return
            // Do not turn failed reads into [] or reset any current draft.
            setError({ message: loadErrorMessage, executionId: getWorkflowErrorPresentation(failure).executionId })
        }).finally(() => {
            if (current && guard.isCurrent(ticket)) { loadingRef.current = false; setLoading(false) }
        })

        return () => { current = false }
    }, [active, contextKey, projectReady, residentId, service, reloadKey, reset, getValues, install, guard, loadErrorMessage])

    useEffect(() => () => guard.invalidate(), [guard])
    useEffect(() => {
        if (!isDirty) return
        const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = '' }

        window.addEventListener('beforeunload', warn)

        return () => window.removeEventListener('beforeunload', warn)
    }, [isDirty])

    const save = async () => {
        setShowValidation(true)
        // Serialize nested sub-fields still being edited (e.g. Enter pressed right after typing)
        // into `field_value` before reading the snapshot, so the last keystrokes are saved.
        flushNestedValues()
        const base = baseline.current.response
        const snapshot = getValues('members').map(row => ({ ...row }))

        if (!base || !available || !permission.canModify || loadingRef.current || validateRelatedMembers(snapshot).some(row => row.field_label)) return
        if (snapshot.some(row => !row.field_key && row.pendingCreate)) return
        if (hasInvalidJsonRef.current) return
        const submitted = changedResidentExtensionDrafts(snapshot, base)

        if (!submitted.length) return
        const ticket = guard.beginMutation()

        if (ticket === null) return
        const submittedIds = new Set(submitted.map(row => row.clientId))
        const attempted = snapshot.map(row => !row.field_key && submittedIds.has(row.clientId) ? {
            ...row,
            pendingCreate: { field_label: row.field_label.trim(), field_value: row.field_value.trim(), sort_order: row.sort_order, status: row.status }
        } : row)

        // A lost response is not proof that a create did not commit. Keep its
        // submitted values for GET reconciliation; never blindly create it again.
        setValue('members', attempted, { shouldDirty: true })
        setSaving(true); setError(null); setNotice(null)
        try {
            const ack = await service.save({ residentId, members: submitted })

            if (!guard.isCurrent(ticket)) return
            const merged = mergeResidentExtensionUpsert(base, ack, attempted, submitted)

            install(merged.response, merged.drafts, contextKey)
            setShowValidation(false)
            if (!changedResidentExtensionDrafts(merged.drafts, merged.response).length) {
                SwalAlert('success', residentText(dictionary, 'related_members_save_success', ''))
            } else {
                // The ack alone did not confirm every row (e.g. a partial response). Reconcile
                // against one fresh GET before giving up — never resubmit UPSERT automatically,
                // to avoid creating the same row twice.
                try {
                    const refreshed = await service.load(residentId)

                    if (!guard.isCurrent(ticket)) return
                    const reconciled = reconcileResidentExtensionGet(refreshed, merged.response, merged.drafts)

                    install(refreshed, reconciled, contextKey)
                    if (!changedResidentExtensionDrafts(reconciled, refreshed).length) {
                        SwalAlert('success', residentText(dictionary, 'related_members_save_success', ''))
                    } else {
                        setNotice(residentText(dictionary, 'related_members_partial_save', ''))
                    }
                } catch {
                    if (!guard.isCurrent(ticket)) return
                    // The reconciling GET failed too: keep the merged draft as-is and let the
                    // existing Retry action try again, instead of silently losing it.
                    setNotice(residentText(dictionary, 'related_members_partial_save', ''))
                }
            }
        } catch (failure) {
            if (guard.isCurrent(ticket)) setError({ message: residentText(dictionary, 'related_members_save_error', ''), executionId: getWorkflowErrorPresentation(failure).executionId })
        } finally {
            if (guard.finishMutation(ticket)) setSaving(false)
        }
    }

    const deleteField = (index: number) => {
        if (!available || guard.busy || loadingRef.current) return
        const row = getValues(`members.${index}`)

        if (!row) return
        if (!row.field_key) { if (permission.canModify) { remove(index); refreshSummary() } return }
        if (permission.canDelete) setDeleteTarget({ context: contextKey, fieldKey: row.field_key, label: row.field_label })
    }

    const confirmDelete = async () => {
        const base = baseline.current.response

        if (!deleteTarget || deleteTarget.context !== contextKey || !base || !available || !permission.canDelete || loadingRef.current) return
        const target = deleteTarget
        const ticket = guard.beginMutation()

        if (ticket === null) return
        setDeleting(true); setError(null); setNotice(null)
        let acknowledged = false

        try {
            await service.delete({ residentId, fieldKey: target.fieldKey })
            if (!guard.isCurrent(ticket)) return
            acknowledged = true
            const removed = removeResidentExtensionField(base, getValues('members'), target.fieldKey)

            install(removed.response, removed.drafts, contextKey)
            setDeleteTarget(null)
            const refreshed = await service.load(residentId)

            if (!guard.isCurrent(ticket)) return
            install(refreshed, reconcileResidentExtensionGet(refreshed, removed.response, getValues('members')), contextKey)
            SwalAlert('success', residentText(dictionary, 'related_members_delete_success', ''))
        } catch (failure) {
            if (!guard.isCurrent(ticket)) return
            setDeleteTarget(null)
            setError({ message: residentText(dictionary, acknowledged ? 'related_members_delete_reload_error' : 'related_members_delete_error', ''), executionId: getWorkflowErrorPresentation(failure).executionId })
        } finally {
            if (guard.finishMutation(ticket)) setDeleting(false)
        }
    }

    return {
        control, fields: sameContext ? fields : [], isDirty: sameContext && isDirty,
        saving, deleting, busy: saving || deleting,
        loading: loading || (active && (!sameContext || (!data && !error))),
        available, error: sameContext ? error : null,
        notice: sameContext ? (unresolvedCreate ? residentText(dictionary, 'related_members_create_unconfirmed', '') : notice) : null,
        dataMap: sameContext ? data?.data_map ?? {} : {}, totalItems: sameContext ? data?.total_items : undefined,
        canModify: permission.canModify, canDelete: permission.canDelete,
        canSave: available && (changedCount > 0 || hasPendingNested) && !unresolvedCreate && !hasInvalidJson && !validation.some(row => row.field_label),
        nestedValueBridge,
        validation: showValidation ? validation : [], validate: () => setShowValidation(true),
        retry: () => { if (!guard.busy) { loadingRef.current = true; setReloadKey(value => value + 1) } },
        addField: () => {
            if (!available || guard.busy || loadingRef.current || !permission.canModify) return
            const sortOrder = getValues('members').reduce((max, row) => Math.max(max, row.sort_order), 0) + 1

            append({ clientId: crypto.randomUUID(), field_label: '', field_value: '', sort_order: sortOrder, status: 'A' }, { shouldFocus: true })
            refreshSummary()
        },
        deleteField, deleteTarget: deleteTarget?.context === contextKey ? deleteTarget : null, confirmDelete, save,
        closeDelete: () => { if (!guard.busy) setDeleteTarget(null) },
        confirmTabLeave: () => !guard.busy && (!dirtyRef.current || window.confirm(residentText(dictionary, 'related_members_leave_confirm', '')))
    }
}
