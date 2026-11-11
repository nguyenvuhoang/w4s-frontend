import type { GetEntityExtensionDataResponse, ResidentRelatedMember, UpsertEntityExtensionDataResponse } from '../relatedMembers.types'
import { toResidentExtensionDrafts } from '../services/residentRelatedMembers.mapper'

export const validateRelatedMembers = (rows: ResidentRelatedMember[]): Array<{ field_label?: 'required' }> =>
    rows.map(row => row.field_label.trim() ? {} : { field_label: 'required' })

const sameValue = (a: ResidentRelatedMember, b: Pick<ResidentRelatedMember, 'field_label' | 'field_value' | 'sort_order' | 'status'>) =>
    a.field_label.trim() === b.field_label.trim() && a.field_value.trim() === b.field_value.trim()
    && a.sort_order === b.sort_order && a.status === b.status

// A brand-new row the user has not typed anything into yet is not a real edit — it must not
// drive isDirty/unsaved warnings or block navigation until it actually has content.
const isBlankNewRow = (row: ResidentRelatedMember) =>
    !row.field_key && !row.field_label.trim() && !row.field_value.trim()

export const changedResidentExtensionDrafts = (rows: ResidentRelatedMember[], baseline: GetEntityExtensionDataResponse): ResidentRelatedMember[] => {
    const byKey = new Map(baseline.items.map(item => [item.field_key, item]))

    return rows.filter(row => {
        if (isBlankNewRow(row)) return false
        const saved = row.field_key ? byKey.get(row.field_key) : undefined

        return !saved || !sameValue(row, saved)
    })
}

export type RelatedMembersSummary = {
    labelInvalid: boolean[]
    changedCount: number
    unresolvedCreate: boolean
    clientIds: string[]
    signature: string
}

/**
 * Everything the page-level hook needs from the current draft rows. Computed in a form
 * subscription and only stored when `signature` changes, so typing a character does not
 * re-render the whole Resident Detail page.
 */
export const summarizeRelatedMembers = (rows: ResidentRelatedMember[], baseline: GetEntityExtensionDataResponse | null): RelatedMembersSummary => {
    const labelInvalid = validateRelatedMembers(rows).map(row => Boolean(row.field_label))
    const changedCount = baseline ? changedResidentExtensionDrafts(rows, baseline).length : 0
    const unresolvedCreate = rows.some(row => !row.field_key && row.pendingCreate)
    const clientIds = rows.map(row => row.clientId)

    return {
        labelInvalid, changedCount, unresolvedCreate, clientIds,
        signature: `${labelInvalid.map(Number).join('')}|${changedCount}|${Number(unresolvedCreate)}|${clientIds.join(',')}`
    }
}

export const reconcileResidentExtensionGet =(incoming: GetEntityExtensionDataResponse, baseline: GetEntityExtensionDataResponse | null, drafts: ResidentRelatedMember[]): ResidentRelatedMember[] => {
    const next = toResidentExtensionDrafts(incoming)
    const changed = baseline ? changedResidentExtensionDrafts(drafts, baseline) : drafts
    const original = new Map(drafts.filter(row => row.field_key).map(row => [row.field_key!, row]))
    const previousKeys = new Set(baseline?.items.map(row => row.field_key) ?? [])
    const previousByKey = new Map(baseline?.items.map(row => [row.field_key, row]) ?? [])
    const matched = new Set<string>()

    // Preserve client identity for existing fields even after a full backend refresh.
    const result = next.map(row => ({ ...row, clientId: original.get(row.field_key!)?.clientId ?? row.clientId }))
    const pendingCreateCount = changed.filter(row => !row.field_key && row.pendingCreate).length
    const newServerRows = result.filter(row => row.field_key && !previousKeys.has(row.field_key))

    for (const draft of changed) {
        let index = draft.field_key ? result.findIndex(row => row.field_key === draft.field_key) : -1

        if (!draft.field_key && draft.pendingCreate) {
            const attempted = draft.pendingCreate
            // Cardinality alone resolves it when there is exactly one unconfirmed create and
            // exactly one brand-new server row: nothing else it could be, whatever echoed back.
            const candidates = pendingCreateCount === 1 && newServerRows.length === 1
                ? newServerRows.filter(row => !matched.has(row.field_key!))
                : result.filter(row =>
                    row.field_key && !previousKeys.has(row.field_key) && !matched.has(row.field_key)
                    && row.field_label === attempted.field_label && row.field_value === attempted.field_value
                    && row.sort_order === attempted.sort_order && row.status === attempted.status)

            if (candidates.length === 1) {
                const official = candidates[0]

                index = result.findIndex(row => row.field_key === official.field_key)
                const { pendingCreate, ...local } = draft

                matched.add(official.field_key!)
                result[index] = { ...official, ...local, field_key: official.field_key, id: official.id, ref_domain: official.ref_domain, ref_record_id: official.ref_record_id }
                continue
            }
        }

        if (index >= 0) {
            const previous = previousByKey.get(draft.field_key!)
            const remote = result[index]

            result[index] = {
                ...remote, clientId: draft.clientId,
                field_label: !previous || draft.field_label.trim() !== previous.field_label.trim() ? draft.field_label : remote.field_label,
                field_value: !previous || draft.field_value.trim() !== previous.field_value.trim() ? draft.field_value : remote.field_value,
                sort_order: !previous || draft.sort_order !== previous.sort_order ? draft.sort_order : remote.sort_order,
                status: !previous || draft.status !== previous.status ? draft.status : remote.status
            }
        } else result.push(draft)
    }

    return result.sort((a, b) => a.sort_order - b.sort_order)
}

export const mergeResidentExtensionUpsert = (baseline: GetEntityExtensionDataResponse, ack: UpsertEntityExtensionDataResponse, drafts: ResidentRelatedMember[], submitted: ResidentRelatedMember[]) => {
    const byKey = new Map(baseline.items.map(item => [item.field_key, item]))

    for (const item of ack.items) byKey.set(item.field_key, item)
    const response: GetEntityExtensionDataResponse = {
        ref_domain: ack.ref_domain, ref_record_id: ack.ref_record_id, total_items: ack.total_items,
        items: [...byKey.values()].sort((a, b) => a.sort_order - b.sort_order),
        data_map: {
            ...baseline.data_map, ...ack.data_map,
            ...Object.fromEntries(ack.items.map(item => [item.field_key, item.field_value]))
        }
    }
    const remaining = drafts.map(row => ({ ...row }))
    const submittedIds = new Set(submitted.map(row => row.clientId))
    const changedIds = new Set(changedResidentExtensionDrafts(drafts, baseline).map(row => row.clientId))
    const used = new Set<string>()
    const newAckItems = ack.items.filter(item => !baseline.items.some(row => row.field_key === item.field_key))
    const pendingNewRows = remaining.filter(row => !row.field_key && submittedIds.has(row.clientId))
    // Cardinality alone resolves it when exactly one new row was submitted and exactly one new
    // official row came back: it is this request's row regardless of echoed label/sort_order.
    const unambiguousSingleCreateId = pendingNewRows.length === 1 && newAckItems.length === 1 ? pendingNewRows[0].clientId : null

    for (const item of ack.items) {
        let index = remaining.findIndex(row => row.field_key === item.field_key)

        if (index < 0 && !baseline.items.some(row => row.field_key === item.field_key)) {
            if (unambiguousSingleCreateId) {
                index = remaining.findIndex(row => row.clientId === unambiguousSingleCreateId)
            } else {
                // Correlate a new row with its request only when unambiguous. Its official
                // identity is always the returned key, never a generated label/slug.
                const candidates = remaining.map((row, position) => ({ row, position })).filter(({ row }) =>
                    !row.field_key && submittedIds.has(row.clientId) && !used.has(row.clientId)
                    && row.field_label.trim() === item.field_label.trim() && row.sort_order === item.sort_order)

                if (candidates.length === 1) index = candidates[0].position
            }
        }

        if (index >= 0) {
            const row = remaining[index]

            if (submittedIds.has(row.clientId) || !changedIds.has(row.clientId)) {
                used.add(row.clientId)
                remaining[index] = { ...item, clientId: row.clientId }
            }
        } else {
            remaining.push({ ...item, clientId: `saved:${item.ref_record_id}:${item.field_key}` })
        }
    }

    return { response, drafts: remaining.sort((a, b) => a.sort_order - b.sort_order) }
}

export const removeResidentExtensionField = (baseline: GetEntityExtensionDataResponse, drafts: ResidentRelatedMember[], fieldKey: string) => {
    const items = baseline.items.filter(item => item.field_key !== fieldKey)
    const dataMap = Object.fromEntries(Object.entries(baseline.data_map).filter(([key]) => key !== fieldKey))

    return {
        response: { ...baseline, items, total_items: Math.max(0, baseline.total_items - (items.length < baseline.items.length ? 1 : 0)), data_map: dataMap },
        drafts: drafts.filter(row => row.field_key !== fieldKey)
    }
}
