/* eslint-disable react-hooks/exhaustive-deps */
'use client'

import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import CloseIcon from '@mui/icons-material/Close'
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
import { projectLookupService, type ProjectLookupOption } from '@/shared/services/projectLookupService'

const labelSx = {
  color: 'primary.main',
  '&.Mui-focused': { color: 'primary.main' },
  '& .MuiFormLabel-asterisk, & .MuiInputLabel-asterisk': {
    color: '#dc2626'
  }
} as const

const EMPTY_PROJECT_OPTIONS: ProjectLookupOption[] = []
const PAGE_SIZE_OPTIONS = [5, 10, 20, 50] as const
const DEFAULT_PAGE_SIZE = 10

const mergeOptions = (current: ProjectLookupOption[], incoming: ProjectLookupOption[]) => {
  const byId = new Map<number, ProjectLookupOption>(current.map(item => [item.id, item]))

  incoming.forEach(item => byId.set(item.id, item))

  return Array.from(byId.values())
}

const normalizePageSize = (value: unknown, fallback = DEFAULT_PAGE_SIZE) => {
  const parsedValue = Number(value)

  return PAGE_SIZE_OPTIONS.includes(parsedValue as 5 | 10 | 20 | 50)
    ? parsedValue
    : fallback
}

export type ProjectLookupMessages = {
  searchTitle: string
  searchLabel: string
  searchButtonLabel: string
  selectLabel: string
  emptyText: string
}

type Props = {
  sessiontoken?: string
  language: Locale | string
  label: string
  shrinkLabel?: boolean
  required?: boolean
  disabled?: boolean
  value?: number | null
  displayValue?: string
  error?: boolean
  helperText?: string
  placeholder?: string
  options?: ProjectLookupOption[]
  filterOption?: (option: ProjectLookupOption) => boolean
  clearable?: boolean
  clearLabel?: string
  onChange: (option: ProjectLookupOption | null) => void
  messages: ProjectLookupMessages
}

const ProjectLookup = ({
  sessiontoken,
  language,
  label,
  shrinkLabel,
  required = false,
  disabled = false,
  value = null,
  displayValue = '',
  error = false,
  helperText,
  placeholder,
  options = EMPTY_PROJECT_OPTIONS,
  filterOption,
  clearable = false,
  clearLabel = 'Clear selection',
  onChange,
  messages
}: Props) => {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [searchText, setSearchText] = useState('')
  const [items, setItems] = useState<ProjectLookupOption[]>(options)
  const [cachedOptions, setCachedOptions] = useState<ProjectLookupOption[]>(options)
  const [pageIndex, setPageIndex] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  const [totalCount, setTotalCount] = useState(options.length)

  useEffect(() => {
    setCachedOptions(current => mergeOptions(current, options))
    setItems(current => (current.length === 0 ? options : mergeOptions(current, options)))
  }, [options])

  const selectedOption = useMemo(() => {
    if (typeof value !== 'number' || value <= 0) return null

    return cachedOptions.find(option => option.id === value) ?? null
  }, [cachedOptions, value])

  const resolvedDisplayValue = selectedOption?.displayLabel || displayValue || ''
  const visibleItems = filterOption ? items.filter(filterOption) : items

  const loadProjects = useCallback(async (
    nextPageIndex = 0,
    nextPageSize = DEFAULT_PAGE_SIZE,
    nextSearchText = searchText
  ) => {
    const requestedPageSize = normalizePageSize(nextPageSize)

    setLoading(true)
    setLoadError(null)

    try {
      const response = await projectLookupService.searchProjects({
        sessiontoken,
        language,
        filter: {
          search_text: nextSearchText,
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
  }, [language, pageSize, searchText, sessiontoken])

  const handleOpen = useCallback(() => {
    if (disabled) return

    setOpen(true)
    void loadProjects(0, pageSize, searchText)
  }, [disabled, loadProjects, pageSize, searchText])

  const handleSelect = useCallback((option: ProjectLookupOption) => {
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
        disabled={disabled}
        onClick={handleOpen}
        slotProps={{
          inputLabel: {
            shrink: shrinkLabel,
            sx: labelSx,
            required
          },
          input: {
            readOnly: true,
            endAdornment: (
              <InputAdornment position="end">
                {clearable && resolvedDisplayValue && (
                  <IconButton
                    edge="end"
                    aria-label={clearLabel}
                    onClick={event => {
                      event.stopPropagation()
                      onChange(null)
                    }}
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                )}
                <IconButton edge="end" onClick={handleOpen} disabled={disabled}>
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
              <Button fullWidth variant="contained" startIcon={<SearchIcon />} onClick={() => void loadProjects(0, pageSize, searchText)}>
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
                  <TableCell align="right" sx={{ width: 56 }} />
                </TableRow>
              </TableHead>
              <TableBody>
                {visibleItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={2}>
                      <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 3 }}>
                        {messages.emptyText}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : visibleItems.map(item => (
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
              onPageChange={(_, page) => void loadProjects(page, pageSize, searchText)}
              onRowsPerPageChange={event => void loadProjects(0, Number(event.target.value), searchText)}
              rowsPerPageOptions={[5, 10, 20, 50]}
            />
          </Box>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default ProjectLookup
