/* eslint-disable react-hooks/exhaustive-deps */
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
import { apartmentLookupService, type ApartmentLookupOption } from '@/shared/services/apartmentLookupService'

const labelSx = {
  color: 'primary.main',
  '&.Mui-focused': { color: 'primary.main' },
  '& .MuiFormLabel-asterisk, & .MuiInputLabel-asterisk': {
    color: '#dc2626'
  }
} as const

const EMPTY_APARTMENT_OPTIONS: ApartmentLookupOption[] = []

const mergeOptions = (current: ApartmentLookupOption[], incoming: ApartmentLookupOption[]) => {
  const byId = new Map<number, ApartmentLookupOption>(current.map(item => [item.id, item]))

  incoming.forEach(item => byId.set(item.id, item))

  return Array.from(byId.values())
}

export type ApartmentLookupMessages = {
  searchTitle: string
  apartmentCodeLabel: string
  apartmentTypeLabel: string
  searchButtonLabel: string
  selectLabel: string
  emptyText: string
}

type Props = {
  sessiontoken?: string
  language: Locale | string
  projectId?: number | null
  label: string
  required?: boolean
  disabled?: boolean
  value?: number | null
  displayValue?: string
  error?: boolean
  helperText?: string
  placeholder?: string
  options?: ApartmentLookupOption[]
  onChange: (option: ApartmentLookupOption | null) => void
  messages: ApartmentLookupMessages
}

const ApartmentLookup = ({
  sessiontoken,
  language,
  projectId,
  label,
  required = false,
  disabled = false,
  value = null,
  displayValue = '',
  error = false,
  helperText,
  placeholder,
  options = EMPTY_APARTMENT_OPTIONS,
  onChange,
  messages
}: Props) => {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [filter, setFilter] = useState({ apartment_code: '', apartment_type: '' })
  const [items, setItems] = useState<ApartmentLookupOption[]>(options)
  const [cachedOptions, setCachedOptions] = useState<ApartmentLookupOption[]>(options)
  const [pageIndex, setPageIndex] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  const [totalCount, setTotalCount] = useState(options.length)

  const PAGE_SIZE_OPTIONS = [5, 10, 20, 50] as const
  const DEFAULT_PAGE_SIZE = 10

  const normalizePageSize = (
    value: unknown,
    fallback = DEFAULT_PAGE_SIZE
  ): number => {
    const parsedValue = Number(value)

    return PAGE_SIZE_OPTIONS.includes(parsedValue as 5 | 10 | 20 | 50)
      ? parsedValue
      : fallback
  }

  useEffect(() => {
    setCachedOptions(current => mergeOptions(current, options))
    setItems(current => (current.length === 0 ? options : mergeOptions(current, options)))
  }, [options])

  useEffect(() => {
    setFilter({ apartment_code: '', apartment_type: '' })
    setItems([])
    setCachedOptions([])
    setPageIndex(0)
    setTotalCount(0)
    setLoadError(null)

    if (typeof projectId === 'number' && projectId > 0) {
      void loadApartments(0, pageSize, { apartment_code: '', apartment_type: '' }, projectId)
    }
  }, [projectId])

  const selectedOption = useMemo(() => {
    if (typeof value !== 'number' || value <= 0) return null

    return cachedOptions.find(option => option.id === value) ?? null
  }, [cachedOptions, value])

  const resolvedDisplayValue = selectedOption?.displayLabel || displayValue || ''
  const isSelectionDisabled = disabled || !Number.isInteger(projectId) || Number(projectId) <= 0

  const loadApartments = useCallback(async (
    nextPageIndex = 0,
    nextPageSize = DEFAULT_PAGE_SIZE,
    nextFilter = filter,
    nextProjectId = projectId
  ) => {
    if (!Number.isInteger(nextProjectId) || Number(nextProjectId) <= 0) {
      setItems([])
      setTotalCount(0)

      return
    }

    const requestedPageSize = normalizePageSize(
      nextPageSize,
      DEFAULT_PAGE_SIZE
    )

    setLoading(true)
    setLoadError(null)

    try {
      const response = await apartmentLookupService.searchApartments({
        sessiontoken,
        language,
        projectId: Number(nextProjectId),
        filter: {
          apartment_code: nextFilter.apartment_code,
          apartment_type: nextFilter.apartment_type,
          page_index: nextPageIndex,
          page_size: requestedPageSize
        }
      })

      setItems(response.items)
      setCachedOptions(current => mergeOptions(current, response.items))
      setPageIndex(nextPageIndex)
      setPageSize(requestedPageSize)
      setTotalCount(response.total_count)
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : null)
      setItems([])
      setTotalCount(0)
    } finally {
      setLoading(false)
    }
  }, [filter, language, projectId, sessiontoken])

  const handleOpen = useCallback(() => {
    if (isSelectionDisabled) return

    setOpen(true)
    void loadApartments(0, pageSize, filter)
  }, [filter, isSelectionDisabled, loadApartments, pageSize])

  const handleSelect = useCallback((option: ApartmentLookupOption) => {
    setCachedOptions(current => mergeOptions(current, [option]))
    onChange(option)
    setOpen(false)
  }, [onChange])

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
            <Grid size={{ xs: 12, md: 5 }}>
              <TextField
                fullWidth
                size="small"
                label={messages.apartmentCodeLabel}
                value={filter.apartment_code}
                onChange={event => setFilter(current => ({ ...current, apartment_code: event.target.value }))}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 5 }}>
              <TextField
                fullWidth
                size="small"
                label={messages.apartmentTypeLabel}
                value={filter.apartment_type}
                onChange={event => setFilter(current => ({ ...current, apartment_type: event.target.value }))}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 2 }}>
              <Button fullWidth variant="contained" startIcon={<SearchIcon />} onClick={() => void loadApartments(0, pageSize, filter)}>
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
                  <TableCell>{messages.apartmentCodeLabel}</TableCell>
                  <TableCell>{messages.apartmentTypeLabel}</TableCell>
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
                    <TableCell>{item.apartmentTypeLabel || item.apartmentType || '-'}</TableCell>
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
              page={pageIndex}
              rowsPerPage={pageSize}
              onPageChange={(_, page) =>
                void loadApartments(page, pageSize, filter)
              }
              onRowsPerPageChange={event =>
                void loadApartments(0, Number(event.target.value), filter)
              }
              rowsPerPageOptions={[5, 10, 20, 50]}
            />
          </Box>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default ApartmentLookup
