'use client'

import { memo } from 'react'
import CloseIcon from '@mui/icons-material/Close'
import { Box, Dialog, DialogContent, DialogTitle, IconButton, Stack, Typography } from '@mui/material'

import type { AnnouncementDictionary } from '../types'
import { announcementText } from './announcementListHelpers'
import AnnouncementRichTextEditor from './AnnouncementRichTextEditor'

type Props = {
    open: boolean
    dictionary: AnnouncementDictionary
    value: string
    disabled?: boolean
    error?: string
    onClose: () => void
    onChange: (value: string) => void
}

const AnnouncementEditorFullscreenDialog = memo(function AnnouncementEditorFullscreenDialog({
    open,
    dictionary,
    value,
    disabled,
    error,
    onClose,
    onChange
}: Props) {
    if (!open) return null

    return (
        <Dialog
            open={open}
            onClose={onClose}
            fullScreen
            aria-labelledby="announcement-editor-fullscreen-title"
        >
            <DialogTitle sx={{ borderBottom: '1px solid', borderColor: 'divider', py: 1.25 }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                    <Typography id="announcement-editor-fullscreen-title" variant="h6" fontWeight={700}>
                        {announcementText(dictionary, 'content_section', 'Notification content')}
                    </Typography>
                    <IconButton
                        size="small"
                        onClick={onClose}
                        aria-label={announcementText(dictionary, 'close_editor', 'Close')}
                    >
                        <CloseIcon fontSize="small" />
                    </IconButton>
                </Stack>
            </DialogTitle>

            <DialogContent sx={{ p: { xs: 2, md: 3 }, overflow: 'hidden' }}>
                <Box sx={{ height: 'calc(100vh - 140px)', display: 'flex', flexDirection: 'column' }}>
                    <AnnouncementRichTextEditor
                        value={value}
                        disabled={disabled}
                        error={error}
                        editorHeight="calc(100vh - 240px)"
                        lockEditorHeight
                        onChange={onChange}
                    />
                </Box>
            </DialogContent>
        </Dialog>
    )
}, (prev, next) => (
    !prev.open && !next.open
        ? prev.onClose === next.onClose && prev.onChange === next.onChange
        : prev.open === next.open
            && prev.dictionary === next.dictionary
            && prev.value === next.value
            && prev.disabled === next.disabled
            && prev.error === next.error
            && prev.onClose === next.onClose
            && prev.onChange === next.onChange
))

export default AnnouncementEditorFullscreenDialog
