'use client'

import DoneAllIcon from '@mui/icons-material/DoneAll'
import ForumOutlinedIcon from '@mui/icons-material/ForumOutlined'
import MarkChatUnreadOutlinedIcon from '@mui/icons-material/MarkChatUnreadOutlined'
import PersonOutlineIcon from '@mui/icons-material/PersonOutline'
import RefreshIcon from '@mui/icons-material/Refresh'
import SendIcon from '@mui/icons-material/Send'
import VerifiedUserOutlinedIcon from '@mui/icons-material/VerifiedUserOutlined'
import {
    Alert,
    Avatar,
    Box,
    Button,
    IconButton,
    Paper,
    Skeleton,
    Stack,
    TextField,
    Tooltip,
    Typography
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import type { KeyboardEvent } from 'react'

import type { Locale } from '@/configs/i18n'

import {
    chatText,
    commonText,
    formatChatTime,
    getSenderLabel
} from './serviceRequestChatHelpers'
import { useServiceRequestChat } from '../hooks/useServiceRequestChat'
import { SERVICE_REQUEST_MESSAGE_CREATE_API_READY } from '../services/serviceRequestChatService'
import type { ChatDictionary, ServiceRequestMessage } from '../types'

const CLOSED_STATUSES = ['COMPLETED', 'CANCELLED', 'D']
const SERVICE_REQUEST_TYPE = 'SR'

type Props = {
    dictionary: ChatDictionary
    locale: Locale
    serviceRequestId: number
    requestType: string
    status: string
    isHiddenFromResident?: boolean
}

const bubbleShadow = '0 1px 2px rgba(15, 23, 42, 0.06)'
const adminBubbleShadow = '0 4px 10px rgba(25, 54, 109, 0.18)'

const MessageBubble = ({ dictionary, locale, message }: { dictionary: ChatDictionary; locale: string; message: ServiceRequestMessage }) => {
    const isAdmin = message.sender_type === 'ADMIN'

    return (
        <Box sx={{ display: 'flex', justifyContent: isAdmin ? 'flex-end' : 'flex-start' }}>
            <Stack
                direction={isAdmin ? 'row-reverse' : 'row'}
                spacing={1.25}
                sx={{ maxWidth: '78%', alignItems: 'flex-start' }}
            >
                <Avatar
                    sx={{
                        width: 32,
                        height: 32,
                        mt: 2.5,
                        bgcolor: isAdmin ? 'primary.main' : 'grey.200',
                        color: isAdmin ? 'primary.contrastText' : 'grey.700'
                    }}
                >
                    {isAdmin ? <VerifiedUserOutlinedIcon sx={{ fontSize: 18 }} /> : <PersonOutlineIcon sx={{ fontSize: 18 }} />}
                </Avatar>

                <Stack spacing={0.5} sx={{ alignItems: isAdmin ? 'flex-end' : 'flex-start', minWidth: 0 }}>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>
                        {getSenderLabel(dictionary, message.sender_type)}
                    </Typography>

                    <Paper
                        elevation={0}
                        sx={{
                            px: 2,
                            py: 1.25,
                            borderRadius: isAdmin ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
                            bgcolor: isAdmin ? 'primary.main' : 'background.paper',
                            color: isAdmin ? 'primary.contrastText' : 'text.primary',
                            border: isAdmin ? 'none' : '1px solid',
                            borderColor: 'divider',
                            boxShadow: isAdmin ? adminBubbleShadow : bubbleShadow
                        }}
                    >
                        <Typography
                            sx={{
                                whiteSpace: 'pre-wrap',
                                wordBreak: 'break-word',
                                lineHeight: 1.6,
                                // MuiTypography's body1 variant is themed to always use text.secondary —
                                // override explicitly here so the ADMIN bubble stays readable on its dark background.
                                color: isAdmin ? 'primary.contrastText' : 'text.primary'
                            }}
                        >
                            {message.content}
                        </Typography>
                    </Paper>

                    <Stack direction="row" spacing={0.5} alignItems="center">
                        <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                            {formatChatTime(message.sent_on_utc, locale)}
                        </Typography>
                        {isAdmin && <DoneAllIcon sx={{ fontSize: 14, color: 'text.disabled' }} />}
                    </Stack>
                </Stack>
            </Stack>
        </Box>
    )
}

const ChatSkeleton = () => (
    <Stack spacing={2.5}>
        <Box sx={{ display: 'flex', justifyContent: 'flex-start' }}>
            <Skeleton variant="rounded" width="58%" height={54} sx={{ borderRadius: '4px 16px 16px 16px' }} />
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Skeleton variant="rounded" width="46%" height={54} sx={{ borderRadius: '16px 4px 16px 16px' }} />
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'flex-start' }}>
            <Skeleton variant="rounded" width="40%" height={54} sx={{ borderRadius: '4px 16px 16px 16px' }} />
        </Box>
    </Stack>
)

const EmptyState = ({ dictionary }: { dictionary: ChatDictionary }) => (
    <Stack spacing={1} alignItems="center" justifyContent="center" sx={{ py: 5, textAlign: 'center' }}>
        <Box
            sx={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: theme => alpha(theme.palette.primary.main, 0.08)
            }}
        >
            <ForumOutlinedIcon sx={{ fontSize: 28, color: 'primary.main' }} />
        </Box>
        <Typography sx={{ fontWeight: 700 }}>{chatText(dictionary, 'empty_state')}</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 260 }}>
            {chatText(dictionary, 'empty_subtext')}
        </Typography>
    </Stack>
)

const UnavailableState = ({ dictionary }: { dictionary: ChatDictionary }) => (
    <Stack spacing={1} alignItems="center" justifyContent="center" sx={{ py: 5, textAlign: 'center' }}>
        <Box
            sx={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: theme => alpha(theme.palette.info.main, 0.1)
            }}
        >
            <ForumOutlinedIcon sx={{ fontSize: 28, color: 'info.main' }} />
        </Box>
        <Typography sx={{ fontWeight: 800 }}>{chatText(dictionary, 'feature_in_development_title')}</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 300 }}>
            {chatText(dictionary, 'feature_in_development_subtitle')}
        </Typography>
    </Stack>
)

const ServiceRequestChatPanel = ({
    dictionary,
    locale,
    serviceRequestId,
    requestType,
    status,
    isHiddenFromResident = false
}: Props) => {
    const isServiceRequest = requestType === SERVICE_REQUEST_TYPE
    const isClosed = CLOSED_STATUSES.includes(status)
    const canSend = isServiceRequest && !isClosed && SERVICE_REQUEST_MESSAGE_CREATE_API_READY

    const chat = useServiceRequestChat({
        dictionary,
        language: locale,
        serviceRequestId,
        canSend
    })

    // Chat is only meant for service requests (request_type = SR) — never render it for other types.
    if (!isServiceRequest) return null

    // This panel is the resident-facing conversation thread — the server already filters out
    // internal-only notes (is_internal = true) before the DTO ever reaches the browser.
    const visibleMessages = chat.messages

    const composerNote = isClosed
        ? chatText(dictionary, 'closed_notice')
        : !SERVICE_REQUEST_MESSAGE_CREATE_API_READY
            ? chatText(dictionary, 'send_not_ready')
            : null

    const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault()
            void chat.handleSend()
        }
    }

    return (
        <Paper
            sx={{
                borderRadius: 3,
                border: '1px solid',
                borderColor: 'divider',
                boxShadow: '0 2px 12px rgba(15, 23, 42, 0.05)',
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                overflow: 'hidden'
            }}
        >
            <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                sx={{ px: 3, py: 2, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}
            >
                <Stack direction="row" alignItems="center" gap={1.5}>
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
                        <MarkChatUnreadOutlinedIcon sx={{ fontSize: 20 }} />
                    </Box>
                    <Stack spacing={0}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 800, lineHeight: 1.3 }}>
                            {chatText(dictionary, 'panel_title')}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            {chatText(dictionary, 'panel_subtitle')}
                        </Typography>
                    </Stack>
                </Stack>
                <Tooltip title={chatText(dictionary, 'refresh')}>
                    <span>
                        <IconButton
                            size="small"
                            onClick={() => void chat.loadMessages()}
                            disabled={chat.loading || chat.unavailable}
                            sx={{ border: '1px solid', borderColor: 'divider' }}
                        >
                            <RefreshIcon fontSize="small" />
                        </IconButton>
                    </span>
                </Tooltip>
            </Stack>

            {isHiddenFromResident && (
                <Alert severity="warning" sx={{ borderRadius: 0 }}>
                    {chatText(dictionary, 'hidden_notice')}
                </Alert>
            )}

            <Box
                sx={{
                    flex: 1,
                    minHeight: 220,
                    maxHeight: 420,
                    overflowY: 'auto',
                    p: 2.5,
                    bgcolor: theme => (theme.palette.mode === 'dark' ? alpha(theme.palette.common.white, 0.02) : '#f8fafc')
                }}
            >
                {chat.loading ? (
                    <ChatSkeleton />
                ) : chat.unavailable ? (
                    <UnavailableState dictionary={dictionary} />
                ) : chat.error ? (
                    <Alert
                        severity="info"
                        action={
                            <Button color="inherit" size="small" onClick={() => void chat.loadMessages()}>
                                {commonText(dictionary, 'retry')}
                            </Button>
                        }
                    >
                        {chat.error}
                    </Alert>
                ) : visibleMessages.length === 0 ? (
                    <EmptyState dictionary={dictionary} />
                ) : (
                    <Stack spacing={2.5}>
                        {visibleMessages.map(message => (
                            <MessageBubble key={message.id} dictionary={dictionary} locale={locale} message={message} />
                        ))}
                    </Stack>
                )}
            </Box>

            {!chat.unavailable && (
                <Stack spacing={1} sx={{ p: 2.5, borderTop: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
                    <TextField
                        fullWidth
                        multiline
                        minRows={2}
                        maxRows={5}
                        placeholder={chatText(dictionary, 'input_placeholder')}
                        value={chat.draft}
                        onChange={event => chat.setDraft(event.target.value)}
                        onKeyDown={handleKeyDown}
                        disabled={!canSend || chat.sending}
                    />

                    {chat.sendError && (
                        <Alert severity="error">
                            {chatText(dictionary, 'send_failed')}: {chat.sendError}
                        </Alert>
                    )}

                    <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1.5} flexWrap="wrap">
                        <Typography variant="caption" color="text.secondary" sx={{ flex: 1, minWidth: 180 }}>
                            {composerNote}
                        </Typography>
                        <Button
                            variant="contained"
                            startIcon={<SendIcon />}
                            disabled={!canSend || !chat.draft.trim() || chat.sending}
                            onClick={() => void chat.handleSend()}
                        >
                            {chat.sending ? chatText(dictionary, 'sending') : chatText(dictionary, 'send')}
                        </Button>
                    </Stack>
                </Stack>
            )}
        </Paper>
    )
}

export default ServiceRequestChatPanel
