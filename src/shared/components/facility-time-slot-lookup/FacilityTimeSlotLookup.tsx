'use client'

import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import SearchIcon from '@mui/icons-material/Search'
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  InputAdornment,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Tooltip,
  Typography
} from '@mui/material'
import { useCallback, useEffect, useMemo, useState } from 'react'

import type { Locale } from '@/configs/i18n'
import { facilityTimeSlotLookupService, type FacilityTimeSlotLookupOption } from '@/shared/services/facilityTimeSlotLookupService'

const labelSx = {
  color: 'primary.main',
  '&.Mui-focused': { color: 'primary.main' },
  '& .MuiFormLabel-asterisk, & .MuiInputLabel-asterisk': {
    color: '#dc2626'
  }
} as const

const EMPTY_TIME_SLOT_OPTIONS: FacilityTimeSlotLookupOption[] = []

const mergeOptions = (current: FacilityTimeSlotLookupOption[], incoming: FacilityTimeSlotLookupOption[]) => {
  const byId = new Map<number, FacilityTimeSlotLookupOption>(current.map(item => [item.id, item]))

  incoming.forEach(item => byId.set(item.id, item))

  return Array.from(byId.values())
}

export type FacilityTimeSlotLookupMessages = {
  searchTitle: string
  searchLabel: string
  detailsLabel: string
  capacityLabel: string
  priceLabel: string
  searchButtonLabel: string
  selectLabel: string
  emptyText: string
}

type Props = {
  sessiontoken?: string
  language: Locale | string
  facilityId?: number | null
  label: string
  required?: boolean
  disabled?: boolean
  value?: number | null
  displayValue?: string
  error?: boolean
  helperText?: string
  placeholder?: string
  options?: FacilityTimeSlotLookupOption[]
  activeOnly?: boolean
  onChange: (option: FacilityTimeSlotLookupOption | null) => void
  messages: FacilityTimeSlotLookupMessages
}

const FacilityTimeSlotLookup = ({
  sessiontoken,
  language,
  facilityId,
  label,
  required = false,
  disabled = false,
  value = null,
  displayValue = '',
  error = false,
  helperText,
  placeholder,
  options = EMPTY_TIME_SLOT_OPTIONS,
  activeOnly = true,
  onChange,
  messages
}: Props) => {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [searchText, setSearchText] = useState('')
  const [items, setItems] = useState<FacilityTimeSlotLookupOption[]>(options)
  const [cachedOptions, setCachedOptions] = useState<FacilityTimeSlotLookupOption[]>(options)
  const [pageIndex, setPageIndex] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  const [totalCount, setTotalCount] = useState(options.length)

  useEffect(() => {
    setCachedOptions(current => mergeOptions(current, options))
    setItems(current => (current.length === 0 ? options : mergeOptions(current, options)))
  }, [options])

  const loadTimeSlots = useCallback(async (
    nextPageIndex = 0,
    nextPageSize = pageSize,
    nextSearchText = searchText,
    nextFacilityId = facilityId
  ) => {
    if (!Number.isInteger(nextFacilityId) || Number(nextFacilityId) <= 0) {
      setItems([])
      setTotalCount(0)

      return
    }

    setLoading(true)
    setLoadError(null)

    try {
      const response = await facilityTimeSlotLookupService.searchFacilityTimeSlots({
        sessiontoken,
        language,
        facilityId: Number(nextFacilityId),
        activeOnly,
        filter: {
          search_text: nextSearchText,
          page_index: nextPageIndex,
          page_size: nextPageSize
        }
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
  }, [activeOnly, facilityId, language, pageSize, searchText, sessiontoken])

  useEffect(() => {
    setSearchText('')
    setItems([])
    setCachedOptions([])
    setPageIndex(1)
    setTotalCount(0)
    setLoadError(null)

    if (typeof facilityId === 'number' && facilityId > 0) {
      void loadTimeSlots(1, pageSize, '', facilityId)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facilityId])

  const selectedOption = useMemo(() => {
    if (typeof value !== 'number' || value <= 0) return null

    return cachedOptions.find(option => option.id === value) ?? null
  }, [cachedOptions, value])

  const resolvedDisplayValue = selectedOption?.displayLabel || displayValue || ''
  const isSelectionDisabled = disabled || !Number.isInteger(facilityId) || Number(facilityId) <= 0

  const handleOpen = useCallback(() => {
    if (isSelectionDisabled) return

    setOpen(true)
    void loadTimeSlots(1, pageSize, searchText)
  }, [isSelectionDisabled, loadTimeSlots, pageSize, searchText])

  const handleSelect = useCallback((option: FacilityTimeSlotLookupOption) => {
    setCachedOptions(current => mergeOptions(current, [option]))
    onChange(option)
    setOpen(false)
  }, [onChange])

  const formatNumber = useCallback((value: number) => (
    new Intl.NumberFormat(language === 'vi' ? 'vi-VN' : 'en-US').format(value)
  ), [language])

  const getSecondaryLabel = useCallback((option: FacilityTimeSlotLookupOption) => {
    const parts = [
      option.maxCapacity !== null && option.maxCapacity !== undefined ? `${messages.capacityLabel}: ${option.maxCapacity}` : '',
      option.basePrice !== null && option.basePrice !== undefined ? `${messages.priceLabel}: ${formatNumber(option.basePrice)}` : ''
    ].filter(Boolean)

    return parts.join(' | ')
  }, [formatNumber, messages.capacityLabel, messages.priceLabel])

  return (
    <>
      <TextField
        fullWidth
        size="small"
        label={label}
        value={resolvedDisplayValue}
        placeholder={placeholder}
        error={error}
        helperText={helperText}
        disabled={isSelectionDisabled}
        onClick={handleOpen}
        slotProps={{
          inputLabel: {
            sx: labelSx,
            required
          },
          input: {
            readOnly: true,
            endAdornment: (
              <InputAdornment position="end">
                <IconButton edge="end" onClick={handleOpen} disabled={isSelectionDisabled}>
                  <SearchIcon />
                </IconButton>
              </InputAdornment>
            )
          }
        }}
      />

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="md">
        <DialogTitle sx={{ fontWeight: 800 }}>{messages.searchTitle}</DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mb: 3, pt: 1 }}>
            <Grid size={{ xs: 12, md: 10 }}>
              <TextField
                fullWidth
                size="small"
                label={messages.searchLabel}
                value={searchText}
                onChange={event => setSearchText(event.target.value)}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 2 }}>
              <Button fullWidth variant="contained" startIcon={<SearchIcon />} onClick={() => void loadTimeSlots(1, pageSize, searchText)}>
                {messages.searchButtonLabel}
              </Button>
            </Grid>
          </Grid>

          {loading && <LinearProgress sx={{ mb: 2 }} />}
          {loadError && <Alert severity="error" sx={{ mb: 2 }}>{loadError}</Alert>}

          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>{label}</TableCell>
                  <TableCell>{messages.detailsLabel}</TableCell>
                  <TableCell align="right" sx={{ width: 56 }} />
                </TableRow>
              </TableHead>
              <TableBody>
                {items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3}>
                      <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 3 }}>
                        {messages.emptyText}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : items.map(item => (
                  <TableRow
                    key={item.id}
                    hover
                    onClick={() => handleSelect(item)}
                    sx={{
                      cursor: 'pointer',
                      transition: 'background-color 120ms ease',
                      '&:hover': {
                        bgcolor: 'action.hover'
                      },
                      '&:hover .select-row-icon': {
                        bgcolor: 'primary.main',
                        color: 'primary.contrastText',
                        borderColor: 'primary.main'
                      }
                    }}
                  >
                    <TableCell>{item.displayLabel}</TableCell>
                    <TableCell>{getSecondaryLabel(item) || '-'}</TableCell>
                    <TableCell align="right">
                      <Tooltip title={messages.selectLabel}>
                        <Box
                          component="span"
                          className="select-row-icon"
                          sx={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: 30,
                            height: 30,
                            borderRadius: '50%',
                            border: '1px solid',
                            borderColor: 'divider',
                            color: 'text.secondary',
                            transition: 'all 120ms ease'
                          }}
                        >
                          <CheckCircleOutlineIcon fontSize="small" />
                        </Box>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <TablePagination
              component="div"
              count={totalCount}
              page={Math.max(pageIndex - 1, 0)}
              rowsPerPage={pageSize}
              onPageChange={(_, page) => void loadTimeSlots(page + 1, pageSize, searchText)}
              onRowsPerPageChange={event => void loadTimeSlots(1, Number(event.target.value), searchText)}
              rowsPerPageOptions={[5, 10, 20, 50]}
            />
          </Box>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default FacilityTimeSlotLookup
