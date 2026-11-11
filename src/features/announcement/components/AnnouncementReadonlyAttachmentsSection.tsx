'use client'

import AttachFileIcon from '@mui/icons-material/AttachFile'
import { Box, Paper, Stack, Typography } from '@mui/material'

import type { AnnouncementAttachmentItem, AnnouncementDictionary } from '../types'
import { announcementText, formatFileSize } from './announcementListHelpers'

export default function AnnouncementReadonlyAttachmentsSection({
    dictionary,
    attachments
}: {
    dictionary: AnnouncementDictionary
    attachments: AnnouncementAttachmentItem[]
}) {
    return (
        <Paper variant="outlined" sx={{ p: 3, borderRadius: 1.5 }}>
            <Typography variant="h6" fontWeight={800} sx={{ mb: 2 }}>
                {announcementText(dictionary, 'attachments', 'Tệp đính kèm')}
            </Typography>
            {attachments.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                    {announcementText(dictionary, 'no_attachments', 'Không có tệp đính kèm')}
                </Typography>
            ) : (
                <Stack spacing={1}>
                    {attachments.map(file => (
                        <Paper key={file.id || file.file_url || file.file_name} variant="outlined" sx={{ p: 1.5, borderRadius: 1.5 }}>
                            <Stack direction="row" gap={1.25} alignItems="center" sx={{ minWidth: 0 }}>
                                <AttachFileIcon color="action" fontSize="small" />
                                <Box sx={{ minWidth: 0 }}>
                                    <Typography variant="body2" sx={{ fontWeight: 700, overflowWrap: 'anywhere' }}>{file.file_name || '-'}</Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        {[file.file_type, formatFileSize(file.file_size)].filter(Boolean).join(' • ')}
                                    </Typography>
                                </Box>
                            </Stack>
                        </Paper>
                    ))}
                </Stack>
            )}
        </Paper>
    )
}
