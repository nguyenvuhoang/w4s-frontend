'use client'

import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import ClearIcon from '@mui/icons-material/Clear'
import SearchIcon from '@mui/icons-material/Search'
import { Alert, Box, Button, Dialog, DialogContent, DialogTitle, Grid, IconButton, InputAdornment, LinearProgress, Table, TableBody, TableCell, TableContainer, TableHead, TablePagination, TableRow, TextField, Tooltip, Typography } from '@mui/material'
import { useCallback, useMemo, useState } from 'react'

import type { Locale } from '@/configs/i18n'
import { countryLookupLabel, countryLookupService, type CountryLookupOption } from '@/shared/services/countryLookupService'

export type CountryLookupMessages = {
    searchTitle: string
    searchLabel: string
    countryCodeLabel: string
    searchButtonLabel: string
    selectLabel: string
    emptyText: string
    errorReferenceLabel: string
    clearLabel: string
}

type Props = {
    sessiontoken?: string
    language: Locale | string
    label: string
    value?: string
    displayValue?: string
    error?: boolean
    helperText?: string
    placeholder?: string
    onChange: (option: CountryLookupOption | null) => void
    messages: CountryLookupMessages
}

const mergeOptions = (current: CountryLookupOption[], incoming: CountryLookupOption[]) => {
    const options = new Map(current.map(option => [option.country_id, option]))
    incoming.forEach(option => options.set(option.country_id, option))
    return Array.from(options.values())
}

export default function CountryLookup({ sessiontoken, language, label, value = '', displayValue = '', error = false, helperText, placeholder, onChange, messages }: Props) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [loadError, setLoadError] = useState<string | null>(null)
    const [errorExecutionId, setErrorExecutionId] = useState<string | null>(null)
    const [searchText, setSearchText] = useState('')
    const [items, setItems] = useState<CountryLookupOption[]>([])
    const [cachedOptions, setCachedOptions] = useState<CountryLookupOption[]>([])
    const [pageIndex, setPageIndex] = useState(0)
    const [totalCount, setTotalCount] = useState(0)
    const pageSize = 20

    const selected = useMemo(() => cachedOptions.find(option => option.country_id === value) ?? null, [cachedOptions, value])

    const loadCountries = useCallback(async (nextPageIndex = 0, nextSearchText = searchText) => {
        setLoading(true)
        setLoadError(null)
        setErrorExecutionId(null)
        try {
            const response = await countryLookupService.searchCountries({ sessiontoken, language, searchText: nextSearchText, pageIndex: nextPageIndex, pageSize })
            setItems(response.items)
            setCachedOptions(current => mergeOptions(current, response.items))
            setPageIndex(response.page_index)
            setTotalCount(response.total_count)
        } catch (lookupError) {
            setLoadError(lookupError instanceof Error ? lookupError.message : 'Unable to load countries.')
            setErrorExecutionId(typeof (lookupError as { executionId?: unknown })?.executionId === 'string' ? (lookupError as { executionId: string }).executionId : null)
            setItems([])
            setTotalCount(0)
        } finally {
            setLoading(false)
        }
    }, [language, pageSize, searchText, sessiontoken])

    const openLookup = useCallback(() => {
        setOpen(true)
        void loadCountries(0, searchText)
    }, [loadCountries, searchText])

    return <>
        <TextField fullWidth size="small" label={label} value={selected ? countryLookupLabel(selected, language) : displayValue} placeholder={placeholder} error={error} helperText={helperText} onClick={openLookup} slotProps={{ input: { readOnly: true, endAdornment: <InputAdornment position="end">{selected || displayValue ? <Tooltip title={messages.clearLabel}><IconButton edge="end" onClick={event => { event.stopPropagation(); onChange(null) }}><ClearIcon /></IconButton></Tooltip> : null}<IconButton edge="end" onClick={event => { event.stopPropagation(); openLookup() }}><SearchIcon /></IconButton></InputAdornment> } }} />
        <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="md">
            <DialogTitle sx={{ fontWeight: 800 }}>{messages.searchTitle}</DialogTitle>
            <DialogContent>
                <Grid container spacing={3} sx={{ mb: 3, pt: 1 }}><Grid size={{ xs: 12, md: 10 }}><TextField fullWidth size="small" label={messages.searchLabel} value={searchText} onChange={event => setSearchText(event.target.value)} onKeyDown={event => { if (event.key === 'Enter') void loadCountries(0, searchText) }} /></Grid><Grid size={{ xs: 12, md: 2 }}><Button fullWidth variant="contained" startIcon={<SearchIcon />} onClick={() => void loadCountries(0, searchText)}>{messages.searchButtonLabel}</Button></Grid></Grid>
                {loading && <LinearProgress sx={{ mb: 2 }} />}
                {loadError && <Alert severity="error" sx={{ mb: 2 }}>{loadError}{errorExecutionId ? <Typography component="div" variant="caption" sx={{ mt: 0.5 }}>{messages.errorReferenceLabel}: {errorExecutionId}</Typography> : null}</Alert>}
                <TableContainer><Table size="small"><TableHead><TableRow><TableCell>{label}</TableCell><TableCell>{messages.countryCodeLabel}</TableCell><TableCell align="right" sx={{ width: 56 }} /></TableRow></TableHead><TableBody>{items.length === 0 ? <TableRow><TableCell colSpan={3}><Typography variant="body2" color="text.secondary" align="center" sx={{ py: 3 }}>{messages.emptyText}</Typography></TableCell></TableRow> : items.map(item => <TableRow key={item.country_id} hover onClick={() => { setCachedOptions(current => mergeOptions(current, [item])); onChange(item); setOpen(false) }} sx={{ cursor: 'pointer' }}><TableCell>{countryLookupLabel(item, language)}</TableCell><TableCell>{item.country_code || '-'}</TableCell><TableCell align="right"><Tooltip title={messages.selectLabel}><Box component="span" sx={{ display: 'inline-flex' }}><CheckCircleOutlineIcon fontSize="small" /></Box></Tooltip></TableCell></TableRow>)}</TableBody></Table></TableContainer>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}><TablePagination component="div" count={totalCount} page={pageIndex} rowsPerPage={pageSize} rowsPerPageOptions={[20]} onPageChange={(_, page) => void loadCountries(page, searchText)} /></Box>
            </DialogContent>
        </Dialog>
    </>
}
