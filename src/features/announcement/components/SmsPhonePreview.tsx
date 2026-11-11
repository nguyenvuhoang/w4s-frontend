'use client'

import { memo, useEffect, useMemo, useState, type ReactNode } from 'react'
import { Box, Divider, Stack, Typography } from '@mui/material'

import type { AnnouncementDictionary } from '../types'
import AnnouncementPreviewCollapsibleContent from './AnnouncementPreviewCollapsibleContent'
import { announcementText } from './announcementListHelpers'

const STATUS_BAR_CLOCK_REFRESH_MS = 60000

// The status bar clock must reflect the viewer's own device time, but rendering `new Date()`
// during the initial (server) render would not match the client's real clock on hydration.
// Start blank, resolve the real time only after mount, then refresh every minute.
const useDeviceClockLabel = () => {
    const [label, setLabel] = useState<string | null>(null)

    useEffect(() => {
        const formatter = new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit', hour12: false })
        const update = () => setLabel(formatter.format(new Date()))

        update()
        const intervalId = window.setInterval(update, STATUS_BAR_CLOCK_REFRESH_MS)

        return () => window.clearInterval(intervalId)
    }, [])

    return label
}

type Props = {
    title: string
    summary?: string
    content: string
    publishAt?: string
    dictionary?: AnnouncementDictionary
    avatarContent: ReactNode
    fullHeight?: boolean
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

const SmsPhonePreview = memo(function SmsPhonePreview({
    title,
    summary,
    content,
    publishAt,
    dictionary,
    avatarContent,
    fullHeight = false
}: Props) {
    const displayTitle = title.trim() || (dictionary ? announcementText(dictionary, 'announcement_title_placeholder', 'Announcement title') : 'Announcement title')
    const displayPublishTime = useMemo(() => formatPublishTime(publishAt, dictionary), [dictionary, publishAt])
    const previewHtml = useMemo(() => content || '', [content])
    const clockLabel = useDeviceClockLabel()

    return (
        <Box
            sx={{
                width: 356,
                maxWidth: '100%',
                mx: 'auto',
                p: '6px',
                borderRadius: '32px',
                bgcolor: 'background.paper',
                border: '1px solid',
                borderColor: '#1e3a5f',
                boxShadow: '0 8px 20px rgba(15, 23, 42, 0.08)'
            }}
        >
            <Box
                sx={{
                    position: 'relative',
                    bgcolor: '#f8fafc',
                    borderRadius: '27px',
                    height: fullHeight ? 650 : 548,
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    border: '1px solid',
                    borderColor: 'divider'
                }}
            >
                <Box
                    sx={{
                        position: 'absolute',
                        top: 10,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: 92,
                        height: 25,
                        borderRadius: 999,
                        bgcolor: '#0b1220',
                        zIndex: 2
                    }}
                />

                <Box sx={{ px: 2.25, pt: 1.35, pb: 1.3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#0f172a' }}>
                    <Typography variant="caption" fontWeight={800}>{clockLabel ?? ''}</Typography>
                    <Box sx={{ width: 96 }} />
                    <Typography variant="caption" fontWeight={800}>100%</Typography>
                </Box>

                <Box sx={{ px: 2.35, pt: 1.65, pb: 1.85, bgcolor: '#ffffff', borderBottom: '1px solid', borderColor: 'divider' }}>
                    <Stack direction="row" alignItems="center" spacing={1.25}>
                        <Box sx={{ width: 42, height: 42, borderRadius: 2.25, bgcolor: 'rgba(33, 80, 134, 0.1)', color: 'primary.main', display: 'grid', placeItems: 'center', overflow: 'hidden', flexShrink: 0 }}>
                            {avatarContent}
                        </Box>
                        <Box sx={{ minWidth: 0 }}>
                            <Typography variant="subtitle1" fontWeight={800} noWrap>
                                {dictionary ? announcementText(dictionary, 'notification_detail', 'Notification detail') : 'Notification detail'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" noWrap>
                                {displayPublishTime}
                            </Typography>
                        </Box>
                    </Stack>
                </Box>

                <Box sx={{ px: 2.35, py: 2.35, overflowY: 'auto', flexGrow: 1, minHeight: 0 }}>
                    <Stack spacing={2}>
                        <Box>
                            <Typography variant="h6" fontWeight={850} sx={{ lineHeight: 1.25 }}>
                                {displayTitle}
                            </Typography>
                            {summary?.trim() && (
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
                                    {summary}
                                </Typography>
                            )}
                        </Box>

                        <Divider />

                        <AnnouncementPreviewCollapsibleContent
                            html={previewHtml}
                            collapsedHeight={fullHeight ? 220 : 160}
                            expandedMaxHeight={fullHeight ? 360 : 260}
                            lineHeight={1.65}
                            fadeColor="#f8fafc"
                            dictionary={dictionary}
                        />
                    </Stack>
                </Box>
            </Box>
        </Box>
    )
})

export default SmsPhonePreview
