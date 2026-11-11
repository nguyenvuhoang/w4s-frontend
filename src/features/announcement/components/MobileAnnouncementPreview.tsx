'use client'

import { memo, useCallback, useEffect, useMemo, useState } from 'react'
import { Box } from '@mui/material'

import { useDebouncedValue } from '../hooks/useDebouncedValue'
import {
    announcementAvatarUploadService,
    isAnnouncementAvatarObjectKey
} from '../services/announcementAvatarUploadService'
import type { AnnouncementDictionary } from '../types'
import MailPreview from './MailPreview'
import SmsPhonePreview from './SmsPhonePreview'
import { getAnnouncementIconOption } from './announcementIconOptions'

type Props = {
    notificationType: string
    title: string
    summary?: string
    content: string
    avatarPreviewUrl?: string | null
    avatarObjectKey?: string | null
    avatarFileName?: string
    notificationIcon?: string
    publishAt?: string
    dictionary?: AnnouncementDictionary
    fullHeight?: boolean
}

type PreparedAvatarUrl = {
    object_key: string
    url: string
}

const PREVIEW_DEBOUNCE_MS = 300

const MobileAnnouncementPreview = memo(function MobileAnnouncementPreview({
    notificationType,
    title,
    summary,
    content,
    avatarPreviewUrl,
    avatarObjectKey,
    avatarFileName,
    notificationIcon,
    publishAt,
    dictionary,
    fullHeight = false
}: Props) {
    const [preparedAvatarUrl, setPreparedAvatarUrl] = useState<PreparedAvatarUrl | null>(null)
    const [failedImageSrc, setFailedImageSrc] = useState<string | null>(null)
    const previewInput = useMemo(() => ({
        notificationType,
        title,
        summary: summary ?? '',
        content,
        avatarPreviewUrl: avatarPreviewUrl ?? null,
        avatarObjectKey: avatarObjectKey ?? null,
        avatarFileName: avatarFileName ?? '',
        notificationIcon: notificationIcon ?? 'DEFAULT',
        publishAt: publishAt ?? ''
    }), [
        avatarFileName,
        avatarObjectKey,
        avatarPreviewUrl,
        content,
        notificationIcon,
        notificationType,
        publishAt,
        summary,
        title
    ])
    const debouncedPreview = useDebouncedValue(previewInput, PREVIEW_DEBOUNCE_MS)
    const preparedUrl = preparedAvatarUrl?.object_key === debouncedPreview.avatarObjectKey ? preparedAvatarUrl.url : null

    useEffect(() => {
        if (debouncedPreview.avatarPreviewUrl || !isAnnouncementAvatarObjectKey(debouncedPreview.avatarObjectKey)) {
            return
        }

        let active = true

        announcementAvatarUploadService
            .prepareViewUrl(debouncedPreview.avatarObjectKey as string)
            .then(url => {
                if (active) {
                    setPreparedAvatarUrl({
                        object_key: debouncedPreview.avatarObjectKey as string,
                        url
                    })
                }
            })
            .catch(() => undefined)

        return () => {
            active = false
        }
    }, [debouncedPreview.avatarObjectKey, debouncedPreview.avatarPreviewUrl])

    const handleImageError = useCallback((url: string) => {
        setFailedImageSrc(url)
    }, [])

    const avatarContent = useMemo(() => {
        const avatarUrl = debouncedPreview.avatarPreviewUrl || preparedUrl

        if (avatarUrl && failedImageSrc !== avatarUrl) {
            return (
                <Box
                    component="img"
                    src={avatarUrl}
                    alt={debouncedPreview.avatarFileName || 'Notification avatar'}
                    onError={() => handleImageError(avatarUrl)}
                    sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
            )
        }

        const selectedIcon = getAnnouncementIconOption(debouncedPreview.notificationIcon, debouncedPreview.notificationType)
        const SelectedIcon = selectedIcon.icon

        return <SelectedIcon fontSize="small" />
    }, [
        debouncedPreview.avatarFileName,
        debouncedPreview.avatarPreviewUrl,
        debouncedPreview.notificationIcon,
        debouncedPreview.notificationType,
        failedImageSrc,
        handleImageError,
        preparedUrl
    ])

    if (debouncedPreview.notificationType === 'SMS') {
        return (
            <SmsPhonePreview
                title={debouncedPreview.title}
                summary={debouncedPreview.summary}
                content={debouncedPreview.content}
                publishAt={debouncedPreview.publishAt}
                dictionary={dictionary}
                avatarContent={avatarContent}
                fullHeight={fullHeight}
            />
        )
    }

    return (
        <MailPreview
            title={debouncedPreview.title}
            summary={debouncedPreview.summary}
            content={debouncedPreview.content}
            publishAt={debouncedPreview.publishAt}
            dictionary={dictionary}
            avatarContent={avatarContent}
        />
    )
})

export default MobileAnnouncementPreview
