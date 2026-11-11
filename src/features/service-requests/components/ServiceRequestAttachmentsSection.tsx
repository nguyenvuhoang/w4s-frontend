'use client'

import AttachFileIcon from '@mui/icons-material/AttachFile'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import { Box, Chip, Divider, Grid, IconButton, Paper, Stack, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'

import type { ServiceRequestAttachment, ServiceRequestsDictionary } from '../types'
import { displayText, serviceRequestsText } from './serviceRequestHelpers'

type Props = {
    dictionary: ServiceRequestsDictionary
    attachments: ServiceRequestAttachment[]
}

const isImageAttachment = (attachment: ServiceRequestAttachment) => {
    const fileType = attachment.file_type.toLowerCase()
    const fileUrl = attachment.file_url.toLowerCase()

    return fileType.startsWith('image/')
        || ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg'].some(extension => fileUrl.includes(extension))
}

const EmptyAttachments = ({ text }: { text: string }) => (
    <Stack alignItems="center" justifyContent="center" spacing={1} sx={{ py: 4, color: 'text.secondary' }}>
        <InfoOutlinedIcon />
        <Typography variant="body2" sx={{ fontWeight: 700 }}>
            {text}
        </Typography>
    </Stack>
)

const ServiceRequestAttachmentsSection = ({ dictionary, attachments }: Props) => (
    <Paper sx={{ p: 3, borderRadius: 2, border: 1, borderColor: 'divider' }}>
        <Stack spacing={2.5}>
            <Stack direction="row" alignItems="center" gap={1}>
                <AttachFileIcon color="primary" />
                <Typography variant="h6" sx={{ fontWeight: 800 }}>
                    {serviceRequestsText(dictionary, 'attachments_list')}
                </Typography>
            </Stack>
            <Divider />

            {attachments.length === 0 ? (
                <EmptyAttachments text={serviceRequestsText(dictionary, 'no_attachments')} />
            ) : (
                <Grid container spacing={2}>
                    {attachments.map((attachment, index) => {
                        const image = isImageAttachment(attachment)
                        const href = attachment.file_url || undefined
                        const handleOpenAttachment = () => {
                            if (!href) return

                            window.open(href, '_blank', 'noopener,noreferrer')
                        }

                        return (
                            <Grid key={`${attachment.file_url || attachment.file_name}-${index}`} size={{ xs: 12, sm: 6, lg: 4, xl: 3 }}>
                                <Paper
                                    role={href ? 'button' : undefined}
                                    tabIndex={href ? 0 : undefined}
                                    onClick={handleOpenAttachment}
                                    onKeyDown={event => {
                                        if (!href || (event.key !== 'Enter' && event.key !== ' ')) return

                                        event.preventDefault()
                                        handleOpenAttachment()
                                    }}
                                    sx={{
                                        p: 1.5,
                                        borderRadius: 2,
                                        border: 1,
                                        borderColor: 'divider',
                                        height: '100%',
                                        cursor: href ? 'pointer' : 'default',
                                        transition: 'border-color 150ms ease, box-shadow 150ms ease',
                                        '&:hover': href
                                            ? { borderColor: 'primary.main', boxShadow: 2 }
                                            : undefined
                                    }}
                                >
                                    <Stack spacing={1.25} sx={{ height: '100%' }}>
                                        <Box
                                            sx={theme => ({
                                                display: 'grid',
                                                placeItems: 'center',
                                                height: 148,
                                                borderRadius: 1.5,
                                                bgcolor: alpha(theme.palette.primary.main, 0.06),
                                                overflow: 'hidden',
                                                pointerEvents: 'none'
                                            })}
                                        >
                                            {image && attachment.file_url ? (
                                                <Box
                                                    component="img"
                                                    src={attachment.file_url}
                                                    alt={attachment.file_name}
                                                    sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                />
                                            ) : (
                                                <AttachFileIcon color="primary" />
                                            )}
                                        </Box>
                                        <Stack direction="row" alignItems="flex-start" justifyContent="space-between" gap={1} sx={{ minWidth: 0 }}>
                                            <Typography variant="body2" sx={{ fontWeight: 700, wordBreak: 'break-word' }}>
                                                {displayText(attachment.file_name)}
                                            </Typography>
                                            {href && (
                                                <IconButton
                                                    component="a"
                                                    href={href}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    size="small"
                                                    aria-label={serviceRequestsText(dictionary, 'open_attachment')}
                                                    onClick={event => event.stopPropagation()}
                                                >
                                                    <OpenInNewIcon fontSize="small" />
                                                </IconButton>
                                            )}
                                        </Stack>
                                        <Chip
                                            size="small"
                                            variant="outlined"
                                            color={attachment.is_result_attachment ? 'success' : 'default'}
                                            label={serviceRequestsText(dictionary, attachment.is_result_attachment ? 'result_attachment' : 'request_attachment')}
                                            sx={{ alignSelf: 'flex-start', mt: 'auto' }}
                                        />
                                    </Stack>
                                </Paper>
                            </Grid>
                        )
                    })}
                </Grid>
            )}
        </Stack>
    </Paper>
)

export default ServiceRequestAttachmentsSection
