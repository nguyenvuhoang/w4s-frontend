import type { SelectChangeEvent } from '@mui/material/Select'
import type { Locale } from '@/configs/i18n'
import { useRouter } from '@shared/hooks/useRouter'
import { useCallback, useEffect, useState } from 'react'

import { useWorkingProject } from '@/@core/stores/useWorkingProjectStore'
import { getDetailFullName } from '@/features/staffs/services/staffService'
import type { StaffModel } from '@/features/staffs/types'

import { emptyServiceRequestsFilter, serviceRequestsText } from '../components/serviceRequestHelpers'
import { serviceRequestService } from '../services/serviceRequestService'
import type {
    AssignServiceRequestResponse,
    CreateServiceRequestForm,
    CreateServiceRequestRequest,
    ServiceRequestActionForm,
    ServiceRequestDetail,
    ServiceRequestItem,
    ServiceRequestsDictionary,
    ServiceRequestsFilter,
    ServiceRequestsSearchResponse
} from '../types'
import { ServiceRequestWorkflowError } from '../types'
import type { ServiceRequestActionMode } from '../components/ServiceRequestActionDialog'

type Params = {
    dictionary: ServiceRequestsDictionary
    sessiontoken?: string
    language: Locale
    initialFilter: ServiceRequestsFilter
    initialData: ServiceRequestsSearchResponse
    initialError?: string | null
}

type Notice = { severity: 'success' | 'error'; message: string }

export type AssignSuccessInfo = {
    requestCode: string
    handlerName: string
    response: AssignServiceRequestResponse
}

export const useServiceRequests = ({
    dictionary,
    sessiontoken,
    language,
    initialFilter,
    initialData,
    initialError = null
}: Params) => {
    const router = useRouter()
    const workingProject = useWorkingProject()
    const [filter, setFilter] = useState(initialFilter)
    const [draftFilter, setDraftFilter] = useState(initialFilter)
    const [rows, setRows] = useState(initialData.items)
    const [totalCount, setTotalCount] = useState(initialData.total_count)
    const [totalPages, setTotalPages] = useState(initialData.total_pages)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(initialError)
    const [createOpen, setCreateOpen] = useState(false)
    const [createKey, setCreateKey] = useState(0)
    const [createLoading, setCreateLoading] = useState(false)
    const [createError, setCreateError] = useState<string | null>(null)
    const [actionMode, setActionMode] = useState<ServiceRequestActionMode | null>(null)
    const [actionTarget, setActionTarget] = useState<ServiceRequestItem | null>(null)
    const [actionKey, setActionKey] = useState(0)
    const [actionLoading, setActionLoading] = useState(false)
    const [actionError, setActionError] = useState<string | null>(null)
    const [deactivateTarget, setDeactivateTarget] = useState<ServiceRequestItem | null>(null)
    const [deactivateLoading, setDeactivateLoading] = useState(false)
    const [assignTarget, setAssignTarget] = useState<ServiceRequestItem | null>(null)
    const [assignDetail, setAssignDetail] = useState<ServiceRequestDetail | null>(null)
    const [assignDetailLoading, setAssignDetailLoading] = useState(false)
    const [assignDetailError, setAssignDetailError] = useState<string | null>(null)
    const [assignKey, setAssignKey] = useState(0)
    const [assignSubmitLoading, setAssignSubmitLoading] = useState(false)
    const [assignSubmitError, setAssignSubmitError] = useState<string | null>(null)
    const [assignSuccess, setAssignSuccess] = useState<AssignSuccessInfo | null>(null)
    const [notice, setNotice] = useState<Notice | null>(null)

    const resolveError = useCallback((caught: unknown, fallbackKey = 'load_failed') => {
        if (caught instanceof ServiceRequestWorkflowError && caught.next_action === 'logout') {
            router.push(`/${language}/logout`)
        }

        if (caught instanceof ServiceRequestWorkflowError) {
            if (caught.error_code === 'ips.resident.notfound') {
                return serviceRequestsText(dictionary, 'resident_profile_not_found')
            }
            if (caught.error_code === 'required.with.field') {
                return serviceRequestsText(dictionary, 'request_status_required')
            }
        }

        return caught instanceof Error ? caught.message : serviceRequestsText(dictionary, fallbackKey)
    }, [dictionary, language, router])

    const loadData = useCallback(async (nextFilter: ServiceRequestsFilter = filter) => {
        setLoading(true)
        setError(null)

        try {
            const response = await serviceRequestService.simpleSearchServiceRequests({
                sessiontoken,
                language,
                filter: nextFilter
            })
            const resolvedFilter = {
                ...nextFilter,
                page_index: response.page_index,
                page_size: response.page_size
            }

            setRows(response.items)
            setTotalCount(response.total_count)
            setTotalPages(response.total_pages)
            setFilter(resolvedFilter)
            setDraftFilter(resolvedFilter)

            return response
        } catch (caught) {
            setError(resolveError(caught))

            return undefined
        } finally {
            setLoading(false)
        }
    }, [filter, language, resolveError, sessiontoken])

    useEffect(() => {
        if (!workingProject) return
        if (filter.project_id === workingProject.id) return

        void loadData({ ...draftFilter, project_id: workingProject.id, page_index: 1 })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [workingProject?.id])

    const updateDraftFilter = <K extends keyof ServiceRequestsFilter>(key: K, value: ServiceRequestsFilter[K]) => {
        setDraftFilter(current => ({ ...current, [key]: value }))
    }

    const handleSearch = () => void loadData({ ...draftFilter, page_index: 1 })
    const applyFilter = (request_status: ServiceRequestsFilter['request_status']) => {
        void loadData({ ...draftFilter, request_status, page_index: 1 })
    }
    const handleReset = () => void loadData({ ...emptyServiceRequestsFilter, project_id: filter.project_id })
    const handleRefresh = () => void loadData(filter)

    const handleOpenCreate = () => {
        setCreateError(null)
        setCreateOpen(true)
        setCreateKey(current => current + 1)
    }

    const handleCloseCreate = () => {
        if (!createLoading) setCreateOpen(false)
    }

    const handleCreate = async (values: CreateServiceRequestForm) => {
        setCreateLoading(true)
        setCreateError(null)

        const fields: CreateServiceRequestRequest = {
            attachments: values.attachments.trim(),
            request_type: values.request_type,
            apartment_id: Number(values.apartment_id),
            project_id: Number(values.project_id),
            title: values.title.trim(),
            content: values.content.trim(),
            service_request_category_id: Number(values.service_request_category_id)
        }

        try {
            await serviceRequestService.createServiceRequest({ sessiontoken, language, fields })
            setCreateOpen(false)
            await loadData(filter)
            setNotice({ severity: 'success', message: serviceRequestsText(dictionary, 'service_request_created') })
        } catch (caught) {
            setCreateError(resolveError(caught, 'create_service_request_failed'))
        } finally {
            setCreateLoading(false)
        }
    }

    const openAction = (mode: ServiceRequestActionMode, request: ServiceRequestItem) => {
        setActionMode(mode)
        setActionTarget(request)
        setActionError(null)
        setActionKey(current => current + 1)
    }

    const handleCloseAction = () => {
        if (!actionLoading) {
            setActionMode(null)
            setActionTarget(null)
        }
    }

    const handleActionSubmit = async (values: ServiceRequestActionForm) => {
        if (!actionMode || !actionTarget) return

        setActionLoading(true)
        setActionError(null)

        try {
            if (actionMode === 'status') {
                await serviceRequestService.updateServiceRequestStatus({
                    sessiontoken,
                    language,
                    fields: {
                        internal_note: values.internal_note.trim(),
                        request_code: actionTarget.request_code,
                        request_status: values.request_status
                    }
                })
            } else {
                await serviceRequestService.cancelServiceRequest({
                    sessiontoken,
                    language,
                    fields: {
                        cancel_reason: values.cancel_reason.trim(),
                        request_code: actionTarget.request_code
                    }
                })
            }

            const successKey = actionMode === 'status' ? 'request_status_updated' : 'service_request_cancelled'

            setActionMode(null)
            setActionTarget(null)
            await loadData(filter)
            setNotice({ severity: 'success', message: serviceRequestsText(dictionary, successKey) })
        } catch (caught) {
            const failedKey = actionMode === 'status' ? 'update_request_status_failed' : 'cancel_service_request_failed'

            setActionError(resolveError(caught, failedKey))
        } finally {
            setActionLoading(false)
        }
    }

    const handleDeactivate = async () => {
        if (!deactivateTarget || deactivateLoading) return

        setDeactivateLoading(true)

        try {
            await serviceRequestService.deactivateServiceRequest({
                sessiontoken,
                language,
                id: deactivateTarget.id
            })
            setDeactivateTarget(null)
            await loadData(filter)
            setNotice({ severity: 'success', message: serviceRequestsText(dictionary, 'service_request_deactivated') })
        } catch (caught) {
            setNotice({
                severity: 'error',
                message: resolveError(caught, 'deactivate_service_request_failed')
            })
        } finally {
            setDeactivateLoading(false)
        }
    }
    const handlePageSizeChange = (event: SelectChangeEvent<number>) => {
        void loadData({ ...filter, page_size: Number(event.target.value), page_index: 1 })
    }
    const handlePageChange = (_: React.ChangeEvent<unknown>, pageIndex: number) => {
        void loadData({ ...filter, page_index: pageIndex })
    }
    const handleJumpPage = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const pageIndex = Math.min(Math.max(Number(event.target.value) || 1, 1), Math.max(totalPages, 1))

        void loadData({ ...filter, page_index: pageIndex })
    }

    const handleViewDetail = (request: ServiceRequestItem) => {
        router.push(`/${language}/service-requests/service-requests/${encodeURIComponent(request.request_code)}`)
    }

    const loadAssignDetail = useCallback(async (request: ServiceRequestItem) => {
        setAssignDetailLoading(true)
        setAssignDetailError(null)

        try {
            const detail = await serviceRequestService.getServiceRequestByCode({ sessiontoken, language, requestCode: request.request_code })

            setAssignDetail(detail)
        } catch (caught) {
            setAssignDetail(null)
            setAssignDetailError(resolveError(caught, 'detail_load_failed'))
        } finally {
            setAssignDetailLoading(false)
        }
    }, [language, resolveError, sessiontoken])

    const handleOpenAssignHandler = (request: ServiceRequestItem) => {
        setAssignTarget(request)
        setAssignSubmitError(null)
        setAssignKey(current => current + 1)
        void loadAssignDetail(request)
    }

    const handleCloseAssignHandler = () => {
        if (assignSubmitLoading) return
        setAssignTarget(null)
        setAssignDetail(null)
        setAssignDetailError(null)
        setAssignSubmitError(null)
    }

    const handleRetryAssignDetail = () => {
        if (assignTarget) void loadAssignDetail(assignTarget)
    }

    const handleSubmitAssignHandler = async (staff: StaffModel) => {
        if (!assignTarget) return

        setAssignSubmitLoading(true)
        setAssignSubmitError(null)

        try {
            const response = await serviceRequestService.assignServiceRequest({
                sessiontoken,
                language,
                fields: {
                    handler_user_code: staff.user_code,
                    supervisor_user_code: '',
                    request_code: assignTarget.request_code
                }
            })

            const requestCode = assignTarget.request_code
            const handlerName = getDetailFullName(staff) || staff.user_name || staff.login_name || staff.user_code

            setAssignTarget(null)
            setAssignDetail(null)
            await loadData(filter)
            setNotice({ severity: 'success', message: serviceRequestsText(dictionary, 'service_request_assigned') })
            setAssignSuccess({ requestCode, handlerName, response })
        } catch (caught) {
            setAssignSubmitError(resolveError(caught, 'assign_service_request_failed'))
        } finally {
            setAssignSubmitLoading(false)
        }
    }

    return {
        filter,
        draftFilter,
        rows,
        totalCount,
        loading,
        error,
        workingProject,
        createOpen,
        createKey,
        createLoading,
        createError,
        actionMode,
        actionTarget,
        actionKey,
        actionLoading,
        actionError,
        deactivateTarget,
        deactivateLoading,
        assignTarget,
        assignDetail,
        assignDetailLoading,
        assignDetailError,
        assignKey,
        assignSubmitLoading,
        assignSubmitError,
        assignSuccess,
        notice,
        loadData,
        updateDraftFilter,
        applyFilter,
        handleSearch,
        handleReset,
        handleRefresh,
        handleOpenCreate,
        handleCloseCreate,
        handleCreate,
        handleOpenUpdateStatus: (request: ServiceRequestItem) => openAction('status', request),
        handleOpenCancel: (request: ServiceRequestItem) => openAction('cancel', request),
        handleCloseAction,
        handleActionSubmit,
        handleOpenDeactivate: setDeactivateTarget,
        handleCloseDeactivate: () => { if (!deactivateLoading) setDeactivateTarget(null) },
        handleDeactivate,
        handleOpenAssignHandler,
        handleCloseAssignHandler,
        handleRetryAssignDetail,
        handleSubmitAssignHandler,
        handleCloseAssignSuccess: () => setAssignSuccess(null),
        handleCloseNotice: () => setNotice(null),
        handleViewDetail,
        handlePageSizeChange,
        handlePageChange,
        handleJumpPage
    }
}
