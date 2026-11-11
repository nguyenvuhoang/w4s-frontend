'use client'

import type { ReactNode } from 'react'

import CheckCircleIcon from '@mui/icons-material/CheckCircle'
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
    Pagination,
    Paper,
    Skeleton,
    Stack,
    TextField,
    Typography
} from '@mui/material'

export type EntityCardPickerModalProps<T> = {
    open: boolean
    onClose: () => void
    title: string
    subtitle?: string
    items: T[]
    getKey: (item: T) => string | number
    isSelected: (item: T) => boolean
    onSelect: (item: T) => void
    renderIcon: (item: T, selected: boolean) => ReactNode
    renderTitle: (item: T) => ReactNode
    renderSubtitle?: (item: T) => ReactNode
    renderStatusChip?: (item: T) => ReactNode | null
    loading?: boolean
    error?: string | null
    onRetry?: () => void
    retryLabel?: string
    emptyTitle: string
    emptyDescription: string
    showSearch?: boolean
    searchValue?: string
    onSearchChange?: (value: string) => void
    onSearchSubmit?: () => void
    searchLabel?: string
    searchPlaceholder?: string
    pageIndex?: number
    pageCount?: number
    onPageChange?: (page: number) => void
}

const CardSkeleton = () => (
    <Paper sx={{ p: 2.5, borderRadius: 2, border: 1, borderColor: 'divider', minHeight: 132 }}>
        <Stack spacing={1.5}>
            <Skeleton variant="circular" width={36} height={36} />
            <Skeleton width="72%" />
            <Skeleton width="96%" />
            <Skeleton width="54%" />
        </Stack>
    </Paper>
)

function EntityCardPickerModal<T>({
    open,
    onClose,
    title,
    subtitle,
    items,
    getKey,
    isSelected,
    onSelect,
    renderIcon,
    renderTitle,
    renderSubtitle,
    renderStatusChip,
    loading = false,
    error = null,
    onRetry,
    retryLabel = 'Retry',
    emptyTitle,
    emptyDescription,
    showSearch = true,
    searchValue = '',
    onSearchChange,
    onSearchSubmit,
    searchLabel,
    searchPlaceholder,
    pageIndex,
    pageCount,
    onPageChange
}: EntityCardPickerModalProps<T>) {
    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
            <DialogTitle sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2 }}>
                <Stack spacing={0.25}>
                    <Typography variant="h6" sx={{ fontWeight: 800 }}>{title}</Typography>
                    {subtitle && <Typography variant="body2" color="text.secondary">{subtitle}</Typography>}
                </Stack>
                <IconButton onClick={onClose} size="small">
                    <CloseIcon />
                </IconButton>
            </DialogTitle>
            <DialogContent>
                {showSearch && (
                    <TextField
                        fullWidth
                        size="small"
                        sx={{ mb: 2, mt: 0.5 }}
                        label={searchLabel}
                        placeholder={searchPlaceholder}
                        value={searchValue}
                        onChange={event => onSearchChange?.(event.target.value)}
                        onKeyDown={event => {
                            if (event.key === 'Enter') onSearchSubmit?.()
                        }}
                        slotProps={{
                            input: {
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton size="small" onClick={() => onSearchSubmit?.()}>
                                            <SearchIcon fontSize="small" />
                                        </IconButton>
                                    </InputAdornment>
                                )
                            }
                        }}
                    />
                )}

                {loading ? (
                    <Grid container spacing={2}>
                        {Array.from({ length: 6 }).map((_, index) => (
                            <Grid key={index} size={{ xs: 12, sm: 6, md: 4 }}>
                                <CardSkeleton />
                            </Grid>
                        ))}
                    </Grid>
                ) : items.length === 0 && !error ? (
                    <Box sx={{ py: 5, textAlign: 'center' }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>{emptyTitle}</Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{emptyDescription}</Typography>
                    </Box>
                ) : (
                    <Box sx={{ maxHeight: 440, overflowY: 'auto', pr: { md: 0.5 } }}>
                        <Grid container spacing={2}>
                            {items.map(item => {
                                const key = getKey(item)
                                const selected = isSelected(item)

                                return (
                                    <Grid key={key} size={{ xs: 12, sm: 6, md: 4 }}>
                                        <Paper
                                            role="button"
                                            tabIndex={0}
                                            onClick={() => onSelect(item)}
                                            onKeyDown={event => {
                                                if (event.key === 'Enter') onSelect(item)
                                            }}
                                            sx={{
                                                p: 2.5,
                                                minHeight: 132,
                                                height: '100%',
                                                cursor: 'pointer',
                                                position: 'relative',
                                                borderRadius: 2,
                                                border: 2,
                                                borderColor: selected ? 'primary.main' : 'divider',
                                                bgcolor: selected ? 'action.selected' : 'background.paper',
                                                transition: 'border-color 160ms ease, background-color 160ms ease, transform 160ms ease',
                                                '&:hover': {
                                                    borderColor: 'primary.main',
                                                    transform: 'translateY(-1px)'
                                                }
                                            }}
                                        >
                                            {selected && (
                                                <CheckCircleIcon
                                                    color="primary"
                                                    sx={{ position: 'absolute', top: 12, right: 12, fontSize: 22 }}
                                                />
                                            )}
                                            <Stack spacing={1.25} sx={{ pr: 3 }}>
                                                {renderIcon(item, selected)}
                                                <Typography sx={{ fontWeight: 800 }}>{renderTitle(item)}</Typography>
                                                {renderSubtitle && (
                                                    <Typography variant="body2" color="text.secondary">
                                                        {renderSubtitle(item)}
                                                    </Typography>
                                                )}
                                                {renderStatusChip && renderStatusChip(item)}
                                            </Stack>
                                        </Paper>
                                    </Grid>
                                )
                            })}
                        </Grid>
                    </Box>
                )}

                {error && (
                    <Alert
                        severity="error"
                        sx={{ mt: 2 }}
                        action={onRetry ? (
                            <Button color="inherit" size="small" onClick={onRetry}>
                                {retryLabel}
                            </Button>
                        ) : undefined}
                    >
                        {error}
                    </Alert>
                )}

                {!loading && Boolean(pageCount && pageCount > 1) && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                        <Pagination
                            page={pageIndex || 1}
                            count={pageCount}
                            onChange={(_, page) => onPageChange?.(page)}
                            color="primary"
                        />
                    </Box>
                )}
            </DialogContent>
        </Dialog>
    )
}

export default EntityCardPickerModal
