'use client'

import { useCallback, useMemo } from 'react'
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined'
import ContentCopyOutlinedIcon from '@mui/icons-material/ContentCopyOutlined'
import HistoryOutlinedIcon from '@mui/icons-material/HistoryOutlined'
import RefreshOutlinedIcon from '@mui/icons-material/RefreshOutlined'
import { Alert, Box, Button, Chip, CircularProgress, Divider, IconButton, Paper, Stack, Tooltip, Typography } from '@mui/material'

import { useEntityAuditHistory } from '@/shared/hooks/useEntityAuditHistory'
import type { EntityAuditHistoryError } from '@/shared/hooks/useEntityAuditHistory'
import { entityAuditService } from '@/shared/services/entityAuditService'
import type { EntityAuditEntityName, EntityAuditItem } from '@/shared/types/entityAudit'
import { buildAuditDisplayEntries, formatAuditDateTime, getAuditActionPresentation, getAuditValueText } from '@/shared/utils/entityAuditHelpers'
import type { AuditDisplayEntry } from '@/shared/utils/entityAuditHelpers'

/** `t(key, fallback)` resolves the `history_*` texts from the caller's dictionary namespace. */
export type EntityAuditText = (key: string, fallback: string) => string

type EntityAuditDictionary = { entityAudit?: Record<string, string | undefined> } | null | undefined

const AuditValue = ({ value, emptyText }: { value: unknown; emptyText: string }) => {
    const text = getAuditValueText(value, emptyText)
    return <Tooltip title={text} placement="top-start"><Typography variant="body2" sx={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', overflowWrap: 'anywhere' }}>{text}</Typography></Tooltip>
}

const AuditItemCard = ({ entry, t, fieldLabel, locale }: { entry: AuditDisplayEntry<EntityAuditItem>; t: EntityAuditText; fieldLabel: (fieldName: string) => string; locale: string }) => {
    const { item, changes, malformed } = entry
    const action = getAuditActionPresentation(item.action_type)
    const emptyText = t('history_empty_value', 'Trống')
    const copyUserId = () => { if (typeof navigator !== 'undefined' && navigator.clipboard) void navigator.clipboard.writeText(item.user_id) }
    // "Người thực hiện" shows the Backend user_name; the user_id stays available as tooltip / copy reference only.
    const performedBy = item.user_name?.trim() || '-'

    return <Paper sx={{ p: { xs: 1.5, sm: 2 }, borderRadius: 2, border: 1, borderColor: 'divider' }}>
        <Stack spacing={1.25}>
            {/* Timestamp first and strongest, so the timeline is easy to scan. */}
            <Stack direction="row" alignItems="center" gap={0.875} data-audit-timestamp>
                <CalendarMonthOutlinedIcon color="primary" sx={{ fontSize: 18 }} />
                <Typography variant="body2" color="text.primary" sx={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{formatAuditDateTime(item.created_on_utc, locale, { withSeconds: true })}</Typography>
            </Stack>
            <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" gap={1}>
                <Stack direction="row" alignItems="center" gap={1} flexWrap="wrap"><Chip size="small" color={action.color} label={t(`history_action_${action.label}`, action.label)} sx={{ fontWeight: 800 }} /></Stack>
                <Stack direction="row" alignItems="center" gap={0.5} sx={{ minWidth: 0 }}><Typography variant="caption" color="text.secondary">{t('history_actor', 'Người thực hiện')}:</Typography><Tooltip title={item.user_id || '-'}><Typography variant="caption" sx={{ fontWeight: 600 }} data-audit-actor>{performedBy}</Typography></Tooltip>{item.user_id && <Tooltip title={t('history_copy_actor', 'Sao chép')}><IconButton size="small" onClick={copyUserId} aria-label={t('history_copy_actor', 'Sao chép')}><ContentCopyOutlinedIcon sx={{ fontSize: 15 }} /></IconButton></Tooltip>}</Stack>
            </Stack>
            <Typography variant="caption" color="text.secondary" sx={{ overflowWrap: 'anywhere' }}>execution_id: {item.execution_id || '-'}</Typography>
            <Divider />
            {item.action_type?.trim().toUpperCase() === 'I' && changes.length === 0 && !malformed ? <Typography variant="body2">{t('history_created_fallback', 'Bản ghi được khởi tạo')}</Typography>
                : malformed ? <Typography variant="body2" color="text.secondary">{t('history_invalid_changes', 'Không đọc được chi tiết thay đổi')}</Typography>
                    : changes.length === 0 ? <Typography variant="body2" color="text.secondary">{t('history_no_changes', 'Không có thay đổi chi tiết')}</Typography>
                        : <Stack spacing={1.25}>{changes.map((change, index) => <Box key={`${change.FieldName}-${index}`} sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'minmax(150px, 0.8fr) minmax(0, 1fr) auto minmax(0, 1fr)' }, gap: 1, alignItems: 'center' }}><Typography variant="body2" sx={{ fontWeight: 800, overflowWrap: 'anywhere' }}>{fieldLabel(change.FieldName)}</Typography><AuditValue value={change.OldValue} emptyText={emptyText} /><Typography color="text.secondary" aria-label="changed to">→</Typography><AuditValue value={change.NewValue} emptyText={emptyText} /></Box>)}</Stack>}
        </Stack>
    </Paper>
}

type ViewProps = {
    title: string
    t: EntityAuditText
    /** Label of a changed field; unknown fields fall back to the raw FieldName. */
    fieldLabel?: (fieldName: string) => string
    locale: string
    items: EntityAuditItem[]
    loading: boolean
    error: EntityAuditHistoryError | null
    onReload: () => void
    /** Business fields the screen no longer uses (e.g. retired columns); never listed as changes. */
    hiddenFields?: readonly string[]
}

const NO_HIDDEN_FIELDS: readonly string[] = []

const rawFieldLabel = (fieldName: string) => fieldName || '-'

/** Presentation shared by every entity's change history (loading / error / empty / newest-first list). */
export const EntityAuditHistoryView = ({ title, t, fieldLabel = rawFieldLabel, locale, items, loading, error, onReload, hiddenFields = NO_HIDDEN_FIELDS }: ViewProps) => {
    const entries = useMemo(() => buildAuditDisplayEntries(items, hiddenFields), [items, hiddenFields])
    return <Paper sx={{ p: { xs: 2, sm: 3 }, borderRadius: 2, border: 1, borderColor: 'divider' }}><Stack spacing={2.5}>
        <Stack direction="row" justifyContent="space-between" gap={1} alignItems="center"><Stack direction="row" gap={1} alignItems="center"><HistoryOutlinedIcon color="primary" /><Typography variant="h6" sx={{ fontWeight: 900 }}>{title}</Typography></Stack><Button size="small" variant="outlined" startIcon={<RefreshOutlinedIcon />} onClick={onReload} disabled={loading}>{t('history_reload', 'Tải lại')}</Button></Stack>
        {loading ? <Stack alignItems="center" spacing={1.5} sx={{ py: 4 }}><CircularProgress size={28} /><Typography color="text.secondary">{t('history_loading', 'Đang tải lịch sử thao tác')}</Typography></Stack>
            : error ? <Alert severity="error">{error.message}{error.executionId && <Box component="span" sx={{ display: 'block', mt: 0.5 }}>{t('history_error_reference', 'Mã tra cứu lỗi')}: {error.executionId}</Box>}</Alert>
                : entries.length === 0 ? <Alert severity="info">{t('history_empty', 'Chưa có lịch sử thao tác')}</Alert>
                    : <Stack spacing={1.5} sx={{ borderLeft: 2, borderColor: 'divider', pl: { xs: 1.5, sm: 2 } }}>{entries.map(entry => <AuditItemCard key={entry.item.id || `${entry.item.execution_id}-${entry.item.created_on_utc}`} entry={entry} t={t} fieldLabel={fieldLabel} locale={locale} />)}</Stack>}
    </Stack></Paper>
}

type Props = {
    /** False until the history is actually needed (e.g. its tab is opened): nothing is fetched meanwhile. */
    active?: boolean
    /** Exact Backend entity/table name, e.g. "Project", "Building" (Tower screens), "Floor". */
    entityName: EntityAuditEntityName
    /** Id of the record currently opened (not a parent id). No request is made without a valid id. */
    entityId: number | null | undefined
    dictionary: EntityAuditDictionary
    locale: string
    /** Retired business fields of this entity to leave out of the history (keep the array stable). */
    hiddenFields?: readonly string[]
    /** Display labels keyed by the Backend FieldName; unknown fields fall back to the FieldName itself. */
    fieldLabels?: Readonly<Record<string, string>>
    /** Bump after the parent record was saved successfully to reload the history without F5. */
    refreshKey?: number
}

/** "Lịch sử thay đổi" section for a detail screen: fetches POST /ips/api/entity-audit/get via the BFF. */
const EntityAuditHistory = ({ active = true, entityName, entityId, dictionary, locale, hiddenFields, fieldLabels, refreshKey }: Props) => {
    const loader = useCallback(
        (id: number, signal: AbortSignal) => entityAuditService.getHistory(entityName, id, locale, signal),
        [entityName, locale]
    )
    const { items, loading, error, reload } = useEntityAuditHistory({ entityId, loader, enabled: active, refreshKey })
    const t: EntityAuditText = (key, fallback) => dictionary?.entityAudit?.[key] ?? fallback
    const fieldLabel = (fieldName: string) => fieldLabels?.[fieldName] ?? rawFieldLabel(fieldName)

    return <EntityAuditHistoryView title={t('history_title', 'Change history')} t={t} locale={locale} fieldLabel={fieldLabel} items={items} loading={loading} error={error} onReload={reload} hiddenFields={hiddenFields} />
}

export default EntityAuditHistory
