'use client'

import ApartmentIcon from '@mui/icons-material/Apartment'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import AssignmentIcon from '@mui/icons-material/Assignment'
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd'
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn'
import CancelIcon from '@mui/icons-material/Cancel'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import DoneAllIcon from '@mui/icons-material/DoneAll'
import StarRateIcon from '@mui/icons-material/StarRate'
import SubjectIcon from '@mui/icons-material/Subject'
import { Alert, Box, Breadcrumbs, Button, Chip, Divider, Grid, Paper, Snackbar, Stack, Tooltip, Typography } from '@mui/material'
import type { Locale } from '@/configs/i18n'
import Link from 'next/link'
import { useMemo, useState } from 'react'

import ContentWrapper from '@/features/dynamicform/components/layout/content-wrapper'
import { useAppContext } from '@contexts/AppContext'

import ServiceRequestAttachmentsSection from './components/ServiceRequestAttachmentsSection'
import ServiceRequestChatPanel from '@/features/service-request-chat/components/ServiceRequestChatPanel'
import ServiceRequestStatusLogsSection from './components/ServiceRequestStatusLogsSection'
import ServiceRequestStatusConfirmDialog from './components/ServiceRequestStatusConfirmDialog'
import {
    commonText,
    displayText,
    formatServiceRequestDate,
    getBooleanLabel,
    getPriorityColor,
    getPriorityLabel,
    getRequestStatusColor,
    getRequestStatusLabel,
    getRequestTypeLabel,
    serviceRequestsText
} from './components/serviceRequestHelpers'
import { useServiceRequestDetail } from './hooks/useServiceRequestDetail'
import { serviceRequestService } from './services/serviceRequestService'
import type { ServiceRequestsDictionary } from './types'
import { ServiceRequestWorkflowError } from './types'

type Props = {
    dictionary: ServiceRequestsDictionary
    locale: Locale
    sessiontoken?: string
    requestCode: string
}

const CLOSED_STATUSES = ['COMPLETED', 'CANCELLED', 'D']
const IN_PROGRESS_STATUSES = ['IN_PROGRESS', 'IN_PROCESS']
// Statuses for which the "Accept processing" button should never show — either the request is
// already being handled (IN_PROGRESS / legacy IN_PROCESS naming) or it has moved past that stage.
const HIDDEN_ACCEPT_STATUSES = [...IN_PROGRESS_STATUSES, 'PROCESSED', 'COMPLETED', 'CANCELLED', 'D']
const ACCEPT_HANDLING_STATUS = 'IN_PROGRESS'
const ACCEPT_HANDLING_DEFAULT_NOTE = 'Tiếp nhận xử lý kiểm tra trước'
const MARK_PROCESSED_STATUS = 'PROCESSED'
const MARK_PROCESSED_DEFAULT_NOTE = 'Đã xử lý'

const DetailRow = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <Grid size={{ xs: 12, md: 6 }}>
        <Stack spacing={0.75}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase' }}>
                {label}
            </Typography>
            <Box sx={{ minHeight: 28, display: 'flex', alignItems: 'center' }}>
                {children}
            </Box>
        </Stack>
    </Grid>
)

const BlockHeader = ({ icon, title }: { icon: React.ReactNode; title: string }) => (
    <Stack direction="row" alignItems="center" gap={1}>
        {icon}
        <Typography variant="h6" sx={{ fontWeight: 800 }}>{title}</Typography>
    </Stack>
)

const BooleanIconValue = ({ value, dictionary }: { value: boolean | null | undefined; dictionary: ServiceRequestsDictionary }) => {
    if (value === null || value === undefined) return <Typography>-</Typography>

    const label = getBooleanLabel(dictionary, value)

    return (
        <Tooltip title={label}>
            <Stack direction="row" alignItems="center" gap={0.75}>
                {value
                    ? <CheckCircleIcon color="success" fontSize="small" />
                    : <CancelIcon color="error" fontSize="small" />}
                <Typography variant="body2" color="text.secondary">{label}</Typography>
            </Stack>
        </Tooltip>
    )
}

const ServiceRequestDetailPage = ({ dictionary, locale, sessiontoken, requestCode }: Props) => {
    const detail = useServiceRequestDetail({ dictionary, sessiontoken, language: locale, requestCode })
    const { userInfo } = useAppContext()
    const listHref = `/${locale}/service-requests/service-requests`
    const request = detail.request

    // Current user's code comes from the app-wide AppContext (userInfo) — never from the URL,
    // never decoded from the session token, and never derived from handler_user_code itself.
    // SystemData doesn't declare `user_code` at the top level, so prefer it defensively in case the
    // backend payload includes it, then fall back to the user's own role entry (role[].user_code),
    // which the WF_BO_APP_INFO response always fills in for the logged-in user.
    const currentUserCode = useMemo(() => {
        const info: any = userInfo
        const code = info?.user_code ?? info?.role?.[0]?.user_code ?? null

        return typeof code === 'string' && code.trim() ? code.trim() : null
    }, [userInfo])

    const isAssignedToCurrentUser = Boolean(
        request?.handler_user_code
        && currentUserCode
        && request.handler_user_code.trim() === currentUserCode
    )

    const canAcceptHandling = Boolean(
        request
        && request.request_type === 'SR'
        && isAssignedToCurrentUser
        && !HIDDEN_ACCEPT_STATUSES.includes(request.status)
    )

    const canMarkProcessed = Boolean(
        request
        && request.request_type === 'SR'
        && isAssignedToCurrentUser
        && IN_PROGRESS_STATUSES.includes(request.status)
    )

    const [acceptOpen, setAcceptOpen] = useState(false)
    const [acceptLoading, setAcceptLoading] = useState(false)
    const [acceptError, setAcceptError] = useState<string | null>(null)
    const [markOpen, setMarkOpen] = useState(false)
    const [markLoading, setMarkLoading] = useState(false)
    const [markError, setMarkError] = useState<string | null>(null)
    const [notice, setNotice] = useState<{ severity: 'success' | 'error'; message: string } | null>(null)

    const handleOpenAcceptHandling = () => {
        setAcceptError(null)
        setAcceptOpen(true)
    }

    const handleCloseAcceptHandling = () => {
        if (acceptLoading) return
        setAcceptOpen(false)
        setAcceptError(null)
    }

    const handleConfirmAcceptHandling = async () => {
        if (!request?.request_code) {
            setAcceptError(serviceRequestsText(dictionary, 'accept_handling_missing_code'))

            return
        }

        if (!isAssignedToCurrentUser) {
            setAcceptError(serviceRequestsText(dictionary, 'accept_handling_not_assigned'))

            return
        }

        if (CLOSED_STATUSES.includes(request.status)) {
            setAcceptError(serviceRequestsText(dictionary, 'accept_handling_closed'))

            return
        }

        setAcceptLoading(true)
        setAcceptError(null)

        try {
            const response = await serviceRequestService.updateServiceRequestStatus({
                sessiontoken,
                language: locale,
                fields: {
                    request_code: request.request_code,
                    request_status: ACCEPT_HANDLING_STATUS,
                    internal_note: ACCEPT_HANDLING_DEFAULT_NOTE
                }
            })

            setAcceptOpen(false)
            detail.patchStatus(response.status)
            setNotice({ severity: 'success', message: serviceRequestsText(dictionary, 'accept_handling_success') })
        } catch (caught) {
            const message = caught instanceof ServiceRequestWorkflowError || caught instanceof Error
                ? caught.message
                : serviceRequestsText(dictionary, 'accept_handling_failed')

            setAcceptError(message)
        } finally {
            setAcceptLoading(false)
        }
    }

    const handleOpenMarkProcessed = () => {
        setMarkError(null)
        setMarkOpen(true)
    }

    const handleCloseMarkProcessed = () => {
        if (markLoading) return
        setMarkOpen(false)
        setMarkError(null)
    }

    const handleConfirmMarkProcessed = async () => {
        if (!request?.request_code) {
            setMarkError(serviceRequestsText(dictionary, 'accept_handling_missing_code'))

            return
        }

        if (!isAssignedToCurrentUser) {
            setMarkError(serviceRequestsText(dictionary, 'accept_handling_not_assigned'))

            return
        }

        setMarkLoading(true)
        setMarkError(null)

        try {
            const response = await serviceRequestService.updateServiceRequestStatus({
                sessiontoken,
                language: locale,
                fields: {
                    request_code: request.request_code,
                    request_status: MARK_PROCESSED_STATUS,
                    internal_note: MARK_PROCESSED_DEFAULT_NOTE
                }
            })

            setMarkOpen(false)
            detail.patchStatus(response.status)
            setNotice({ severity: 'success', message: serviceRequestsText(dictionary, 'mark_processed_success') })
        } catch (caught) {
            const message = caught instanceof ServiceRequestWorkflowError || caught instanceof Error
                ? caught.message
                : serviceRequestsText(dictionary, 'mark_processed_failed')

            setMarkError(message)
        } finally {
            setMarkLoading(false)
        }
    }

    return (
        <ContentWrapper
            title={serviceRequestsText(dictionary, 'detail_page_title')}
            description={serviceRequestsText(dictionary, 'detail_page_subtitle')}
            icon={<AssignmentIcon sx={{ fontSize: 40, color: 'primary.main' }} />}
            dictionary={dictionary}
            issearch
        >
            <Stack spacing={3} sx={{ mt: 3 }}>
                <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ md: 'flex-start' }} gap={2}>
                    <Stack spacing={1}>
                        <Breadcrumbs>
                            <Typography color="text.secondary">{serviceRequestsText(dictionary, 'service_requests')}</Typography>
                            <Link href={listHref} style={{ color: 'inherit', textDecoration: 'none' }}>
                                {serviceRequestsText(dictionary, 'breadcrumb_list')}
                            </Link>
                            <Typography color="text.primary">{serviceRequestsText(dictionary, 'detail_page_title')}</Typography>
                        </Breadcrumbs>
                        <Stack direction="row" alignItems="center" gap={1.5} flexWrap="wrap">
                            <Typography variant="h4" sx={{ fontWeight: 900 }}>
                                {serviceRequestsText(dictionary, 'detail_page_title')}
                            </Typography>
                            {request && (
                                <>
                                    <Chip size="small" color={getRequestStatusColor(request.status)} label={getRequestStatusLabel(dictionary, request.status)} />
                                    <Chip size="small" color={getPriorityColor(request.priority)} label={getPriorityLabel(dictionary, request.priority)} />
                                </>
                            )}
                        </Stack>
                        {request && (
                            <Typography variant="body2" color="text.secondary">
                                {serviceRequestsText(dictionary, 'request_code')}: <strong>{displayText(request.request_code)}</strong>
                            </Typography>
                        )}
                    </Stack>

                    <Stack direction="row" gap={1.5} flexWrap="wrap" alignItems="center">
                        {canAcceptHandling && (
                            <Button
                                variant="contained"
                                startIcon={<AssignmentTurnedInIcon />}
                                onClick={handleOpenAcceptHandling}
                            >
                                {serviceRequestsText(dictionary, 'accept_handling')}
                            </Button>
                        )}
                        {canMarkProcessed && (
                            <Button
                                variant="contained"
                                color="success"
                                startIcon={<DoneAllIcon />}
                                onClick={handleOpenMarkProcessed}
                            >
                                {serviceRequestsText(dictionary, 'mark_processed')}
                            </Button>
                        )}
                        <Button component={Link} href={listHref} variant="outlined" startIcon={<ArrowBackIcon />}>
                            {serviceRequestsText(dictionary, 'back_to_list')}
                        </Button>
                    </Stack>
                </Stack>

                {detail.loading && (
                    <Stack spacing={3}>
                        {Array.from({ length: 2 }).map((_, blockIndex) => (
                            <Paper key={blockIndex} sx={{ p: 3, borderRadius: 2, border: 1, borderColor: 'divider' }}>
                                <Stack spacing={2}>
                                    <Box sx={{ width: 220, height: 28, bgcolor: 'action.hover', borderRadius: 1 }} />
                                    <Grid container spacing={3}>
                                        {Array.from({ length: 4 }).map((__, fieldIndex) => (
                                            <Grid key={fieldIndex} size={{ xs: 12, md: 6 }}>
                                                <Box sx={{ width: '60%', height: 14, bgcolor: 'action.hover', borderRadius: 1, mb: 1 }} />
                                                <Box sx={{ width: '90%', height: 22, bgcolor: 'action.hover', borderRadius: 1 }} />
                                            </Grid>
                                        ))}
                                    </Grid>
                                </Stack>
                            </Paper>
                        ))}
                    </Stack>
                )}

                {!detail.loading && detail.error && (
                    <Alert
                        severity="error"
                        action={
                            <Button color="inherit" size="small" onClick={() => void detail.loadDetail()}>
                                {commonText(dictionary, 'retry')}
                            </Button>
                        }
                    >
                        {detail.error}
                    </Alert>
                )}

                {!detail.loading && !detail.error && detail.wrongType && (
                    <Alert severity="warning">
                        {serviceRequestsText(dictionary, 'wrong_service_request_type')}
                    </Alert>
                )}

                {!detail.loading && !detail.error && !detail.wrongType && !request && (
                    <Alert severity="info">
                        {serviceRequestsText(dictionary, 'detail_not_found')}
                    </Alert>
                )}

                {!detail.loading && request && (
                    <Grid container spacing={3} alignItems="flex-start">
                        <Grid size={{ xs: 12, md: 8 }}>
                            <Stack spacing={3}>
                                <Paper sx={{ p: 3, borderRadius: 2, border: 1, borderColor: 'divider' }}>
                                    <Stack spacing={2.5}>
                                        <BlockHeader icon={<SubjectIcon color="primary" />} title={serviceRequestsText(dictionary, 'block_request_info')} />
                                        <Divider />
                                        <Grid container spacing={3}>
                                            <DetailRow label={serviceRequestsText(dictionary, 'request_code')}>
                                                <Typography sx={{ fontWeight: 700 }}>{displayText(request.request_code)}</Typography>
                                            </DetailRow>
                                            <DetailRow label={serviceRequestsText(dictionary, 'request_type')}>
                                                <Typography>{getRequestTypeLabel(dictionary, request.request_type)}</Typography>
                                            </DetailRow>
                                            <DetailRow label={serviceRequestsText(dictionary, 'request_title')}>
                                                <Typography>{displayText(request.title)}</Typography>
                                            </DetailRow>
                                            <Grid size={{ xs: 12 }}>
                                                <Stack spacing={0.75}>
                                                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase' }}>
                                                        {serviceRequestsText(dictionary, 'content')}
                                                    </Typography>
                                                    <Typography sx={{ whiteSpace: 'pre-wrap' }}>{displayText(request.content)}</Typography>
                                                </Stack>
                                            </Grid>
                                            <DetailRow label={serviceRequestsText(dictionary, 'request_status')}>
                                                <Chip size="small" color={getRequestStatusColor(request.status)} label={getRequestStatusLabel(dictionary, request.status)} />
                                            </DetailRow>
                                            <DetailRow label={serviceRequestsText(dictionary, 'priority')}>
                                                <Chip size="small" color={getPriorityColor(request.priority)} label={getPriorityLabel(dictionary, request.priority)} />
                                            </DetailRow>
                                            <DetailRow label={serviceRequestsText(dictionary, 'scheduled_date')}>
                                                <Typography>{formatServiceRequestDate(request.scheduled_date, locale)}</Typography>
                                            </DetailRow>
                                            <DetailRow label={serviceRequestsText(dictionary, 'completed_on')}>
                                                <Typography>{formatServiceRequestDate(request.completed_on_utc, locale)}</Typography>
                                            </DetailRow>
                                        </Grid>
                                    </Stack>
                                </Paper>

                                <ServiceRequestAttachmentsSection
                                    dictionary={dictionary}
                                    attachments={request.attachments}
                                />

                                <Paper sx={{ p: 3, borderRadius: 2, border: 1, borderColor: 'divider' }}>
                                    <Stack spacing={2.5}>
                                        <BlockHeader icon={<ApartmentIcon color="primary" />} title={serviceRequestsText(dictionary, 'block_resident_info')} />
                                        <Divider />
                                        <Grid container spacing={3}>
                                            <DetailRow label={serviceRequestsText(dictionary, 'resident_id')}>
                                                <Typography>{displayText(request.resident_id)}</Typography>
                                            </DetailRow>
                                            <DetailRow label={serviceRequestsText(dictionary, 'user_code')}>
                                                <Typography>{displayText(request.user_code)}</Typography>
                                            </DetailRow>
                                            <DetailRow label={serviceRequestsText(dictionary, 'apartment_id')}>
                                                <Typography>{displayText(request.apartment_id)}</Typography>
                                            </DetailRow>
                                            <DetailRow label={serviceRequestsText(dictionary, 'project_id')}>
                                                <Typography>{displayText(request.project_id)}</Typography>
                                            </DetailRow>
                                            <DetailRow label={serviceRequestsText(dictionary, 'service_request_category_id')}>
                                                <Typography>{displayText(request.service_request_category_id)}</Typography>
                                            </DetailRow>
                                        </Grid>
                                    </Stack>
                                </Paper>

                                <Paper sx={{ p: 3, borderRadius: 2, border: 1, borderColor: 'divider' }}>
                                    <Stack spacing={2.5}>
                                        <BlockHeader icon={<AssignmentIndIcon color="primary" />} title={serviceRequestsText(dictionary, 'block_internal_handling')} />
                                        <Divider />
                                        <Grid container spacing={3}>
                                            <DetailRow label={serviceRequestsText(dictionary, 'handler_user_code')}>
                                                <Typography>{displayText(request.handler_user_code)}</Typography>
                                            </DetailRow>
                                            <DetailRow label={serviceRequestsText(dictionary, 'supervisor_user_code')}>
                                                <Typography>{displayText(request.supervisor_user_code)}</Typography>
                                            </DetailRow>
                                            <DetailRow label={serviceRequestsText(dictionary, 'internal_note')}>
                                                <Typography>{displayText(request.internal_note)}</Typography>
                                            </DetailRow>
                                            <DetailRow label={serviceRequestsText(dictionary, 'cancel_reason')}>
                                                <Typography>{displayText(request.cancel_reason)}</Typography>
                                            </DetailRow>
                                            <DetailRow label={serviceRequestsText(dictionary, 'is_hidden_from_resident')}>
                                                <BooleanIconValue value={request.is_hidden_from_resident} dictionary={dictionary} />
                                            </DetailRow>
                                            <DetailRow label={serviceRequestsText(dictionary, 'is_visible_on_app')}>
                                                <BooleanIconValue value={request.is_visible_on_app} dictionary={dictionary} />
                                            </DetailRow>
                                        </Grid>
                                    </Stack>
                                </Paper>

                                <Paper sx={{ p: 3, borderRadius: 2, border: 1, borderColor: 'divider' }}>
                                    <Stack spacing={2.5}>
                                        <BlockHeader icon={<StarRateIcon color="primary" />} title={serviceRequestsText(dictionary, 'block_rating')} />
                                        <Divider />
                                        <Grid container spacing={3}>
                                            <DetailRow label={serviceRequestsText(dictionary, 'rating')}>
                                                <Typography>{request.rating ?? '-'}</Typography>
                                            </DetailRow>
                                            <DetailRow label={serviceRequestsText(dictionary, 'rating_comment')}>
                                                <Typography>{displayText(request.rating_comment)}</Typography>
                                            </DetailRow>
                                        </Grid>
                                    </Stack>
                                </Paper>

                                <ServiceRequestStatusLogsSection
                                    dictionary={dictionary}
                                    locale={locale}
                                    statusLogs={request.status_logs}
                                />
                            </Stack>
                        </Grid>

                        <Grid size={{ xs: 12, md: 4 }}>
                            <ServiceRequestChatPanel
                                dictionary={dictionary}
                                locale={locale}
                                serviceRequestId={request.id}
                                requestType={request.request_type}
                                status={request.status}
                                isHiddenFromResident={request.is_hidden_from_resident}
                            />
                        </Grid>
                    </Grid>
                )}
            </Stack>

            {request && (
                <ServiceRequestStatusConfirmDialog
                    dictionary={dictionary}
                    open={acceptOpen}
                    title={serviceRequestsText(dictionary, 'accept_handling')}
                    message={serviceRequestsText(dictionary, 'accept_handling_confirm_message')}
                    confirmLabel={serviceRequestsText(dictionary, 'confirm_accept_handling')}
                    icon={<AssignmentTurnedInIcon />}
                    requestCode={request.request_code}
                    loading={acceptLoading}
                    error={acceptError}
                    onClose={handleCloseAcceptHandling}
                    onConfirm={() => void handleConfirmAcceptHandling()}
                />
            )}

            {request && (
                <ServiceRequestStatusConfirmDialog
                    dictionary={dictionary}
                    open={markOpen}
                    title={serviceRequestsText(dictionary, 'confirm_mark_processed_title')}
                    message={serviceRequestsText(dictionary, 'confirm_mark_processed_message')}
                    confirmLabel={commonText(dictionary, 'confirm')}
                    icon={<DoneAllIcon />}
                    requestCode={request.request_code}
                    loading={markLoading}
                    error={markError}
                    onClose={handleCloseMarkProcessed}
                    onConfirm={() => void handleConfirmMarkProcessed()}
                />
            )}

            <Snackbar
                open={Boolean(notice)}
                autoHideDuration={4000}
                onClose={() => setNotice(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert
                    variant="filled"
                    severity={notice?.severity ?? 'success'}
                    onClose={() => setNotice(null)}
                >
                    {notice?.message}
                </Alert>
            </Snackbar>
        </ContentWrapper>
    )
}

export default ServiceRequestDetailPage
