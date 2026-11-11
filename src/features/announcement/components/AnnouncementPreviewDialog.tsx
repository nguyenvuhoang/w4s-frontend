'use client'

import { memo } from 'react'
import CloseIcon from '@mui/icons-material/Close'
import { Dialog, DialogContent, DialogTitle, IconButton, Stack, Typography } from '@mui/material'

import type {
    AnnouncementDictionary,
    AnnouncementFormValues
} from '../types'
import { announcementText } from './announcementListHelpers'
import MobileAnnouncementPreview from './MobileAnnouncementPreview'

type Props = {
    open: boolean
    values: AnnouncementFormValues
    dictionary: AnnouncementDictionary
    onClose: () => void
}

const AnnouncementPreviewDialog = memo(function AnnouncementPreviewDialog({ open, values, dictionary, onClose }: Props) {
    const previewTitle = values.notification_type === 'SMS'
        ? announcementText(dictionary, 'mobile_preview', 'Mobile preview')
        : announcementText(dictionary, 'email_preview', 'Email preview')

    if (!open) return null

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                    <Typography variant="h6" fontWeight={700}>
                        {previewTitle}
                    </Typography>
                    <IconButton onClick={onClose} size="small">
                        <CloseIcon fontSize="small" />
                    </IconButton>
                </Stack>
            </DialogTitle>
            <DialogContent sx={{ display: 'flex', justifyContent: 'center', pb: 3 }}>
                <MobileAnnouncementPreview
                    notificationType={values.notification_type}
                    title={values.title}
                    summary={values.summary}
                    content={values.content_html}
                    avatarPreviewUrl={values.avatar_preview_url}
                    avatarObjectKey={values.avatar_url}
                    avatarFileName={values.avatar_file_name}
                    notificationIcon={values.notification_icon}
                    publishAt={values.publish_at}
                    dictionary={dictionary}
                    fullHeight
                />
            </DialogContent>
        </Dialog>
    )
}, (prev, next) => (
    !prev.open && !next.open
        ? prev.onClose === next.onClose
        : prev.open === next.open && prev.values === next.values && prev.dictionary === next.dictionary && prev.onClose === next.onClose
))

export default AnnouncementPreviewDialog
