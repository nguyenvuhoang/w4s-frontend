'use client'

import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline'
import CloseIcon from '@mui/icons-material/Close'
import { Box, Dialog, DialogContent, DialogTitle, Divider, IconButton, Stack, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import { useEffect, useRef } from 'react'

import type { ResidentFeedbackDictionary, ResidentFeedbackItem } from '../types'
import { formatResidentFeedbackDateTime, getResidentFeedbackMessages, getResidentFeedbackMessagesSummary, residentFeedbackText } from './residentFeedbackHelpers'

type Props = {
    dictionary: ResidentFeedbackDictionary
    locale: string
    row: ResidentFeedbackItem | null
    onClose: () => void
}

const ResidentFeedbackMessagesDialog = ({ dictionary, locale, row, onClose }: Props) => {
    const messagesContainerRef = useRef<HTMLDivElement | null>(null)
    const messages = getResidentFeedbackMessages(row?.requests_message)
    const summary = getResidentFeedbackMessagesSummary(row?.requests_message)

    useEffect(() => {
        const frame = requestAnimationFrame(() => {
            const container = messagesContainerRef.current

            if (container) container.scrollTop = container.scrollHeight
        })

        return () => cancelAnimationFrame(frame)
    }, [row?.id, messages.length])

    return (
        <Dialog
            open={Boolean(row)}
            onClose={onClose}
            fullWidth
            maxWidth="md"
            PaperProps={{ sx: { width: 'min(720px, calc(100% - 32px))', borderRadius: 3 } }}
        >
            <DialogTitle sx={{ px: 3, py: 2 }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between" gap={2}>
                    <Stack direction="row" alignItems="center" gap={1.25} minWidth={0}>
                        <Box sx={theme => ({ display: 'grid', placeItems: 'center', width: 36, height: 36, borderRadius: 2, bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main' })}>
                            <ChatBubbleOutlineIcon fontSize="small" />
                        </Box>
                        <Typography variant="h6" noWrap sx={{ fontWeight: 750 }}>
                            {`${residentFeedbackText(dictionary, 'messages_dialog_title')}${row?.apartment_code ? ` · ${row.apartment_code}` : ''} (${summary?.count ?? messages.length})`}
                        </Typography>
                    </Stack>
                    <IconButton onClick={onClose} aria-label={residentFeedbackText(dictionary, 'close')} size="small">
                        <CloseIcon fontSize="small" />
                    </IconButton>
                </Stack>
            </DialogTitle>
            <Divider />
            <DialogContent sx={{ p: { xs: 1.5, sm: 2.5 }, bgcolor: 'grey.50' }}>
                {messages.length === 0 ? (
                    <Stack alignItems="center" justifyContent="center" spacing={1.25} sx={{ height: { xs: 360, sm: 460 }, color: 'text.secondary' }}>
                        <Box sx={{ display: 'grid', placeItems: 'center', width: 52, height: 52, borderRadius: '50%', bgcolor: 'grey.100' }}>
                            <ChatBubbleOutlineIcon />
                        </Box>
                        <Typography sx={{ fontWeight: 700 }}>{residentFeedbackText(dictionary, 'no_messages')}</Typography>
                    </Stack>
                ) : (
                    <Stack ref={messagesContainerRef} spacing={2} sx={{ height: { xs: 360, sm: 460 }, overflowY: 'auto', pr: 0.75 }}>
                        {messages.map((message, index) => {
                            const isAdmin = message.sender_type === 'ADMIN'

                            return (
                                <Box
                                    key={`${message.sent_on_utc ?? 'message'}-${index}`}
                                    sx={{ alignSelf: isAdmin ? 'flex-end' : 'flex-start', maxWidth: { xs: '88%', sm: '70%' } }}
                                >
                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, px: 0.5, fontWeight: 700, textAlign: isAdmin ? 'right' : 'left' }}>
                                        {isAdmin ? residentFeedbackText(dictionary, 'management_board') : residentFeedbackText(dictionary, 'resident')}
                                    </Typography>
                                    <Box sx={theme => ({ bgcolor: isAdmin ? alpha(theme.palette.primary.main, 0.1) : theme.palette.common.white, color: 'text.primary', border: 1, borderColor: isAdmin ? alpha(theme.palette.primary.main, 0.22) : 'grey.200', borderRadius: 2.5, boxShadow: '0 1px 2px rgba(16, 24, 40, 0.06)', px: 1.75, py: 1.25 })}>
                                        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', lineHeight: 1.55 }}>
                                            {message.content || '-'}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1, textAlign: 'right' }}>
                                            {formatResidentFeedbackDateTime(message.sent_on_utc, locale)}
                                        </Typography>
                                    </Box>
                                </Box>
                            )
                        })}
                    </Stack>
                )}
            </DialogContent>
        </Dialog>
    )
}

export default ResidentFeedbackMessagesDialog
