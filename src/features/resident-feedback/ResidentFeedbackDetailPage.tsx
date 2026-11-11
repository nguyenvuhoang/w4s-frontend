'use client'

import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import AttachFileIcon from '@mui/icons-material/AttachFile'
import HistoryIcon from '@mui/icons-material/History'
import ImageIcon from '@mui/icons-material/Image'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import MessageIcon from '@mui/icons-material/Message'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import StarRateIcon from '@mui/icons-material/StarRate'
import SubjectIcon from '@mui/icons-material/Subject'
import { Alert, Box, Button, Chip, Divider, Grid, IconButton, Paper, Stack, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import Link from 'next/link'

import ContentWrapper from '@/features/dynamicform/components/layout/content-wrapper'

import type { ResidentFeedbackDetail, ResidentFeedbackDictionary } from './types'
import {
    displayResidentFeedbackText,
    formatResidentFeedbackDate,
    formatResidentFeedbackDateTime,
    getFeedbackPriorityColor,
    getFeedbackPriorityLabel,
    getFeedbackRequestTypeLabel,
    getFeedbackStatusColor,
    getFeedbackStatusLabel,
    residentFeedbackText
} from './components/residentFeedbackHelpers'

type Props = {
    dictionary: ResidentFeedbackDictionary
    locale: string
    request: ResidentFeedbackDetail | null
    error?: { message: string; executionId?: string } | null
    backHref: string
    requestCode: string
}

const DetailField = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <Grid size={{ xs: 12, md: 6 }}>
        <Stack spacing={0.75}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800, textTransform: 'uppercase' }}>
                {label}
            </Typography>
            <Box sx={{ minHeight: 28, display: 'flex', alignItems: 'center', minWidth: 0 }}>
                {children}
            </Box>
        </Stack>
    </Grid>
)

const Section = ({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) => (
    <Paper sx={{ p: { xs: 2, md: 3 }, borderRadius: 2, border: 1, borderColor: 'divider' }}>
        <Stack spacing={2.25}>
            <Stack direction="row" alignItems="center" gap={1}>
                {icon}
                <Typography variant="h6" sx={{ fontWeight: 800 }}>
                    {title}
                </Typography>
            </Stack>
            <Divider />
            {children}
        </Stack>
    </Paper>
)

const EmptySection = ({ text }: { text: string }) => (
    <Stack alignItems="center" justifyContent="center" spacing={1} sx={{ py: 4, color: 'text.secondary' }}>
        <InfoOutlinedIcon />
        <Typography variant="body2" sx={{ fontWeight: 700 }}>
            {text}
        </Typography>
    </Stack>
)

const isImageAttachment = (fileType: string) => fileType.toLowerCase().startsWith('image/')

const ResidentFeedbackDetailPage = ({ dictionary, locale, request, error = null, backHref, requestCode }: Props) => (
    <ContentWrapper
        title={residentFeedbackText(dictionary, 'detail_page_title')}
        description={residentFeedbackText(dictionary, 'detail_page_subtitle')}
        icon={<SubjectIcon sx={{ fontSize: 40, color: 'primary.main' }} />}
        dictionary={dictionary}
        issearch
    >
        <Stack spacing={3} sx={{ mt: 3 }}>
            <Stack direction={{ xs: 'column', md: 'row' }} alignItems={{ xs: 'flex-start', md: 'center' }} justifyContent="space-between" gap={2}>
                <Stack spacing={0.75} minWidth={0}>
                    <Typography variant="h4" sx={{ fontWeight: 900, wordBreak: 'break-word' }}>
                        {residentFeedbackText(dictionary, 'detail_page_title')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ wordBreak: 'break-word' }}>
                        {residentFeedbackText(dictionary, 'request_code')}: <strong>{displayResidentFeedbackText(request?.request_code ?? requestCode)}</strong>
                    </Typography>
                </Stack>
                <Button component={Link} href={backHref} variant="outlined" startIcon={<ArrowBackIcon />}>
                    {residentFeedbackText(dictionary, 'back_to_list')}
                </Button>
            </Stack>

            {error && (
                <Alert severity="error">
                    {error.message}
                    {error.executionId && ` ${residentFeedbackText(dictionary, 'error_reference')}: ${error.executionId}`}
                </Alert>
            )}

            {!error && !request && (
                <Alert severity="info">{residentFeedbackText(dictionary, 'detail_not_found')}</Alert>
            )}

            {!error && request && (
                <Stack spacing={3}>
                    <Section icon={<InfoOutlinedIcon color="primary" />} title={residentFeedbackText(dictionary, 'detail_section_info')}>
                        <Grid container spacing={3}>
                            <DetailField label={residentFeedbackText(dictionary, 'request_code')}>
                                <Typography sx={{ fontWeight: 800 }}>{displayResidentFeedbackText(request.request_code)}</Typography>
                            </DetailField>
                            <DetailField label={residentFeedbackText(dictionary, 'project_code')}>
                                <Typography>{displayResidentFeedbackText(request.project_code)}</Typography>
                            </DetailField>
                            <DetailField label={residentFeedbackText(dictionary, 'apartment_code')}>
                                <Typography>{displayResidentFeedbackText(request.apartment_code)}</Typography>
                            </DetailField>
                            <DetailField label={residentFeedbackText(dictionary, 'resident_code')}>
                                <Typography>{displayResidentFeedbackText(request.resident_code)}</Typography>
                            </DetailField>
                            <DetailField label={residentFeedbackText(dictionary, 'request_type')}>
                                <Typography>{getFeedbackRequestTypeLabel(dictionary, request.request_type)}</Typography>
                            </DetailField>
                            <DetailField label={residentFeedbackText(dictionary, 'category_code')}>
                                <Typography>{displayResidentFeedbackText(request.category_code)}</Typography>
                            </DetailField>
                            <Grid size={{ xs: 12 }}>
                                <Stack spacing={0.75}>
                                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800, textTransform: 'uppercase' }}>
                                        {residentFeedbackText(dictionary, 'request_title')}
                                    </Typography>
                                    <Typography sx={{ fontWeight: 700, wordBreak: 'break-word' }}>{displayResidentFeedbackText(request.title)}</Typography>
                                </Stack>
                            </Grid>
                            <Grid size={{ xs: 12 }}>
                                <Stack spacing={0.75}>
                                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800, textTransform: 'uppercase' }}>
                                        {residentFeedbackText(dictionary, 'content')}
                                    </Typography>
                                    <Typography sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                                        {displayResidentFeedbackText(request.content)}
                                    </Typography>
                                </Stack>
                            </Grid>
                            <DetailField label={residentFeedbackText(dictionary, 'request_status')}>
                                <Chip size="small" color={getFeedbackStatusColor(request.status)} label={getFeedbackStatusLabel(dictionary, request.status)} />
                            </DetailField>
                            <DetailField label={residentFeedbackText(dictionary, 'priority')}>
                                <Chip size="small" color={getFeedbackPriorityColor(request.priority)} label={getFeedbackPriorityLabel(dictionary, request.priority)} />
                            </DetailField>
                            <DetailField label={residentFeedbackText(dictionary, 'scheduled_date')}>
                                <Typography>{formatResidentFeedbackDate(request.scheduled_date, locale)}</Typography>
                            </DetailField>
                            <DetailField label={residentFeedbackText(dictionary, 'completed_on')}>
                                <Typography>{formatResidentFeedbackDate(request.completed_on_utc, locale)}</Typography>
                            </DetailField>
                            <DetailField label={residentFeedbackText(dictionary, 'cancel_reason')}>
                                <Typography>{displayResidentFeedbackText(request.cancel_reason)}</Typography>
                            </DetailField>
                        </Grid>
                    </Section>

                    <Section icon={<StarRateIcon color="primary" />} title={residentFeedbackText(dictionary, 'detail_section_rating')}>
                        <Grid container spacing={3}>
                            <DetailField label={residentFeedbackText(dictionary, 'rating')}>
                                <Typography>{displayResidentFeedbackText(request.rating)}</Typography>
                            </DetailField>
                            <DetailField label={residentFeedbackText(dictionary, 'rating_comment')}>
                                <Typography>{displayResidentFeedbackText(request.rating_comment)}</Typography>
                            </DetailField>
                        </Grid>
                    </Section>

                    <Section icon={<AttachFileIcon color="primary" />} title={residentFeedbackText(dictionary, 'attachments')}>
                        {request.attachments.length === 0 ? (
                            <EmptySection text={residentFeedbackText(dictionary, 'no_attachments')} />
                        ) : (
                            <Grid container spacing={2}>
                                {request.attachments.map((attachment, index) => {
                                    const image = isImageAttachment(attachment.file_type)

                                    return (
                                        <Grid key={`${attachment.file_url}-${index}`} size={{ xs: 12, sm: 6, md: 4 }}>
                                            <Paper sx={{ p: 1.5, borderRadius: 2, border: 1, borderColor: 'divider', height: '100%' }}>
                                                <Stack spacing={1.25}>
                                                    <Box
                                                        component="a"
                                                        href={attachment.file_url || '#'}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        sx={theme => ({
                                                            display: 'grid',
                                                            placeItems: 'center',
                                                            height: 148,
                                                            borderRadius: 1.5,
                                                            bgcolor: alpha(theme.palette.primary.main, 0.06),
                                                            overflow: 'hidden'
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
                                                            <ImageIcon color="primary" />
                                                        )}
                                                    </Box>
                                                    <Stack direction="row" alignItems="flex-start" justifyContent="space-between" gap={1}>
                                                        <Typography variant="body2" sx={{ fontWeight: 700, wordBreak: 'break-word' }}>
                                                            {displayResidentFeedbackText(attachment.file_name)}
                                                        </Typography>
                                                        {attachment.file_url && (
                                                            <IconButton
                                                                component="a"
                                                                href={attachment.file_url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                size="small"
                                                                aria-label={residentFeedbackText(dictionary, 'open_attachment')}
                                                            >
                                                                <OpenInNewIcon fontSize="small" />
                                                            </IconButton>
                                                        )}
                                                    </Stack>
                                                    <Chip
                                                        size="small"
                                                        variant="outlined"
                                                        color={attachment.is_result_attachment ? 'success' : 'default'}
                                                        label={residentFeedbackText(dictionary, attachment.is_result_attachment ? 'result_attachment' : 'request_attachment')}
                                                        sx={{ alignSelf: 'flex-start' }}
                                                    />
                                                </Stack>
                                            </Paper>
                                        </Grid>
                                    )
                                })}
                            </Grid>
                        )}
                    </Section>

                    <Section icon={<MessageIcon color="primary" />} title={residentFeedbackText(dictionary, 'messages_dialog_title')}>
                        {request.messages.length === 0 ? (
                            <EmptySection text={residentFeedbackText(dictionary, 'no_messages')} />
                        ) : (
                            <Stack spacing={1.5}>
                                {request.messages.map((message, index) => (
                                    <Paper key={`${message.sent_on_utc ?? 'message'}-${index}`} sx={{ p: 2, borderRadius: 2, border: 1, borderColor: 'divider' }}>
                                        <Stack spacing={0.75}>
                                            <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" gap={0.5}>
                                                <Typography variant="body2" sx={{ fontWeight: 800 }}>
                                                    {message.sender_type === 'ADMIN' ? residentFeedbackText(dictionary, 'management_board') : residentFeedbackText(dictionary, 'resident')}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {formatResidentFeedbackDateTime(message.sent_on_utc, locale)}
                                                </Typography>
                                            </Stack>
                                            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                                                {displayResidentFeedbackText(message.content)}
                                            </Typography>
                                        </Stack>
                                    </Paper>
                                ))}
                            </Stack>
                        )}
                    </Section>

                    <Section icon={<HistoryIcon color="primary" />} title={residentFeedbackText(dictionary, 'status_logs')}>
                        {request.status_logs.length === 0 ? (
                            <EmptySection text={residentFeedbackText(dictionary, 'no_status_logs')} />
                        ) : (
                            <Stack spacing={1.5}>
                                {request.status_logs.map((log, index) => (
                                    <Paper key={`${log.created_on_utc ?? 'status'}-${index}`} sx={{ p: 2, borderRadius: 2, border: 1, borderColor: 'divider' }}>
                                        <Stack spacing={0.75}>
                                            <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" gap={0.5}>
                                                <Chip size="small" color={getFeedbackStatusColor(log.status)} label={getFeedbackStatusLabel(dictionary, log.status)} sx={{ alignSelf: 'flex-start' }} />
                                                <Typography variant="caption" color="text.secondary">
                                                    {formatResidentFeedbackDateTime(log.created_on_utc, locale)}
                                                </Typography>
                                            </Stack>
                                            <Typography variant="body2" color="text.secondary">
                                                {residentFeedbackText(dictionary, 'created_by')}: {displayResidentFeedbackText(log.created_by)}
                                            </Typography>
                                            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                                                {displayResidentFeedbackText(log.note)}
                                            </Typography>
                                        </Stack>
                                    </Paper>
                                ))}
                            </Stack>
                        )}
                    </Section>
                </Stack>
            )}
        </Stack>
    </ContentWrapper>
)

export default ResidentFeedbackDetailPage
