'use client'

import { memo, useMemo, type ReactNode } from 'react'
import { Box, Divider, Paper, Stack, Typography } from '@mui/material'

import type { AnnouncementDictionary } from '../types'
import AnnouncementPreviewCollapsibleContent from './AnnouncementPreviewCollapsibleContent'
import { announcementText } from './announcementListHelpers'

type Props = {
    title: string
    summary?: string
    content: string
    publishAt?: string
    dictionary?: AnnouncementDictionary
    avatarContent: ReactNode
}

const formatPublishTime = (value?: string, dictionary?: AnnouncementDictionary) => {
    if (!value) return dictionary ? announcementText(dictionary, 'always_visible', 'Always visible') : 'Always visible'

    const date = new Date(value)

    if (Number.isNaN(date.getTime())) return value

    return new Intl.DateTimeFormat('en-GB', {
        dateStyle: 'medium',
        timeStyle: 'short'
    }).format(date)
}

const MailPreview = memo(function MailPreview({
    title,
    summary,
    content,
    publishAt,
    dictionary,
    avatarContent
}: Props) {
    const subject = title.trim() || (dictionary ? announcementText(dictionary, 'announcement_title_placeholder', 'Announcement title') : 'Announcement title')
    const displayPublishTime = useMemo(() => formatPublishTime(publishAt, dictionary), [dictionary, publishAt])
    const previewHtml = useMemo(() => content || '', [content])

    return (
        <Paper
            variant="outlined"
            sx={{
                width: '100%',
                maxWidth: 520,
                mx: 'auto',
                overflow: 'hidden',
                borderRadius: 2,
                bgcolor: '#ffffff',
                boxShadow: '0 16px 34px rgba(15, 23, 42, 0.08)',
                borderColor: 'rgba(148, 163, 184, 0.35)'
            }}
        >
            <Box sx={{ px: 2.5, py: 1.65, bgcolor: '#f8fafc', borderBottom: '1px solid', borderColor: 'divider' }}>
                <Stack direction="row" alignItems="center" spacing={1.5}>
                    <Box sx={{ width: 42, height: 42, borderRadius: 2, bgcolor: 'rgba(33, 80, 134, 0.1)', color: 'primary.main', display: 'grid', placeItems: 'center', overflow: 'hidden', flexShrink: 0 }}>
                        {avatarContent}
                    </Box>
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                            {dictionary ? announcementText(dictionary, 'email_from_label', 'From') : 'From'}: O24 Admin Console
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }} noWrap>
                            {dictionary ? announcementText(dictionary, 'email_to_label', 'To') : 'To'}: Residents
                        </Typography>
                    </Box>
                    <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>
                        {displayPublishTime}
                    </Typography>
                </Stack>
            </Box>

            <Box sx={{ px: 2.75, py: 2.5 }}>
                <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 0, fontWeight: 700 }}>
                    {dictionary ? announcementText(dictionary, 'email_subject_label', 'Subject') : 'Subject'}
                </Typography>
                <Typography variant="h6" fontWeight={800} sx={{ lineHeight: 1.3, mt: 0.25 }}>
                    {subject}
                </Typography>
                {summary?.trim() && (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
                        {summary}
                    </Typography>
                )}

                <Divider sx={{ my: 2.25 }} />

                <AnnouncementPreviewCollapsibleContent
                    html={previewHtml}
                    collapsedHeight={220}
                    expandedMaxHeight={420}
                    lineHeight={1.7}
                    fadeColor="#ffffff"
                    dictionary={dictionary}
                />
            </Box>
        </Paper>
    )
})

export default MailPreview
