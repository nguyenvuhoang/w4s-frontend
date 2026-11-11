'use client'

import { memo, useMemo, useState } from 'react'
import CloseIcon from '@mui/icons-material/Close'
import SearchIcon from '@mui/icons-material/Search'
import {
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Grid,
    IconButton,
    InputAdornment,
    Paper,
    Stack,
    TextField,
    Typography
} from '@mui/material'

import type { AnnouncementDictionary } from '../types'
import { announcementText, commonText } from './announcementListHelpers'
import {
    announcementIconOptions,
    getAnnouncementIconLabel,
    getAnnouncementIconOption,
    resolveAnnouncementIconKey
} from './announcementIconOptions'

type Props = {
    open: boolean
    selectedKey: string
    notificationType: string
    dictionary: AnnouncementDictionary
    onClose: () => void
    onSelect: (iconKey: string) => void
}

const normalize = (value: string) => value.trim().toLowerCase()

function AnnouncementIconPickerDialogContent({
    open,
    selectedKey,
    notificationType,
    dictionary,
    onClose,
    onSelect
}: Props) {
    const [search, setSearch] = useState('')
    const [draftKey, setDraftKey] = useState(resolveAnnouncementIconKey(selectedKey, notificationType))

    const filteredIcons = useMemo(() => {
        const keyword = normalize(search)
        if (!keyword) return announcementIconOptions

        return announcementIconOptions.filter(option => {
            const label = getAnnouncementIconLabel(dictionary, option.key, option.label)
            const haystack = [
                option.key,
                label,
                option.label,
                ...(option.aliases ?? [])
            ].join(' ').toLowerCase()

            return haystack.includes(keyword)
        })
    }, [dictionary, search])

    const selectedOption = getAnnouncementIconOption(draftKey)
    const SelectedIcon = selectedOption.icon

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
            <DialogTitle sx={{ pb: 1.5 }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                    <Typography variant="h6" fontWeight={700}>
                        {announcementText(dictionary, 'change_icon', 'Change icon')}
                    </Typography>
                    <IconButton size="small" onClick={onClose}>
                        <CloseIcon fontSize="small" />
                    </IconButton>
                </Stack>
            </DialogTitle>

            <DialogContent>
                <Stack spacing={2.5}>
                    <TextField
                        fullWidth
                        value={search}
                        onChange={event => setSearch(event.target.value)}
                        placeholder={announcementText(dictionary, 'search_icon_placeholder', 'Search icon')}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon fontSize="small" />
                                </InputAdornment>
                            )
                        }}
                    />

                    <Paper
                        variant="outlined"
                        sx={{
                            px: 2,
                            py: 1.5,
                            borderRadius: 1.5,
                            bgcolor: 'grey.50'
                        }}
                    >
                        <Stack direction="row" alignItems="center" spacing={1.25}>
                            <Box
                                sx={{
                                    width: 36,
                                    height: 36,
                                    borderRadius: 1.25,
                                    bgcolor: 'rgba(33, 80, 134, 0.08)',
                                    color: 'primary.main',
                                    display: 'grid',
                                    placeItems: 'center'
                                }}
                            >
                                <SelectedIcon fontSize="small" />
                            </Box>
                            <Box>
                                <Typography variant="caption" color="text.secondary">
                                    {announcementText(dictionary, 'selected_icon', 'Selected icon')}
                                </Typography>
                                <Typography variant="body2" fontWeight={700}>
                                    {getAnnouncementIconLabel(dictionary, selectedOption.key, selectedOption.label)}
                                </Typography>
                            </Box>
                        </Stack>
                    </Paper>

                    {filteredIcons.length === 0 ? (
                        <Paper variant="outlined" sx={{ p: 2, borderRadius: 1.5 }}>
                            <Typography variant="body2" color="text.secondary">
                                {announcementText(dictionary, 'no_icons_found', 'No icons found.')}
                            </Typography>
                        </Paper>
                    ) : (
                        <Grid container spacing={1.5}>
                            {filteredIcons.map(option => {
                                const Icon = option.icon
                                const selected = option.key === draftKey

                                return (
                                    <Grid key={option.key} size={{ xs: 12, sm: 6, md: 4 }}>
                                        <Paper
                                            component="button"
                                            type="button"
                                            variant="outlined"
                                            onClick={() => setDraftKey(option.key)}
                                            sx={{
                                                width: '100%',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 1.25,
                                                p: 1.25,
                                                borderRadius: 1.5,
                                                textAlign: 'left',
                                                cursor: 'pointer',
                                                borderColor: selected ? 'primary.main' : 'divider',
                                                bgcolor: selected ? 'action.hover' : 'background.paper',
                                                color: 'text.primary',
                                                transition: 'border-color 120ms ease, background-color 120ms ease',
                                                '&:hover': {
                                                    borderColor: 'primary.main',
                                                    bgcolor: 'action.hover'
                                                }
                                            }}
                                        >
                                            <Box
                                                sx={{
                                                    width: 34,
                                                    height: 34,
                                                    borderRadius: 1.25,
                                                    bgcolor: selected ? 'rgba(33, 80, 134, 0.08)' : 'grey.100',
                                                    color: selected ? 'primary.main' : 'text.secondary',
                                                    display: 'grid',
                                                    placeItems: 'center',
                                                    flexShrink: 0
                                                }}
                                            >
                                                <Icon fontSize="small" />
                                            </Box>
                                            <Typography variant="body2" fontWeight={700}>
                                                {getAnnouncementIconLabel(dictionary, option.key, option.label)}
                                            </Typography>
                                        </Paper>
                                    </Grid>
                                )
                            })}
                        </Grid>
                    )}
                </Stack>
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 2.5 }}>
                <Button variant="outlined" color="secondary" onClick={onClose}>
                    {commonText(dictionary, 'cancel', 'Cancel')}
                </Button>
                <Button
                    variant="contained"
                    onClick={() => {
                        onSelect(draftKey)
                        onClose()
                    }}
                >
                    {announcementText(dictionary, 'select_icon', 'Select icon')}
                </Button>
            </DialogActions>
        </Dialog>
    )
}

const AnnouncementIconPickerDialog = memo(function AnnouncementIconPickerDialog(props: Props) {
    if (!props.open) return null

    return <AnnouncementIconPickerDialogContent {...props} />
}, (prev, next) => (
    !prev.open && !next.open
        ? prev.onClose === next.onClose && prev.onSelect === next.onSelect
        : prev.open === next.open
            && prev.selectedKey === next.selectedKey
            && prev.notificationType === next.notificationType
            && prev.dictionary === next.dictionary
            && prev.onClose === next.onClose
            && prev.onSelect === next.onSelect
))

export default AnnouncementIconPickerDialog
