'use client'

import type { ReactNode } from 'react'
import AddIcon from '@mui/icons-material/Add'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import { Box, Button, Chip, Grid, Paper, Stack, Typography } from '@mui/material'

import type { AnnouncementDictionary, CreatedAnnouncementSummary } from '../types'
import MobileAnnouncementPreview from './MobileAnnouncementPreview'
import {
    announcementText,
    commonText,
    formatAnnouncementDateTime,
    getAnnouncementStatusColor,
    getAnnouncementStatusLabel,
    getBooleanLabel
} from './announcementListHelpers'

type Props = {
    dictionary: AnnouncementDictionary
    locale: string
    createdAnnouncement: CreatedAnnouncementSummary
    onCreateAnother: () => void
    onBackToList: () => void
}

const text = (dictionary: AnnouncementDictionary, key: string, fallback: string) => (
    announcementText(dictionary, key, fallback)
)

const InfoRow = ({ label, children }: { label: string; children: ReactNode }) => (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '200px 1fr' }, gap: 1.5 }}>
        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 700 }}>{label}</Typography>
        <Box sx={{ minWidth: 0 }}>{children}</Box>
    </Box>
)

export default function AnnouncementCreateSuccessView({
    dictionary,
    locale,
    createdAnnouncement,
    onCreateAnother,
    onBackToList
}: Props) {
    const previewTitle = createdAnnouncement.notification_type === 'SMS'
        ? text(dictionary, 'mobile_preview', 'Mobile preview')
        : text(dictionary, 'email_preview', 'Email preview')

    return (
        <Stack spacing={3}>
            <Paper
                variant="outlined"
                sx={{
                    p: 3,
                    borderRadius: 2,
                    bgcolor: 'success.lighterOpacity',
                    borderColor: 'success.light'
                }}
            >
                <Stack direction="row" spacing={2} alignItems="flex-start">
                    <CheckCircleIcon sx={{ fontSize: 40, color: 'success.dark', flexShrink: 0 }} />
                    <Box>
                        <Typography variant="h6" fontWeight={800} color="success.dark">
                            {text(dictionary, 'create_success_title', 'Announcement created successfully')}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                            {text(dictionary, 'create_success_description', 'The announcement has been created and saved to the system.')}
                        </Typography>
                    </Box>
                </Stack>
            </Paper>

            <Grid container spacing={3}>
                <Grid size={{ xs: 12, lg: 8 }}>
                    <Stack spacing={3}>
                        <Paper sx={{ p: 3 }}>
                            <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                                {text(dictionary, 'main_information', 'Main information')}
                            </Typography>
                            <Stack spacing={2}>
                                <InfoRow label={text(dictionary, 'field_id', 'Announcement ID')}>
                                    <Typography variant="body2">{createdAnnouncement.id}</Typography>
                                </InfoRow>
                                <InfoRow label={text(dictionary, 'field_title', 'Title')}>
                                    <Typography variant="body2">{createdAnnouncement.title}</Typography>
                                </InfoRow>
                                <InfoRow label={text(dictionary, 'status', 'Status')}>
                                    <Chip
                                        size="small"
                                        color={getAnnouncementStatusColor(createdAnnouncement.status)}
                                        label={getAnnouncementStatusLabel(createdAnnouncement.status, locale, dictionary)}
                                    />
                                </InfoRow>
                                <InfoRow label={text(dictionary, 'publish_time', 'Publish time')}>
                                    <Typography variant="body2">
                                        {formatAnnouncementDateTime(createdAnnouncement.published_on_utc, locale)}
                                    </Typography>
                                </InfoRow>
                                <InfoRow label={text(dictionary, 'selected_project', 'Selected project')}>
                                    <Typography variant="body2">{createdAnnouncement.project_label || '-'}</Typography>
                                </InfoRow>
                                <InfoRow label={text(dictionary, 'target_audience', 'Audience')}>
                                    <Typography variant="body2">{createdAnnouncement.target_audience_label}</Typography>
                                </InfoRow>
                                <InfoRow label={text(dictionary, 'require_read_confirmation', 'Require read confirmation')}>
                                    <Typography variant="body2">
                                        {getBooleanLabel(createdAnnouncement.require_read_confirmation, locale, dictionary)}
                                    </Typography>
                                </InfoRow>
                            </Stack>
                        </Paper>

                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                            <Button variant="outlined" color="secondary" startIcon={<ArrowBackIcon />} onClick={onBackToList}>
                                {commonText(dictionary, 'back', 'Back')}
                            </Button>
                            <Button variant="contained" startIcon={<AddIcon />} onClick={onCreateAnother}>
                                {text(dictionary, 'create_another', 'Create another announcement')}
                            </Button>
                        </Stack>
                    </Stack>
                </Grid>

                <Grid size={{ xs: 12, lg: 4 }}>
                    <Box sx={{ position: { lg: 'sticky' }, top: 24 }}>
                        <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>{previewTitle}</Typography>
                        <MobileAnnouncementPreview
                            notificationType={createdAnnouncement.notification_type}
                            title={createdAnnouncement.title}
                            summary={createdAnnouncement.summary}
                            content={createdAnnouncement.content_html}
                            avatarPreviewUrl={createdAnnouncement.avatar_preview_url}
                            avatarObjectKey={createdAnnouncement.avatar_url}
                            avatarFileName={createdAnnouncement.avatar_file_name}
                            notificationIcon={createdAnnouncement.notification_icon}
                            publishAt={createdAnnouncement.publish_at}
                            dictionary={dictionary}
                        />
                    </Box>
                </Grid>
            </Grid>
        </Stack>
    )
}
