'use client'

import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import BrokenImageOutlinedIcon from '@mui/icons-material/BrokenImageOutlined'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import CloseIcon from '@mui/icons-material/Close'
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined'
import SearchIcon from '@mui/icons-material/Search'
import UploadFileIcon from '@mui/icons-material/UploadFile'
import {
    Alert,
    Box,
    Button,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
    InputAdornment,
    Skeleton,
    Stack,
    TextField,
    Typography
} from '@mui/material'

import SwalAlert from '@/shared/utils/SwalAlert'
import { useDebouncedValue } from '../hooks/useDebouncedValue'
import {
    announcementAvatarUploadService,
    validateAnnouncementAvatarFile
} from '../services/announcementAvatarUploadService'
import {
    announcementGalleryService,
    type AnnouncementGalleryImage
} from '../services/announcementGalleryService'
import type { AnnouncementDictionary } from '../types'
import { announcementText } from './announcementListHelpers'

type GalleryItem = AnnouncementGalleryImage & { viewUrl?: string; viewError?: boolean }

type Props = {
    open: boolean
    dictionary: AnnouncementDictionary
    initialSelectedKey?: string | null
    onClose: () => void
    onConfirm: (objectKey: string) => void
}

const PAGE_SIZE = 30
const SEARCH_DEBOUNCE_MS = 350
const SKELETON_COUNT = 12

const formatFileSize = (bytes: number) => {
    if (!bytes) return '0 KB'

    const kb = bytes / 1024

    if (kb < 1024) return `${kb.toFixed(kb < 10 ? 1 : 0)} KB`

    return `${(kb / 1024).toFixed(1)} MB`
}

const formatUploadedDate = (iso: string) => {
    if (!iso) return ''

    const date = new Date(iso)

    if (Number.isNaN(date.getTime())) return ''

    return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(date)
}

const GalleryCard = memo(function GalleryCard({
    item,
    selected,
    selectedLabel,
    onSelect
}: {
    item: GalleryItem
    selected: boolean
    selectedLabel: string
    onSelect: () => void
}) {
    return (
        <Box
            onClick={onSelect}
            sx={{
                borderRadius: 1.5,
                overflow: 'hidden',
                cursor: 'pointer',
                border: '2px solid',
                borderColor: selected ? 'primary.main' : 'divider',
                bgcolor: selected ? 'action.selected' : 'background.paper',
                transition: 'border-color 120ms ease, background-color 120ms ease',
                '&:hover': { borderColor: selected ? 'primary.main' : 'primary.light' }
            }}
        >
            <Box sx={{ position: 'relative', aspectRatio: '4 / 3', bgcolor: 'grey.100', display: 'grid', placeItems: 'center' }}>
                {item.viewUrl ? (
                    <Box
                        component="img"
                        src={item.viewUrl}
                        alt={item.file_name}
                        sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                ) : item.viewError ? (
                    <BrokenImageOutlinedIcon color="disabled" />
                ) : (
                    <CircularProgress size={18} />
                )}
                {selected && (
                    <Stack
                        direction="row"
                        alignItems="center"
                        spacing={0.5}
                        sx={{
                            position: 'absolute',
                            top: 6,
                            right: 6,
                            px: 0.75,
                            py: 0.25,
                            borderRadius: 999,
                            bgcolor: 'primary.main',
                            color: 'primary.contrastText',
                            boxShadow: 1
                        }}
                    >
                        <CheckCircleIcon sx={{ fontSize: 14 }} />
                        <Typography variant="caption" fontWeight={700} sx={{ fontSize: 11 }}>
                            {selectedLabel}
                        </Typography>
                    </Stack>
                )}
            </Box>
            <Stack sx={{ p: 1 }} spacing={0.25}>
                <Typography variant="caption" fontWeight={600} noWrap title={item.file_name}>
                    {item.file_name}
                </Typography>
                <Typography variant="caption" color="text.secondary" noWrap>
                    {formatFileSize(item.size)} • {formatUploadedDate(item.last_modified)}
                </Typography>
            </Stack>
        </Box>
    )
})

function AnnouncementMediaLibraryDialog({ open, dictionary, initialSelectedKey, onClose, onConfirm }: Props) {
    const text = useCallback((key: string, fallback: string) => announcementText(dictionary, key, fallback), [dictionary])

    const [items, setItems] = useState<GalleryItem[]>([])
    const [loading, setLoading] = useState(false)
    const [loadingMore, setLoadingMore] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [page, setPage] = useState(1)
    const [hasNextPage, setHasNextPage] = useState(false)
    const [searchInput, setSearchInput] = useState('')
    const [selectedKey, setSelectedKey] = useState<string | null>(null)
    const searchText = useDebouncedValue(searchInput, SEARCH_DEBOUNCE_MS)
    const requestIdRef = useRef(0)

    const resolveViewUrls = useCallback((pending: GalleryItem[]) => {
        pending.forEach(item => {
            if (item.viewUrl || item.viewError) return

            announcementAvatarUploadService.prepareViewUrl(item.object_key)
                .then(url => {
                    setItems(current => current.map(existing => (
                        existing.object_key === item.object_key ? { ...existing, viewUrl: url } : existing
                    )))
                })
                .catch(() => {
                    setItems(current => current.map(existing => (
                        existing.object_key === item.object_key ? { ...existing, viewError: true } : existing
                    )))
                })
        })
    }, [])

    const loadPage = useCallback(async (nextPage: number, nextSearchText: string, append: boolean) => {
        const requestId = ++requestIdRef.current

        if (append) setLoadingMore(true)
        else {
            setLoading(true)
            setError(null)
        }

        try {
            const result = await announcementGalleryService.listImages({
                searchText: nextSearchText,
                page: nextPage,
                pageSize: PAGE_SIZE
            })

            if (requestId !== requestIdRef.current) return

            setPage(result.page)
            setHasNextPage(result.has_next_page)
            setItems(current => (append ? [...current, ...result.items] : result.items))
            resolveViewUrls(result.items)
        } catch (caught: any) {
            if (requestId !== requestIdRef.current) return

            const message = caught?.message ?? text('gallery_load_failed', 'Unable to load gallery images.')

            if (append) SwalAlert('error', message, 'center')
            else setError(message)
        } finally {
            if (requestId === requestIdRef.current) {
                setLoading(false)
                setLoadingMore(false)
            }
        }
    }, [resolveViewUrls, text])

    useEffect(() => {
        if (!open) return

        setSelectedKey(initialSelectedKey ?? null)
        setSearchInput('')
        void loadPage(1, '', false)
        // Reset + reload only when the dialog transitions open; searchText changes are handled below.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open])

    useEffect(() => {
        if (!open) return
        void loadPage(1, searchText, false)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchText])

    const handleLoadMore = useCallback(() => {
        if (loadingMore || !hasNextPage) return
        void loadPage(page + 1, searchText, true)
    }, [hasNextPage, loadPage, loadingMore, page, searchText])

    const handleUploadFiles = useCallback(async (fileList: FileList | null) => {
        const file = fileList?.[0]

        if (!file) return

        if (!validateAnnouncementAvatarFile(file)) {
            SwalAlert('error', text('avatar_invalid_type', 'Please choose a PNG, JPG, JPEG or WEBP image up to 5MB.'), 'center')
            return
        }

        setUploading(true)

        try {
            const result = await announcementAvatarUploadService.upload(file)

            setSearchInput('')
            await loadPage(1, '', false)
            setSelectedKey(result.object_key)
        } catch (caught: any) {
            SwalAlert('error', caught?.message ?? text('avatar_upload_failed', 'Unable to upload image.'), 'center')
        } finally {
            setUploading(false)
        }
    }, [loadPage, text])

    const selectedItem = useMemo(() => items.find(item => item.object_key === selectedKey) ?? null, [items, selectedKey])

    const handleConfirm = useCallback(() => {
        if (!selectedKey) return
        onConfirm(selectedKey)
    }, [onConfirm, selectedKey])

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="lg"
            fullWidth
            slotProps={{ paper: { sx: { height: { sm: '85vh' }, width: { sm: '90vw' } } } }}
        >
            <DialogTitle>
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                    <Typography variant="h6" fontWeight={700}>
                        {text('gallery_title', 'Announcement image library')}
                    </Typography>
                    <IconButton onClick={onClose} size="small">
                        <CloseIcon fontSize="small" />
                    </IconButton>
                </Stack>
            </DialogTitle>
            <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                    <TextField
                        fullWidth
                        size="small"
                        placeholder={text('gallery_search_placeholder', 'Search images by file name')}
                        value={searchInput}
                        onChange={event => setSearchInput(event.target.value)}
                        slotProps={{
                            input: {
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon fontSize="small" />
                                    </InputAdornment>
                                )
                            }
                        }}
                    />
                    <Button
                        component="label"
                        variant="outlined"
                        startIcon={uploading ? <CircularProgress size={16} /> : <UploadFileIcon fontSize="small" />}
                        disabled={uploading}
                        sx={{ whiteSpace: 'nowrap' }}
                    >
                        {text('gallery_upload_new', 'Upload new image')}
                        <input
                            hidden
                            type="file"
                            accept="image/png,image/jpeg,image/jpg,image/webp,.png,.jpg,.jpeg,.webp"
                            onChange={event => {
                                void handleUploadFiles(event.target.files)
                                event.target.value = ''
                            }}
                        />
                    </Button>
                </Stack>

                {error && (
                    <Alert
                        severity="error"
                        action={<Button size="small" onClick={() => void loadPage(1, searchText, false)}>{text('retry', 'Retry')}</Button>}
                    >
                        {error}
                    </Alert>
                )}

                <Box sx={{ flexGrow: 1, overflowY: 'auto', minHeight: 280 }}>
                    {loading ? (
                        <Box
                            sx={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                                gap: 1.5
                            }}
                        >
                            {Array.from({ length: SKELETON_COUNT }).map((_, index) => (
                                <Box key={index}>
                                    <Skeleton variant="rounded" sx={{ aspectRatio: '4 / 3', width: '100%' }} />
                                    <Skeleton variant="text" width="80%" sx={{ mt: 1 }} />
                                    <Skeleton variant="text" width="50%" />
                                </Box>
                            ))}
                        </Box>
                    ) : items.length === 0 ? (
                        <Stack alignItems="center" justifyContent="center" spacing={1} sx={{ height: '100%', minHeight: 240, color: 'text.secondary' }}>
                            <ImageOutlinedIcon sx={{ fontSize: 40 }} />
                            <Typography variant="body2">{text('gallery_empty', 'No images yet. Upload your first image.')}</Typography>
                        </Stack>
                    ) : (
                        <Box
                            sx={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                                gap: 1.5
                            }}
                        >
                            {items.map(item => (
                                <GalleryCard
                                    key={item.object_key}
                                    item={item}
                                    selected={item.object_key === selectedKey}
                                    selectedLabel={text('gallery_selected_badge', 'Selected')}
                                    onSelect={() => setSelectedKey(item.object_key)}
                                />
                            ))}
                        </Box>
                    )}

                    {hasNextPage && !loading && (
                        <Stack alignItems="center" sx={{ mt: 2 }}>
                            <Button size="small" onClick={handleLoadMore} disabled={loadingMore}>
                                {loadingMore ? text('loading', 'Loading...') : text('gallery_load_more', 'Load more')}
                            </Button>
                        </Stack>
                    )}
                </Box>
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 2, justifyContent: 'space-between' }}>
                <Stack direction="row" alignItems="center" spacing={1.25} sx={{ minWidth: 0 }}>
                    {selectedItem ? (
                        <>
                            <Box sx={{ width: 36, height: 36, borderRadius: 1, overflow: 'hidden', flexShrink: 0, bgcolor: 'grey.100' }}>
                                {selectedItem.viewUrl && (
                                    <Box component="img" src={selectedItem.viewUrl} alt={selectedItem.file_name} sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                )}
                            </Box>
                            <Typography variant="body2" noWrap>{selectedItem.file_name}</Typography>
                        </>
                    ) : (
                        <Typography variant="body2" color="text.secondary">
                            {text('gallery_no_selection', 'No image selected')}
                        </Typography>
                    )}
                </Stack>
                <Stack direction="row" spacing={1.5}>
                    <Button variant="outlined" color="secondary" onClick={onClose}>
                        {text('cancel', 'Cancel')}
                    </Button>
                    <Button variant="contained" onClick={handleConfirm} disabled={!selectedKey}>
                        {text('gallery_confirm', 'Use this image')}
                    </Button>
                </Stack>
            </DialogActions>
        </Dialog>
    )
}

export default AnnouncementMediaLibraryDialog
