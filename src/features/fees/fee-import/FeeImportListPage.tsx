'use client'

import AddIcon from '@mui/icons-material/Add'
import UploadFileIcon from '@mui/icons-material/UploadFile'
import RefreshIcon from '@mui/icons-material/Refresh'
import SearchIcon from '@mui/icons-material/Search'
import { Alert, Button, Chip, CircularProgress, InputAdornment, MenuItem, Paper, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField } from '@mui/material'
import type { SelectChangeEvent } from '@mui/material/Select'
import { useRouter } from '@shared/hooks/useRouter'
import { useCallback, useEffect, useRef, useState } from 'react'

import PaginationPage from '@/@core/components/jTable/pagination'
import { useWorkingProject } from '@/@core/stores/useWorkingProjectStore'
import ContentWrapper from '@/features/dynamicform/components/layout/content-wrapper'
import { usePermission } from '@/shared/permissions/usePermission'
import WorkflowErrorAlert from '@/shared/components/WorkflowErrorAlert'
import { normalizeWorkflowErrorDetail, type WorkflowErrorDetail } from '@/shared/utils/workflowError'

import { feeText } from '../components/feeTypeHelpers'
import { feeImportWorkflowService } from './feeImportWorkflow.service'
import type { FeeImportFilter, FeeImportItem, FeeImportSearchResponse } from './feeImportWorkflow.types'

type Props = { dictionary: any; locale: string; sessiontoken?: string; initialData?: FeeImportSearchResponse }
const empty = (project_id: number | null): FeeImportFilter => ({ project_id, search_text: '', status: '', page_index: 0, page_size: 10 })
const display = (value: unknown) => value === null || value === undefined || value === '' ? '-' : String(value)
const date = (value: string | null, locale: string) => value ? new Intl.DateTimeFormat(locale === 'vi' ? 'vi-VN' : 'en-US', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value)) : '-'

export default function FeeImportListPage({ dictionary, locale, sessiontoken, initialData }: Props) {
  const router = useRouter(); const project = useWorkingProject(); const t = (key: string, fallback: string) => feeText(dictionary, key, fallback)
  const createPermission = usePermission({ href: '/fee-import' }); const [filter, setFilter] = useState(() => empty(project?.id ?? null)); const [draft, setDraft] = useState(() => empty(project?.id ?? null)); const [data, setData] = useState(initialData ?? { items: [], total_count: 0, total_pages: 0, page_index: 0, page_size: 20, has_previous_page: false, has_next_page: false }); const [loading, setLoading] = useState(false); const [error, setError] = useState<WorkflowErrorDetail | null>(null); const request = useRef(0); const contextKey = useRef<string | null>(null); const lastRequest = useRef<FeeImportFilter>(empty(project?.id ?? null))
  const load = useCallback(async (next: FeeImportFilter) => { if (!next.project_id || next.project_id !== project?.id || !project.code) return; lastRequest.current = next; const id = ++request.current; setLoading(true); setError(null); try { const response = await feeImportWorkflowService.search({ sessiontoken, language: locale, scope: project.code, filter: next }); if (id !== request.current) return; setData(response); setFilter(next); setDraft(next) } catch (cause) { if (id === request.current) setError(normalizeWorkflowErrorDetail(cause, { fallback: t('fee_import_load_failed', 'Unable to load fee imports.') })) } finally { if (id === request.current) setLoading(false) } }, [locale, project?.code, project?.id, sessiontoken])
  useEffect(() => { if (!project?.id || !project.code) { if (contextKey.current !== null) { contextKey.current = null; request.current += 1; const next = empty(null); setData({ items: [], total_count: 0, total_pages: 0, page_index: 0, page_size: next.page_size, has_previous_page: false, has_next_page: false }); setFilter(next); setDraft(next) }; return }; const nextContextKey = `${project.id}:${project.code}`; if (contextKey.current === nextContextKey) return; contextKey.current = nextContextKey; const next = empty(project.id); setData({ items: [], total_count: 0, total_pages: 0, page_index: 0, page_size: next.page_size, has_previous_page: false, has_next_page: false }); setFilter(next); setDraft(next); void load(next) }, [load, project?.code, project?.id])
  const search = () => void load({ ...draft, project_id: project?.id ?? null, page_index: 0 })
  const onStatus = (status: string) => { const next = { ...filter, status, project_id: project?.id ?? null, page_index: 0 }; setDraft(next); void load(next) }
  const open = (row: FeeImportItem) => row.id && router.push(`/${locale}/fee-import/${row.id}`)
  const openGenerateFee = () => {
    if (!project?.id) return
    const returnHref = `/${locale}/fee-import?project_id=${project.id}`
    window.sessionStorage.setItem('ips:fee-import:return-href', returnHref)
    router.push(`/${locale}/fees/generate-fee?project_id=${project.id}`)
  }
  const handlePageChange = (_: React.ChangeEvent<unknown>, page: number) => void load({ ...filter, page_index: page - 1 })
  const handlePageSizeChange = (event: SelectChangeEvent<number>) => void load({ ...filter, page_size: Number(event.target.value), page_index: 0 })
  const handleJumpPage = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const page = Math.min(Math.max(Number(event.target.value) || 1, 1), Math.max(data.total_pages, 1))
    void load({ ...filter, page_index: page - 1 })
  }
  const columnKeys = ['no', 'code', 'file_name', 'notes', 'total_rows', 'imported', 'skipped', 'updated', 'errors', 'import_date', 'status'] as const
  return <ContentWrapper title={t('fee_import_title', 'Fee Import Management')} description={t('fee_import_description', 'Manage fee import batches and import data from Excel.')} icon={<UploadFileIcon sx={{ fontSize: 40, color: 'primary.main' }} />} dictionary={dictionary} issearch><Stack spacing={2} sx={{ mt: 2 }}>
    <Stack direction='row' justifyContent='flex-end'>{createPermission.resolved && createPermission.canAdd && <Button size='small' variant='contained' startIcon={<AddIcon />} disabled={!project?.id} onClick={openGenerateFee}>{t('fee_import_create', 'Import data')}</Button>}</Stack>
      <Paper sx={{ p: { xs: 1.5, md: 2 } }}><Stack direction={{ xs: 'column', lg: 'row' }} spacing={1.5} alignItems={{ lg: 'center' }} justifyContent='space-between'><Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ flex: 1 }}><TextField size='small' value={draft.search_text} label={t('search_label', 'Search')} placeholder={t('fee_import_search_placeholder', 'Search by import code, file name or notes')} onChange={event => setDraft({ ...draft, search_text: event.target.value })} onKeyDown={event => event.key === 'Enter' && search()} sx={{ width: { xs: '100%', sm: 360 } }} slotProps={{ input: { startAdornment: <InputAdornment position='start'><SearchIcon fontSize='small' /></InputAdornment> } }} /><TextField size='small' select value={draft.status} label={t('fee_import_status_filter', 'Status')} onChange={event => onStatus(event.target.value)} sx={{ width: { xs: '100%', sm: 220 } }}><MenuItem value=''>{t('all', 'All')}</MenuItem><MenuItem value='A'>{t('active', 'Active')}</MenuItem><MenuItem value='I'>{t('inactive', 'Inactive')}</MenuItem><MenuItem value='ACCEPTED'>{t('fee_import_accepted', 'Accepted')}</MenuItem></TextField></Stack><Stack direction='row' spacing={1} sx={{ alignSelf: { xs: 'flex-end', lg: 'center' }, flexShrink: 0 }}><Button size='small' variant='outlined' startIcon={<RefreshIcon />} onClick={() => { const next = empty(project?.id ?? null); setDraft(next); void load(next) }}>{t('reset', 'Reset')}</Button><Button size='small' variant='contained' startIcon={<SearchIcon />} onClick={search}>{t('search', 'Search')}</Button></Stack></Stack></Paper>
      {error && <WorkflowErrorAlert title={t('fee_import_load_failed', 'Unable to load fee imports.')} message={error.message} executionId={error.executionId} executionIdLabel={locale === 'vi' ? 'Mã tra cứu lỗi' : 'Error Reference'} retryLabel={t('retry', 'Retry')} onRetry={() => void load(lastRequest.current)} />}
      {!project && <Alert severity='info'>{t('fee_import_select_project', 'Select a project from the global header to continue.')}</Alert>}
      <Paper sx={{ borderRadius: 2, overflow: 'hidden', border: 1, borderColor: 'divider' }}><TableContainer><Table size='small' sx={{ minWidth: 1320 }}><TableHead><TableRow>{columnKeys.map(key => <TableCell key={key} sx={{ bgcolor: 'primary.main', color: 'common.white', fontWeight: 800, whiteSpace: 'nowrap' }}>{t(`fee_import_column_${key}`, key)}</TableCell>)}</TableRow></TableHead><TableBody>{loading && <TableRow><TableCell colSpan={columnKeys.length} align='center' sx={{ py: 6 }}><CircularProgress size={24} /></TableCell></TableRow>}{!loading && data.items.map((row, index) => <TableRow hover key={row.id ?? index} onClick={() => open(row)} sx={{ cursor: row.id ? 'pointer' : 'default' }}><TableCell>{filter.page_index * filter.page_size + index + 1}</TableCell><TableCell sx={{ fontWeight: 700 }}>{display(row.import_code)}</TableCell><TableCell>{display(row.file_name)}</TableCell><TableCell>{display(row.notes)}</TableCell><TableCell>{display(row.total_rows)}</TableCell><TableCell>{display(row.imported_count)}</TableCell><TableCell>{display(row.skipped_count)}</TableCell><TableCell>{display(row.updated_count)}</TableCell><TableCell>{display(row.error_count)}</TableCell><TableCell>{date(row.import_date, locale)}</TableCell><TableCell><Chip size='small' label={display(row.status)} /></TableCell></TableRow>)}{!loading && data.items.length === 0 && <TableRow><TableCell colSpan={columnKeys.length} align='center' sx={{ py: 6 }}>{t('fee_import_empty', 'No import batches found.')}</TableCell></TableRow>}</TableBody></Table></TableContainer></Paper>
      {data.total_count > 0 && <PaginationPage page={filter.page_index + 1} pageSize={filter.page_size} totalResults={data.total_count} jumpPage={filter.page_index + 1} handlePageChange={handlePageChange} handlePageSizeChange={handlePageSizeChange} handleJumpPage={handleJumpPage} dictionary={dictionary} pageSizeOptions={[10, 20, 50]} />}
  </Stack></ContentWrapper>
}
