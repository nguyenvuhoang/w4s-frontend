'use client'

import AttachFileIcon from '@mui/icons-material/AttachFile'
import ForumOutlinedIcon from '@mui/icons-material/ForumOutlined'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import PersonOutlineIcon from '@mui/icons-material/PersonOutline'
import VerifiedUserOutlinedIcon from '@mui/icons-material/VerifiedUserOutlined'
import { Avatar, Box, Button, Divider, Paper, Stack, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'

import type { ServiceRequestMessage, ServiceRequestsDictionary } from '../types'
import {
    displayText,
    formatServiceRequestDateTime,
    serviceRequestsText
} from './serviceRequestHelpers'

type Props = {
    dictionary: ServiceRequestsDictionary
    locale: string
    messages: ServiceRequestMessage[]
}

const getSenderLabel = (dictionary: ServiceRequestsDictionary, senderType: string) => {
    if (senderType === 'RESIDENT') return serviceRequestsText(dictionary, 'sender_resident')
    if (senderType === 'ADMIN') return serviceRequestsText(dictionary, 'sender_admin')

    return displayText(senderType)
}

const EmptyMessages = ({ dictionary }: { dictionary: ServiceRequestsDictionary }) => (
    <Stack alignItems="center" justifyContent="center" spacing={1} sx={{ py: 5, textAlign: 'center', color: 'text.secondary' }}>
        <InfoOutlinedIcon />
        <Typography variant="body2" sx={{ fontWeight: 700 }}>
            {serviceRequestsText(dictionary, 'no_resident_messages')}
        </Typography>
    </Stack>
)

const ServiceRequestMessagesSection = ({ dictionary, locale, messages }: Props) => (
    <Paper
        sx={{
            borderRadius: 3,
            border: 1,
            borderColor: 'divider',
            overflow: 'hidden'
        }}
    >
        <Stack
            direction="row"
            alignItems="center"
            gap={1.5}
            sx={{ px: 3, py: 2, borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper' }}
        >
            <Box
                sx={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: 'primary.main',
                    color: 'primary.contrastText'
                }}
            >
                <ForumOutlinedIcon sx={{ fontSize: 20 }} />
            </Box>
            <Stack spacing={0}>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, lineHeight: 1.3 }}>
                    {serviceRequestsText(dictionary, 'resident_exchange')}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                    {serviceRequestsText(dictionary, 'resident_exchange_subtitle')}
                </Typography>
            </Stack>
        </Stack>

        <Box sx={{ p: 2.5, bgcolor: theme => (theme.palette.mode === 'dark' ? alpha(theme.palette.common.white, 0.02) : '#f8fafc') }}>
            {messages.length === 0 ? (
                <EmptyMessages dictionary={dictionary} />
            ) : (
                <Stack spacing={2}>
                    {messages.map((message, index) => {
                        const isAdmin = message.sender_type === 'ADMIN'

                        return (
                            <Paper key={`${message.sent_on_utc ?? 'message'}-${index}`} sx={{ p: 2, borderRadius: 2, border: 1, borderColor: 'divider' }}>
                                <Stack spacing={1.25}>
                                    <Stack direction="row" spacing={1.25} alignItems="flex-start">
                                        <Avatar
                                            sx={{
                                                width: 32,
                                                height: 32,
                                                bgcolor: isAdmin ? 'primary.main' : 'grey.200',
                                                color: isAdmin ? 'primary.contrastText' : 'grey.700'
                                            }}
                                        >
                                            {isAdmin ? <VerifiedUserOutlinedIcon sx={{ fontSize: 18 }} /> : <PersonOutlineIcon sx={{ fontSize: 18 }} />}
                                        </Avatar>
                                        <Stack spacing={0.25} sx={{ minWidth: 0 }}>
                                            <Typography variant="body2" sx={{ fontWeight: 800 }}>
                                                {getSenderLabel(dictionary, message.sender_type)}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {formatServiceRequestDateTime(message.sent_on_utc, locale)}
                                            </Typography>
                                        </Stack>
                                    </Stack>

                                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                                        {displayText(message.content)}
                                    </Typography>

                                    {message.attachments.length > 0 && (
                                        <>
                                            <Divider />
                                            <Stack spacing={1}>
                                                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800, textTransform: 'uppercase' }}>
                                                    {serviceRequestsText(dictionary, 'message_attachments')}
                                                </Typography>
                                                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                                                    {message.attachments.map((attachment, attachmentIndex) => (
                                                        <Button
                                                            key={`${attachment.file_url || attachment.file_name}-${attachmentIndex}`}
                                                            component="a"
                                                            href={attachment.file_url || '#'}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            size="small"
                                                            variant="outlined"
                                                            startIcon={<AttachFileIcon />}
                                                            endIcon={<OpenInNewIcon />}
                                                            disabled={!attachment.file_url}
                                                        >
                                                            {displayText(attachment.file_name)}
                                                        </Button>
                                                    ))}
                                                </Stack>
                                            </Stack>
                                        </>
                                    )}
                                </Stack>
                            </Paper>
                        )
                    })}
                </Stack>
            )}
        </Box>
    </Paper>
)

export default ServiceRequestMessagesSection
