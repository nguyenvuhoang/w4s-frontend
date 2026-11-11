'use client'

import { memo, useEffect, useState, type ReactNode } from 'react'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined'
import PhotoLibraryOutlinedIcon from '@mui/icons-material/PhotoLibraryOutlined'
import { Box, Button, Stack, Typography } from '@mui/material'

import {
    announcementAvatarUploadService,
    isAnnouncementAvatarObjectKey
} from '../services/announcementAvatarUploadService'
import type { AnnouncementDictionary } from '../types'
import AnnouncementMediaLibraryDialog from './AnnouncementMediaLibraryDialog'
import { announcementText } from './announcementListHelpers'

type AnnouncementAvatarUploadProps = {
    value?: string | null
    previewUrl?: string | null
    fileName?: string
    disabled?: boolean
    dictionary: AnnouncementDictionary
    fallbackIcon: ReactNode
    onChange: (url: string | null, fileName?: string) => void
    onPreviewChange: (url: string | null) => void
    onUploadingChange?: (uploading: boolean) => void
}

const text = (dictionary: AnnouncementDictionary, key: string, fallback: string) => (
    announcementText(dictionary, key, fallback)
)

function AnnouncementAvatarUpload({
    value,
    previewUrl,
    fileName,
    disabled,
    dictionary,
    fallbackIcon,
    onChange,
    onPreviewChange
}: AnnouncementAvatarUploadProps) {
    const [failedImageSrc, setFailedImageSrc] = useState<string | null>(null)
    const [libraryOpen, setLibraryOpen] = useState(false)

    useEffect(() => {
        if (!value || previewUrl || !isAnnouncementAvatarObjectKey(value)) return

        let active = true

        announcementAvatarUploadService
            .prepareViewUrl(value)
            .then(url => {
                if (active) onPreviewChange(url)
            })
            .catch(() => {
                if (active) onPreviewChange(null)
            })

        return () => {
            active = false
        }
    }, [onPreviewChange, previewUrl, value])

    const handleRemove = () => {
        onChange(null, '')
        onPreviewChange(null)
    }

    const handleLibraryConfirm = (objectKey: string) => {
        setLibraryOpen(false)
        setFailedImageSrc(null)
        // Only the object_key comes back from the library — clear the stale preview so the
        // effect above resolves a fresh presigned view URL for it.
        onPreviewChange(null)
        onChange(objectKey, '')
    }

    const imageSrc = previewUrl || (value && !isAnnouncementAvatarObjectKey(value) ? value : null)
    const hasImage = Boolean(imageSrc) && failedImageSrc !== imageSrc

    return (
        <Stack spacing={1.5}>
            <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ xs: 'flex-start', sm: 'center' }} justifyContent="space-between" gap={1.5}>
                <Stack direction="row" alignItems="center" spacing={1.25} sx={{ minWidth: 0 }}>
                    <Box
                        sx={{
                            width: 56,
                            height: 56,
                            borderRadius: 1.5,
                            bgcolor: hasImage ? 'background.default' : 'rgba(33, 80, 134, 0.08)',
                            color: 'primary.main',
                            border: '1px solid',
                            borderColor: hasImage ? 'divider' : 'transparent',
                            display: 'grid',
                            placeItems: 'center',
                            overflow: 'hidden',
                            flexShrink: 0
                        }}
                    >
                        {hasImage ? (
                            <Box
                                component="img"
                                src={imageSrc as string}
                                alt={fileName || text(dictionary, 'notification_avatar', 'Avatar / Notification icon')}
                                onError={() => setFailedImageSrc(imageSrc)}
                                sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                        ) : fallbackIcon}
                    </Box>
                    <Box sx={{ minWidth: 0 }}>
                        <Typography variant="caption" color="text.secondary">
                            {hasImage
                                ? text(dictionary, 'selected_image', 'Selected image')
                                : text(dictionary, 'selected_icon', 'Selected icon')}
                        </Typography>
                        <Typography variant="body2" fontWeight={700} noWrap>
                            {hasImage
                                ? (fileName || text(dictionary, 'uploaded_image', 'Uploaded image'))
                                : text(dictionary, 'default_notification_icon', 'Default notification icon')}
                        </Typography>
                    </Box>
                </Stack>

                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    <Button
                        variant="outlined"
                        startIcon={hasImage ? <ImageOutlinedIcon fontSize="small" /> : <PhotoLibraryOutlinedIcon fontSize="small" />}
                        disabled={disabled}
                        onClick={() => setLibraryOpen(true)}
                    >
                        {hasImage
                            ? text(dictionary, 'change_image', 'Change image')
                            : text(dictionary, 'choose_image', 'Choose image')}
                    </Button>
                    {hasImage && (
                        <Button
                            variant="outlined"
                            color="error"
                            startIcon={<DeleteOutlineIcon fontSize="small" />}
                            disabled={disabled}
                            onClick={handleRemove}
                        >
                            {text(dictionary, 'remove_image', 'Remove image')}
                        </Button>
                    )}
                </Stack>
            </Stack>
            <Typography variant="caption" color="text.secondary">
                {text(dictionary, 'avatar_helper', 'PNG, JPG, JPEG or WEBP. Maximum 5MB.')}
            </Typography>

            <AnnouncementMediaLibraryDialog
                open={libraryOpen}
                dictionary={dictionary}
                initialSelectedKey={value && isAnnouncementAvatarObjectKey(value) ? value : null}
                onClose={() => setLibraryOpen(false)}
                onConfirm={handleLibraryConfirm}
            />
        </Stack>
    )
}

export default memo(AnnouncementAvatarUpload)
