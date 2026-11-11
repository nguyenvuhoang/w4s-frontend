'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import { Autocomplete, Box, Button, CircularProgress, Paper, TextField, Typography } from '@mui/material'
import type { SxProps, Theme } from '@mui/material'

import type { Locale } from '@/configs/i18n'
import { useDebouncedValue } from '@/features/announcement/hooks/useDebouncedValue'
import { formatProvinceLabel, provinceLookupService, type ProvinceLookupItem } from '@/shared/services/provinceLookupService'

const PAGE_SIZE = 20
const SEARCH_DEBOUNCE_MS = 400
const SCROLL_LOAD_MORE_THRESHOLD_PX = 48

export type ProvinceSelectMessages = {
  loadingText: string
  emptyText: string
  loadErrorText: string
  retryLabel: string
  loadingMoreText: string
}

type Props = {
  label: string
  /** Label of the "" value (e.g. "Tất cả Tỉnh/Thành phố" for a filter); also the placeholder. */
  emptyLabel?: string
  /** Selected value ("" = none / all). By default a province_code (see `getOptionValue`). */
  value: string
  onChange: (value: string) => void
  /** Business value of an option (default province_code), e.g. the Project contract representation. */
  getOptionValue?: (province: ProvinceLookupItem) => string
  /** Master row of `value` already resolved by the caller (e.g. server-side on Edit): shown without a lookup. */
  knownOption?: ProvinceLookupItem | null
  /** Offer the "" option at the top of the unfiltered list (filters). Forms set false. */
  showAllOption?: boolean
  required?: boolean
  error?: boolean
  helperText?: string
  sessiontoken?: string
  locale: Locale | string
  messages: ProvinceSelectMessages
  disabled?: boolean
  size?: 'small' | 'medium'
  sx?: SxProps<Theme>
}

// Synthetic option (id -1, never a master row): the "" option at the top of the unfiltered list, so "all"
// can be picked explicitly (clearing does the same), and the display of a raw value not resolved yet.
const allOption = (label: string): ProvinceLookupItem => ({
  id: -1, province_code: '', province_name: label, m_province_name: label, short_name: '', administrative_type: '', region: '', sort_order: null
})

/**
 * Province/City lookup on WF_BO_SIMPLE_SEARCH_PROVINCES (real master data, never a hard-coded list):
 * lazy-loaded when opened, debounced server-side search, infinite scroll over every page (the master has
 * more provinces than one page). Value = province_code; label = province_name (m_province_name on /en).
 * Same interaction pattern as ApartmentSearchSelect; reusable by the Project Create/Edit forms later.
 */
const defaultOptionValue = (province: ProvinceLookupItem) => province.province_code

const ProvinceSelect = ({
  label,
  emptyLabel = '',
  value,
  onChange,
  getOptionValue = defaultOptionValue,
  knownOption = null,
  showAllOption = true,
  required = false,
  error = false,
  helperText,
  sessiontoken,
  locale,
  messages,
  disabled = false,
  size = 'small',
  sx
}: Props) => {
  const [open, setOpen] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [searchText, setSearchText] = useState('')
  const [items, setItems] = useState<ProvinceLookupItem[]>([])
  const [pageIndex, setPageIndex] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [selected, setSelected] = useState<ProvinceLookupItem | null>(knownOption)

  // Guards against an older, slower request overwriting a newer one's results.
  const requestSeqRef = useRef(0)
  // Number of provinces loaded for the current search (decides whether another page exists).
  const loadedCountRef = useRef(0)
  // Stored value already looked up in the master (to show its option label), so it is resolved once.
  const resolvedValueRef = useRef<string | null>(null)
  const debouncedSearchText = useDebouncedValue(searchText, SEARCH_DEBOUNCE_MS)

  const runSearch = useCallback(async (nextPageIndex: number, text: string, append: boolean) => {
    const seq = ++requestSeqRef.current

    if (append) setLoadingMore(true)
    else {
      setLoading(true)
      setItems([])
    }
    setLoadError(null)

    try {
      const result = await provinceLookupService.searchProvinces({
        sessiontoken,
        language: locale,
        filter: { search_text: text, page_index: nextPageIndex, page_size: PAGE_SIZE }
      })

      if (seq !== requestSeqRef.current) return

      loadedCountRef.current = (append ? loadedCountRef.current : 0) + result.items.length
      setItems(current => (append ? [...current, ...result.items] : result.items))
      setPageIndex(nextPageIndex)
      setHasMore(result.items.length > 0 && (result.has_next_page || loadedCountRef.current < result.total_count))
    } catch (error) {
      if (seq !== requestSeqRef.current) return
      setLoadError(error instanceof Error ? error.message : messages.loadErrorText)
      if (!append) setItems([])
    } finally {
      if (seq === requestSeqRef.current) {
        setLoading(false)
        setLoadingMore(false)
      }
    }
  }, [locale, messages.loadErrorText, sessiontoken])

  // Lazy: fetch page 0 when opened and whenever the (debounced) search text changes while open.
  useEffect(() => {
    if (!open) return

    void runSearch(0, debouncedSearchText, false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, debouncedSearchText, sessiontoken, locale])

  // A value set from outside (e.g. the saved Project province on Edit) is looked up in the master once to
  // show its proper option; display only — the value itself is never changed here.
  const selectedMatches = Boolean(selected && getOptionValue(selected) === value)

  useEffect(() => {
    if (knownOption) setSelected(knownOption)
  }, [knownOption])

  useEffect(() => {
    if (!value || selectedMatches || resolvedValueRef.current === value) return

    let current = true

    resolvedValueRef.current = value
    void provinceLookupService
      .searchProvinces({ sessiontoken, language: locale, filter: { search_text: value, page_index: 0, page_size: PAGE_SIZE } })
      .then(result => {
        const match = result.items.find(item => getOptionValue(item) === value)

        if (current && match) setSelected(match)
      })
      .catch(() => undefined)

    return () => { current = false }
  }, [getOptionValue, locale, selectedMatches, sessiontoken, value])

  const handleScroll = (event: React.UIEvent<HTMLElement>) => {
    if (loading || loadingMore || !hasMore) return

    const listbox = event.currentTarget

    if (listbox.scrollTop + listbox.clientHeight >= listbox.scrollHeight - SCROLL_LOAD_MORE_THRESHOLD_PX) {
      void runSearch(pageIndex + 1, debouncedSearchText, true)
    }
  }

  // The parent only keeps the value: show the matching option, or the raw stored value as-is (legacy / not resolved yet).
  const current = !value ? null : selectedMatches ? selected : { ...allOption(value), province_code: value }
  const options = showAllOption && !debouncedSearchText ? [allOption(emptyLabel), ...items] : items
  const optionLabel = (option: ProvinceLookupItem) => formatProvinceLabel(option, locale)
  // The "all" option (empty code) and an unresolved raw value keep their own value; real options use getOptionValue.
  const optionValue = (option: ProvinceLookupItem) => (option.id < 0 ? option.province_code : getOptionValue(option))

  return (
    <Autocomplete<ProvinceLookupItem, false, false, false>
      size={size}
      fullWidth
      disabled={disabled}
      open={open}
      onOpen={() => setOpen(true)}
      onClose={() => setOpen(false)}
      options={options}
      value={current}
      loading={loading}
      loadingText={
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CircularProgress size={14} />
          <Typography variant="body2">{messages.loadingText}</Typography>
        </Box>
      }
      noOptionsText={loadError ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 0.5 }}>
          <Typography variant="body2" color="error.main">{loadError}</Typography>
          <Button size="small" onClick={() => void runSearch(0, debouncedSearchText, false)}>{messages.retryLabel}</Button>
        </Box>
      ) : messages.emptyText}
      // Server-side search: the workflow already filtered the options.
      filterOptions={optionsToKeep => optionsToKeep}
      getOptionLabel={optionLabel}
      isOptionEqualToValue={(option, selectedOption) => optionValue(option) === optionValue(selectedOption)}
      inputValue={inputValue}
      onInputChange={(_event, nextInput, reason) => {
        setInputValue(nextInput)
        setSearchText(reason === 'input' ? nextInput : '')
      }}
      onChange={(_event, option) => {
        const next = option ? optionValue(option) : ''

        setSelected(next ? option : null)
        onChange(next)
      }}
      renderOption={(optionProps, option) => (
        <Box component="li" {...optionProps} key={option.province_code || 'all'}>
          {optionLabel(option)}
        </Box>
      )}
      slots={{
        paper: paperProps => (
          <Paper {...paperProps}>
            {paperProps.children}
            {loadingMore && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 2, py: 1 }}>
                <CircularProgress size={14} />
                <Typography variant="caption" color="text.secondary">{messages.loadingMoreText}</Typography>
              </Box>
            )}
          </Paper>
        )
      }}
      slotProps={{ listbox: { onScroll: handleScroll, sx: { maxHeight: 320 } } }}
      renderInput={params => (
        <TextField
          {...params}
          label={label}
          placeholder={emptyLabel}
          required={required}
          error={error}
          helperText={helperText}
          slotProps={{ inputLabel: { ...params.InputLabelProps, shrink: true } }}
        />
      )}
      sx={sx}
    />
  )
}

export default ProvinceSelect
