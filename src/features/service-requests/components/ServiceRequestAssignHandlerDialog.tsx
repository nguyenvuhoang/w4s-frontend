import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import CloseIcon from '@mui/icons-material/Close'
import PersonSearchIcon from '@mui/icons-material/PersonSearch'
import SearchIcon from '@mui/icons-material/Search'
import SendIcon from '@mui/icons-material/Send'
import {
    Alert,
    Avatar,
    Box,
    Button,
    Chip,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    IconButton,
    InputAdornment,
    Paper,
    Skeleton,
    Stack,
    TextField,
    Typography
} from '@mui/material'
import type { Locale } from '@/configs/i18n'
import { useEffect, useRef, useState } from 'react'

import { getDetailFullName, staffService } from '@/features/staffs/services/staffService'
import type { StaffModel } from '@/features/staffs/types'

import type { ServiceRequestDetail, ServiceRequestItem, ServiceRequestsDictionary } from '../types'
import {
    commonText,
    displayText,
    getPriorityColor,
    getPriorityLabel,
    getRequestStatusColor,
    getRequestStatusLabel,
    serviceRequestsText
} from './serviceRequestHelpers'

type Props = {
    dictionary: ServiceRequestsDictionary
    locale: Locale
    sessiontoken?: string
    request: ServiceRequestItem
    detail: ServiceRequestDetail | null
    detailLoading: boolean
    detailError: string | null
    onRetryDetail: () => void
    submitLoading: boolean
    submitError: string | null
    onClose: () => void
    onSubmit: (staff: StaffModel) => void
}

const getStaffFullName = (staff: StaffModel) => (
    getDetailFullName(staff) || staff.user_name || staff.login_name || '-'
)

const getStaffInitial = (staff: StaffModel) => {
    const name = getStaffFullName(staff)

    return name && name !== '-' ? name.charAt(0).toUpperCase() : '?'
}

const StaffSkeletonRow = () => (
    <Stack direction="row" spacing={1.5} alignItems="center" sx={{ p: 1.5 }}>
        <Skeleton variant="circular" width={40} height={40} />
        <Stack spacing={0.5} sx={{ flex: 1 }}>
            <Skeleton width="40%" />
            <Skeleton width="60%" />
        </Stack>
    </Stack>
)

const ServiceRequestAssignHandlerDialog = ({
    dictionary,
    locale,
    sessiontoken,
    request,
    detail,
    detailLoading,
    detailError,
    onRetryDetail,
    submitLoading,
    submitError,
    onClose,
    onSubmit
}: Props) => {
    const [searchText, setSearchText] = useState('')
    const [staffList, setStaffList] = useState<StaffModel[]>([])
    const [staffLoading, setStaffLoading] = useState(false)
    const [staffError, setStaffError] = useState<string | null>(null)
    const [selectedStaff, setSelectedStaff] = useState<StaffModel | null>(null)
    const isFirstRun = useRef(true)

    const loadStaff = async (text: string) => {
        setStaffLoading(true)
        setStaffError(null)

        try {
            const response = await staffService.search_users({
                sessiontoken,
                language: locale,
                filter: {
                    search_text: text,
                    channel_code: 'BO',
                    project_code: request.project_code,
                    department_code: '',
                    status: 'ALL',
                    is_login: 'ALL',
                    page_index: 0,
                    page_size: 10
                }
            })

            setStaffList(response.items)
        } catch (caught) {
            setStaffList([])
            setStaffError(caught instanceof Error ? caught.message : serviceRequestsText(dictionary, 'load_handler_options_failed'))
        } finally {
            setStaffLoading(false)
        }
    }

    useEffect(() => {
        if (isFirstRun.current) {
            isFirstRun.current = false
            void loadStaff(searchText)

            return
        }

        const timer = setTimeout(() => void loadStaff(searchText), 350)

        return () => clearTimeout(timer)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchText])

    const dialogTitle = detail?.handler_user_code
        ? serviceRequestsText(dictionary, 'reassign_service_request')
        : serviceRequestsText(dictionary, 'assign_service_request')

    return (
        <Dialog open onClose={submitLoading ? undefined : onClose} fullWidth maxWidth="sm">
            <DialogTitle sx={{ pr: 7, fontWeight: 800 }}>
                {dialogTitle}
                <IconButton
                    aria-label={commonText(dictionary, 'close')}
                    onClick={onClose}
                    disabled={submitLoading}
                    sx={{ position: 'absolute', right: 12, top: 10 }}
                >
                    <CloseIcon />
                </IconButton>
            </DialogTitle>
            <DialogContent dividers>
                <Stack spacing={2} sx={{ pt: 1 }}>
                    <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                        <Stack spacing={1}>
                            <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1}>
                                <Typography sx={{ fontWeight: 700 }}>{displayText(request.request_code)}</Typography>
                                <Stack direction="row" gap={1}>
                                    <Chip size="small" color={getRequestStatusColor(request.status)} label={getRequestStatusLabel(dictionary, request.status)} />
                                    <Chip size="small" color={getPriorityColor(request.priority)} label={getPriorityLabel(dictionary, request.priority)} />
                                </Stack>
                            </Stack>
                            <Typography variant="body2" color="text.secondary">{displayText(request.title)}</Typography>
                            <Stack direction="row" gap={2} flexWrap="wrap">
                                <Typography variant="caption" color="text.secondary">
                                    {serviceRequestsText(dictionary, 'apartment_code')}: <strong>{displayText(request.apartment_code)}</strong>
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    {serviceRequestsText(dictionary, 'current_handler')}:{' '}
                                    <strong>
                                        {detailLoading ? '…' : displayText(detail?.handler_user_code)}
                                    </strong>
                                </Typography>
                            </Stack>
                            {!detailLoading && detailError && (
                                <Alert
                                    severity="warning"
                                    action={
                                        <Button color="inherit" size="small" onClick={onRetryDetail}>
                                            {commonText(dictionary, 'retry')}
                                        </Button>
                                    }
                                >
                                    {detailError}
                                </Alert>
                            )}
                        </Stack>
                    </Paper>

                    <Divider />

                    <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                        {serviceRequestsText(dictionary, 'select_handler')}
                    </Typography>

                    <TextField
                        fullWidth
                        size="small"
                        placeholder={serviceRequestsText(dictionary, 'search_handler_placeholder')}
                        value={searchText}
                        onChange={event => setSearchText(event.target.value)}
                        slotProps={{
                            input: {
                                startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>
                            }
                        }}
                    />

                    {submitError && <Alert severity="error">{submitError}</Alert>}

                    <Box sx={{ maxHeight: 320, overflowY: 'auto' }}>
                        {staffLoading ? (
                            <Stack spacing={0.5}>
                                {Array.from({ length: 4 }).map((_, index) => <StaffSkeletonRow key={index} />)}
                            </Stack>
                        ) : staffError ? (
                            <Alert
                                severity="error"
                                action={
                                    <Button color="inherit" size="small" onClick={() => void loadStaff(searchText)}>
                                        {commonText(dictionary, 'retry')}
                                    </Button>
                                }
                            >
                                {staffError}
                            </Alert>
                        ) : staffList.length === 0 ? (
                            <Stack alignItems="center" spacing={1} sx={{ py: 4 }}>
                                <PersonSearchIcon sx={{ fontSize: 36, color: 'text.disabled' }} />
                                <Typography variant="body2" color="text.secondary">
                                    {serviceRequestsText(dictionary, 'no_handler_found')}
                                </Typography>
                            </Stack>
                        ) : (
                            <Stack spacing={1}>
                                {staffList.map(staff => {
                                    const isActive = staff.status === 'A'
                                    const isSelected = selectedStaff?.user_code === staff.user_code

                                    return (
                                        <Paper
                                            key={staff.id || staff.user_code}
                                            variant="outlined"
                                            onClick={() => { if (isActive) setSelectedStaff(staff) }}
                                            sx={{
                                                p: 1.5,
                                                borderRadius: 2,
                                                cursor: isActive ? 'pointer' : 'not-allowed',
                                                opacity: isActive ? 1 : 0.5,
                                                borderColor: isSelected ? 'primary.main' : 'divider',
                                                borderWidth: isSelected ? 2 : 1,
                                                bgcolor: isSelected ? 'action.selected' : 'background.paper'
                                            }}
                                        >
                                            <Stack direction="row" spacing={1.5} alignItems="center">
                                                <Avatar src={staff.avatar ?? undefined} sx={{ width: 40, height: 40 }}>
                                                    {getStaffInitial(staff)}
                                                </Avatar>
                                                <Stack spacing={0.25} sx={{ flex: 1, minWidth: 0 }}>
                                                    <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                                                        <Typography sx={{ fontWeight: 700 }}>{getStaffFullName(staff)}</Typography>
                                                        <Chip
                                                            size="small"
                                                            color={isActive ? 'success' : 'default'}
                                                            label={isActive
                                                                ? serviceRequestsText(dictionary, 'staff_status_active')
                                                                : serviceRequestsText(dictionary, 'staff_status_inactive')}
                                                            sx={{ height: 18, fontSize: 11 }}
                                                        />
                                                    </Stack>
                                                    <Typography variant="body2" color="text.secondary" sx={{ overflowWrap: 'anywhere' }}>
                                                        {displayText(staff.email)} {staff.phone ? `· ${staff.phone}` : ''}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.disabled">
                                                        {staff.login_name || staff.user_code}
                                                    </Typography>
                                                </Stack>
                                                {isSelected && <CheckCircleIcon color="primary" />}
                                            </Stack>
                                        </Paper>
                                    )
                                })}
                            </Stack>
                        )}
                    </Box>
                </Stack>
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 2 }}>
                <Button onClick={onClose} disabled={submitLoading}>{commonText(dictionary, 'cancel')}</Button>
                <Button
                    variant="contained"
                    startIcon={submitLoading ? <CircularProgress size={16} color="inherit" /> : <SendIcon />}
                    disabled={!selectedStaff || submitLoading}
                    onClick={() => { if (selectedStaff) onSubmit(selectedStaff) }}
                >
                    {submitLoading ? serviceRequestsText(dictionary, 'assigning_handler') : serviceRequestsText(dictionary, 'confirm_assign_handler')}
                </Button>
            </DialogActions>
        </Dialog>
    )
}

export default ServiceRequestAssignHandlerDialog
