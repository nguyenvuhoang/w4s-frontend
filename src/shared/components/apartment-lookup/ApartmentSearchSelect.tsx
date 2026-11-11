'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import SearchIcon from '@mui/icons-material/Search'
import {
    Autocomplete,
    Box,
    Button,
    CircularProgress,
    InputAdornment,
    Paper,
    TextField,
    Typography
} from '@mui/material'

import type { Locale } from '@/configs/i18n'
import { useDebouncedValue } from '@/features/announcement/hooks/useDebouncedValue'
import { apartmentLookupService, type ApartmentLookupOption } from '@/shared/services/apartmentLookupService'

const PAGE_SIZE = 20
const SEARCH_DEBOUNCE_MS = 400
const SCROLL_LOAD_MORE_THRESHOLD_PX = 48

export type ApartmentSearchSelectMessages = {
    placeholder: string
    loadingText: string
    emptyText: string
    loadErrorText: string
    retryLabel: string
    loadingMoreText: string
}

type Props = {
    sessiontoken?: string
    language?: Locale | string
    projectId?: number | null
    /** Current apartment_code, possibly a raw value from Excel that doesn't exist yet. */
    value: string | null
    onChange: (code: string) => void
    disabled?: boolean
    /** True while the value hasn't been confirmed via a real selection from the search list. */
    unconfirmed?: boolean
    messages: ApartmentSearchSelectMessages
}

/**
 * Server-side searchable combobox for picking an apartment_code within the current project.
 * Reuses apartmentLookupService.searchApartments (WF_BO_LIST_APARTMENTS_BY_PROJECT) — the same
 * service already used by the dialog-based ApartmentLookup — so the workflow call/response
 * parsing isn't duplicated. Unlike ApartmentLookup (numbered TablePagination, keyed by
 * apartment_id), this is a compact popover combobox keyed by apartment_code with debounced
 * search-as-you-type and infinite scroll, meant to sit inline inside a table row.
 */
const ApartmentSearchSelect = ({
    sessiontoken,
    language,
    projectId,
    value,
    onChange,
    disabled = false,
    unconfirmed = false,
    messages
}: Props) => {
    const [open, setOpen] = useState(false)
    const [inputValue, setInputValue] = useState(value ?? '')
    const [confirmed, setConfirmed] = useState(!unconfirmed)
    const [items, setItems] = useState<ApartmentLookupOption[]>([])
    const [pageIndex, setPageIndex] = useState(0)
    const [totalCount, setTotalCount] = useState(0)
    const [loading, setLoading] = useState(false)
    const [loadingMore, setLoadingMore] = useState(false)
    const [loadError, setLoadError] = useState<string | null>(null)

    // Guards against an older, slower request overwriting a newer one's results.
    const requestSeqRef = useRef(0)

    const debouncedSearchText = useDebouncedValue(inputValue, SEARCH_DEBOUNCE_MS)

    const runSearch = useCallback(async (nextPageIndex: number, searchText: string, append: boolean) => {
        if (!projectId) return

        const seq = ++requestSeqRef.current

        if (append) {
            setLoadingMore(true)
        } else {
            setLoading(true)
            setItems([])
        }

        setLoadError(null)

        try {
            const result = await apartmentLookupService.searchApartments({
                sessiontoken,
                language,
                projectId,
                filter: {
                    apartment_code: searchText,
                    apartment_type: '',
                    page_index: nextPageIndex,
                    page_size: PAGE_SIZE
                }
            })

            if (seq !== requestSeqRef.current) return

            setItems(current => (append ? [...current, ...result.items] : result.items))
            setPageIndex(nextPageIndex)
            setTotalCount(result.total_count)
        } catch (error: any) {
            if (seq !== requestSeqRef.current) return

            setLoadError(error?.message || messages.loadErrorText)
            if (!append) setItems([])
        } finally {
            if (seq === requestSeqRef.current) {
                setLoading(false)
                setLoadingMore(false)
            }
        }
    }, [language, messages.loadErrorText, projectId, sessiontoken])

    // Lazy load: only fetch once the popover is actually opened, and again whenever the
    // (debounced) search text changes while it's open — never on mount / page load.
    useEffect(() => {
        if (!open) return

        void runSearch(0, debouncedSearchText, false)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, debouncedSearchText, projectId])

    const hasMore = items.length < totalCount

    const handleScroll = (event: React.UIEvent<HTMLElement>) => {
        if (loading || loadingMore || !hasMore) return

        const listbox = event.currentTarget

        if (listbox.scrollTop + listbox.clientHeight >= listbox.scrollHeight - SCROLL_LOAD_MORE_THRESHOLD_PX) {
            void runSearch(pageIndex + 1, debouncedSearchText, true)
        }
    }

    const handleRetry = () => {
        void runSearch(open ? pageIndex : 0, debouncedSearchText, false)
    }

    const secondaryLine = (option: ApartmentLookupOption) => (
        [option.buildingCode, option.apartmentTypeLabel || option.apartmentType].filter(Boolean).join(' • ')
    )

    const noOptionsContent = loadError ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 0.5 }}>
            <Typography variant="body2" color="error.main">{loadError || messages.loadErrorText}</Typography>
            <Button size="small" onClick={handleRetry}>{messages.retryLabel}</Button>
        </Box>
    ) : messages.emptyText

    return (
        <Autocomplete
            freeSolo
            size="small"
            fullWidth
            disabled={disabled}
            open={open}
            onOpen={() => setOpen(true)}
            onClose={() => setOpen(false)}
            options={items}
            loading={loading}
            loadingText={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CircularProgress size={14} />
                    <Typography variant="body2">{messages.loadingText}</Typography>
                </Box>
            }
            noOptionsText={noOptionsContent}
            filterOptions={optionsToKeep => optionsToKeep}
            getOptionLabel={option => (typeof option === 'string' ? option : option.code)}
            isOptionEqualToValue={(option, current) => option.code === (typeof current === 'string' ? current : current.code)}
            inputValue={inputValue}
            onInputChange={(_event, newInputValue) => setInputValue(newInputValue)}
            onChange={(_event, newValue) => {
                if (newValue && typeof newValue !== 'string') {
                    setConfirmed(true)
                    setInputValue(newValue.code)
                    onChange(newValue.code)
                }
            }}
            renderOption={(optionProps, option) => (
                <Box component="li" {...optionProps} key={option.id}>
                    <Box sx={{ py: 0.25 }}>
                        <Typography variant="body2">{option.code}</Typography>
                        {secondaryLine(option) && (
                            <Typography variant="caption" color="text.secondary">
                                {secondaryLine(option)}
                            </Typography>
                        )}
                    </Box>
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
            slotProps={{
                listbox: {
                    onScroll: handleScroll,
                    sx: { maxHeight: 280 }
                },
                popper: { sx: { zIndex: theme => theme.zIndex.modal + 10 } }
            }}
            renderInput={params => (
                <TextField
                    {...params}
                    placeholder={messages.placeholder}
                    error={!confirmed && Boolean(inputValue)}
                    slotProps={{
                        input: {
                            ...params.InputProps,
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon fontSize="small" color="action" />
                                </InputAdornment>
                            )
                        }
                    }}
                />
            )}
        />
    )
}

export default ApartmentSearchSelect
