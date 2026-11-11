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
import { facilityLookupService, type FacilityLookupOption } from '@/shared/services/facilityLookupService'

const labelSx = {
  color: 'primary.main',
  '&.Mui-focused': { color: 'primary.main' },
  '& .MuiFormLabel-asterisk, & .MuiInputLabel-asterisk': {
    color: '#dc2626'
  }
} as const

const EMPTY_FACILITY_OPTIONS: FacilityLookupOption[] = []

const mergeOptions = (current: FacilityLookupOption[], incoming: FacilityLookupOption[]) => {
  const byId = new Map<number, FacilityLookupOption>(current.map(item => [item.id, item]))

  incoming.forEach(item => byId.set(item.id, item))

  return Array.from(byId.values())
}

export type FacilityLookupMessages = {
  searchTitle: string
  searchLabel: string
  descriptionLabel: string
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
  options?: FacilityLookupOption[]
  activeOnly?: boolean
  onChange: (option: FacilityLookupOption | null) => void
  messages: FacilityLookupMessages
}

const FacilityLookup = ({
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
  options = EMPTY_FACILITY_OPTIONS,
  activeOnly = true,
  onChange,
  messages
}: Props) => {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [searchText, setSearchText] = useState('')
  const [items, setItems] = useState<FacilityLookupOption[]>(options)
  const [cachedOptions, setCachedOptions] = useState<FacilityLookupOption[]>(options)
  const [pageIndex, setPageIndex] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  const [totalCount, setTotalCount] = useState(options.length)

  useEffect(() => {
    setCachedOptions(current => mergeOptions(current, options))
    setItems(current => (current.length === 0 ? options : mergeOptions(current, options)))
  }, [options])

  const loadFacilities = useCallback(async (
    nextPageIndex = 0,
    nextPageSize = pageSize,
    nextSearchText = searchText,
    nextProjectId = projectId
  ) => {
    if (!Number.isInteger(nextProjectId) || Number(nextProjectId) <= 0) {
      setItems([])
      setTotalCount(0)

      return
    }

    setLoading(true)
    setLoadError(null)

    try {
      const response = await facilityLookupService.searchFacilities({
        sessiontoken,
        language,
        projectId: Number(nextProjectId),
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
  }, [activeOnly, language, pageSize, projectId, searchText, sessiontoken])

  useEffect(() => {
    setSearchText('')
    setItems([])
    setCachedOptions([])
    setPageIndex(1)
    setTotalCount(0)
    setLoadError(null)

    if (typeof projectId === 'number' && projectId > 0) {
      void loadFacilities(1, pageSize, '', projectId)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId])

  const selectedOption = useMemo(() => {
    if (typeof value !== 'number' || value <= 0) return null

    return cachedOptions.find(option => option.id === value) ?? null
  }, [cachedOptions, value])

  const resolvedDisplayValue = selectedOption?.displayLabel || displayValue || ''
  const isSelectionDisabled = disabled || !Number.isInteger(projectId) || Number(projectId) <= 0

  const handleOpen = useCallback(() => {
    if (isSelectionDisabled) return

    setOpen(true)
    void loadFacilities(1, pageSize, searchText)
  }, [isSelectionDisabled, loadFacilities, pageSize, searchText])

  const handleSelect = useCallback((option: FacilityLookupOption) => {
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
              <Button fullWidth variant="contained" startIcon={<SearchIcon />} onClick={() => void loadFacilities(1, pageSize, searchText)}>
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
                  <TableCell>{messages.descriptionLabel}</TableCell>
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
                    <TableCell>{item.description || '-'}</TableCell>
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
              onPageChange={(_, page) => void loadFacilities(page + 1, pageSize, searchText)}
              onRowsPerPageChange={event => void loadFacilities(1, Number(event.target.value), searchText)}
              rowsPerPageOptions={[5, 10, 20, 50]}
            />
          </Box>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default FacilityLookup
