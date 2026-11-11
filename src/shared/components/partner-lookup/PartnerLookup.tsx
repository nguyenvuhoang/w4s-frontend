'use client'

import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import SearchIcon from '@mui/icons-material/Search'
import { Alert, Box, Button, Dialog, DialogContent, DialogTitle, Grid, IconButton, InputAdornment, LinearProgress, Table, TableBody, TableCell, TableContainer, TableHead, TablePagination, TableRow, TextField, Tooltip, Typography } from '@mui/material'
import { useCallback, useEffect, useMemo, useState } from 'react'

import type { Locale } from '@/configs/i18n'
import { partnerService } from '@/features/partners/service'
import type { PartnerItem } from '@/features/partners/types'

const EMPTY_OPTIONS: PartnerItem[] = []
const PAGE_SIZE_OPTIONS = [5, 10, 20, 50] as const

const mergeOptions = (current: PartnerItem[], incoming: PartnerItem[]) => {
  const byId = new Map<string | number, PartnerItem>(current.filter(item => item.id !== null).map(item => [item.id as string | number, item]))
  incoming.forEach(item => { if (item.id !== null) byId.set(item.id, item) })
  return Array.from(byId.values())
}

const partnerLabel = (partner: PartnerItem) => partner.partner_name || partner.partner_code || '-'

export type PartnerLookupMessages = {
  searchTitle: string
  searchLabel: string
  partnerCodeLabel: string
  searchButtonLabel: string
  selectLabel: string
  emptyText: string
}

type Props = {
  sessiontoken?: string
  language: Locale | string
  label: string
  required?: boolean
  disabled?: boolean
  value?: number | string | null
  displayValue?: string
  error?: boolean
  helperText?: string
  placeholder?: string
  options?: PartnerItem[]
  onChange: (option: PartnerItem | null) => void
  messages: PartnerLookupMessages
}

const PartnerLookup = ({ sessiontoken, language, label, required = false, disabled = false, value = null, displayValue = '', error = false, helperText, placeholder, options = EMPTY_OPTIONS, onChange, messages }: Props) => {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [searchText, setSearchText] = useState('')
  const [items, setItems] = useState<PartnerItem[]>(options)
  const [cachedOptions, setCachedOptions] = useState<PartnerItem[]>(options)
  const [pageIndex, setPageIndex] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [totalCount, setTotalCount] = useState(options.length)

  useEffect(() => {
    setCachedOptions(current => mergeOptions(current, options))
    setItems(current => current.length === 0 ? options : mergeOptions(current, options))
  }, [options])

  const selectedOption = useMemo(() => value === null ? null : cachedOptions.find(option => String(option.id) === String(value)) ?? null, [cachedOptions, value])
  const resolvedDisplayValue = selectedOption ? partnerLabel(selectedOption) : displayValue

  const loadPartners = useCallback(async (nextPageIndex = 1, nextPageSize = pageSize, nextSearchText = searchText) => {
    setLoading(true)
    setLoadError(null)
    try {
      const response = await partnerService.simpleSearchPartners({
        sessiontoken,
        language: language as Locale,
        filter: { search_text: nextSearchText, page_index: nextPageIndex, page_size: nextPageSize }
      })
      setItems(response.items)
      setCachedOptions(current => mergeOptions(current, response.items))
      setPageIndex(response.page_index)
      setPageSize(response.page_size)
      setTotalCount(response.total_count)
    } catch (lookupError) {
      setLoadError(lookupError instanceof Error ? lookupError.message : null)
      setItems([])
      setTotalCount(0)
    } finally {
      setLoading(false)
    }
  }, [language, pageSize, searchText, sessiontoken])

  const handleOpen = () => {
    if (disabled) return
    setOpen(true)
    void loadPartners(1, pageSize, searchText)
  }

  const handleSelect = (option: PartnerItem) => {
    setCachedOptions(current => mergeOptions(current, [option]))
    onChange(option)
    setOpen(false)
  }

  return <>
    <TextField fullWidth label={label} value={resolvedDisplayValue} placeholder={placeholder} error={error} helperText={helperText} disabled={disabled} onClick={handleOpen} slotProps={{ inputLabel: { required }, input: { readOnly: true, endAdornment: <InputAdornment position="end"><IconButton edge="end" onClick={handleOpen} disabled={disabled}><SearchIcon /></IconButton></InputAdornment> } }} />
    <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="md">
      <DialogTitle sx={{ fontWeight: 800 }}>{messages.searchTitle}</DialogTitle>
      <DialogContent>
        <Grid container spacing={3} sx={{ mb: 3, pt: 1 }}><Grid size={{ xs: 12, md: 10 }}><TextField fullWidth label={messages.searchLabel} value={searchText} onChange={event => setSearchText(event.target.value)} onKeyDown={event => { if (event.key === 'Enter') void loadPartners(1, pageSize, searchText) }} /></Grid><Grid size={{ xs: 12, md: 2 }}><Button fullWidth variant="contained" startIcon={<SearchIcon />} onClick={() => void loadPartners(1, pageSize, searchText)}>{messages.searchButtonLabel}</Button></Grid></Grid>
        {loading && <LinearProgress sx={{ mb: 2 }} />}
        {loadError && <Alert severity="error" sx={{ mb: 2 }}>{loadError}</Alert>}
        <TableContainer><Table size="small"><TableHead><TableRow><TableCell>{label}</TableCell><TableCell>{messages.partnerCodeLabel}</TableCell><TableCell align="right" sx={{ width: 56 }} /></TableRow></TableHead><TableBody>{items.length === 0 ? <TableRow><TableCell colSpan={3}><Typography variant="body2" color="text.secondary" align="center" sx={{ py: 3 }}>{messages.emptyText}</Typography></TableCell></TableRow> : items.map(item => <TableRow key={item.id} hover onClick={() => handleSelect(item)} sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' }, '&:hover .select-row-icon': { bgcolor: 'primary.main', color: 'primary.contrastText', borderColor: 'primary.main' } }}><TableCell>{partnerLabel(item)}</TableCell><TableCell>{item.partner_code || '-'}</TableCell><TableCell align="right"><Tooltip title={messages.selectLabel}><Box component="span" className="select-row-icon" sx={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 30, height: 30, borderRadius: '50%', border: '1px solid', borderColor: 'divider', color: 'text.secondary' }}><CheckCircleOutlineIcon fontSize="small" /></Box></Tooltip></TableCell></TableRow>)}</TableBody></Table></TableContainer>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}><TablePagination component="div" count={totalCount} page={Math.max(pageIndex - 1, 0)} rowsPerPage={pageSize} onPageChange={(_, page) => void loadPartners(page + 1, pageSize, searchText)} onRowsPerPageChange={event => void loadPartners(1, Number(event.target.value), searchText)} rowsPerPageOptions={PAGE_SIZE_OPTIONS as unknown as number[]} /></Box>
      </DialogContent>
    </Dialog>
  </>
}

export default PartnerLookup
