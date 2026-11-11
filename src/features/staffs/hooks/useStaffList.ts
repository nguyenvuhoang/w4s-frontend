import type { SelectChangeEvent } from '@mui/material/Select'
import { usePathname } from 'next/navigation'
import { useRouter } from '@shared/hooks/useRouter'
import { useCallback, useRef, useState } from 'react'
import Swal from 'sweetalert2'

import SwalAlert from '@/shared/utils/SwalAlert'
import { isSessionInvalidMessage } from '@/shared/utils/isTokenError'
import { triggerSessionLogoutRedirect } from '@/shared/utils/triggerSessionLogout'

import { buildStaffUpdatePayloadFromAccount, staffService } from '../services/staffService'
import type { StaffDictionary, StaffFilterModel, StaffListResponse, StaffModel, StaffStatus, StaffUpdatePayload } from '../types'
import { requiresStaffGenderSelection } from '../utils/staffGender'
import { empty_staff_filter, staffText } from '../components/staff-list/staffListHelpers'

type Params = {
    dictionary: StaffDictionary
    sessiontoken?: string
    language?: any
    initial_filter: StaffFilterModel
    initial_data: StaffListResponse
    empty_filter?: StaffFilterModel
    text_namespace?: 'staffs' | 'residents_tenants'
}

type StaffSearchResultState = {
    filter: StaffFilterModel
    data: StaffListResponse
}

export function useStaffList({ dictionary, sessiontoken, language, initial_filter, initial_data, empty_filter = empty_staff_filter, text_namespace = 'staffs' }: Params) {
    const router = useRouter()
    const pathname = usePathname()
    const [search_result, setSearchResult] = useState<StaffSearchResultState>({
        filter: initial_filter,
        data: initial_data
    })
    const [draft_filter, setDraftFilter] = useState(initial_filter)
    const [loading, setLoading] = useState(false)
    const [exporting, setExporting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [selected_staff, setSelectedStaff] = useState<StaffModel | null>(null)
    const [modify_open, setModifyOpen] = useState(false)
    const [modify_form, setModifyForm] = useState<StaffUpdatePayload>(() => buildStaffUpdatePayloadFromAccount(null))
    const [initial_modify_form, setInitialModifyForm] = useState<StaffUpdatePayload>(() => buildStaffUpdatePayloadFromAccount(null))
    const [modify_errors, setModifyErrors] = useState<Partial<Record<keyof StaffUpdatePayload, string>>>({})
    const [modify_modal_error, setModifyModalError] = useState<string | null>(null)
    const [saving_modify, setSavingModify] = useState(false)
    const [loading_modify, setLoadingModify] = useState(false)
    const latest_request_id = useRef(0)
    const exporting_ref = useRef(false)
    const latest_filter_ref = useRef(initial_filter)
    const filter = search_result.filter
    const rows = search_result.data.items
    const total_count = search_result.data.total_count
    const total_pages = search_result.data.total_pages

    const syncUrl = useCallback((next_filter: StaffFilterModel) => {
        const params = new URLSearchParams()

        if (next_filter.search_text.trim()) params.set('search_text', next_filter.search_text.trim())
        if (next_filter.project_code.trim()) params.set('project_code', next_filter.project_code.trim())
        if (next_filter.department_code.trim()) params.set('department_code', next_filter.department_code.trim())
        if (next_filter.status !== empty_filter.status) params.set('status', next_filter.status)
        if (next_filter.is_login !== empty_filter.is_login) params.set('is_login', next_filter.is_login)
        if (next_filter.page_index > 1) params.set('page_index', String(next_filter.page_index))
        if (next_filter.page_size !== empty_filter.page_size) params.set('page_size', String(next_filter.page_size))

        const query = params.toString()

        router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
    }, [pathname, router, empty_filter.page_size])

    const loadData = async (next_filter: StaffFilterModel = filter) => {
        const request_id = ++latest_request_id.current
        latest_filter_ref.current = next_filter

        setLoading(true)
        setError(null)

        try {
            const response = await staffService.search_users({
                sessiontoken,
                language,
                filter: next_filter
            })

            if (request_id !== latest_request_id.current) return

            const resolved_filter = { ...next_filter, page_index: response.page_index, page_size: response.page_size }

            latest_filter_ref.current = resolved_filter
            setSearchResult({ filter: resolved_filter, data: response })
            setSelectedStaff(current => response.items.find(item => item.id === current?.id) ?? null)
            setDraftFilter(resolved_filter)
            syncUrl(resolved_filter)
        } catch (err) {
            if (request_id !== latest_request_id.current) return

            const message = err instanceof Error ? err.message : staffText(dictionary, 'load_failed', 'Unable to load staffs.', text_namespace)

            // The backend can reject a workflow call at the business layer (HTTP 200, error
            // inside the response body) rather than with a real 401 — that never reaches the
            // centralized session-invalid handling in servers/lib/http.ts. Same detector/redirect
            // used by ErrorPage/PageError/(dashboard)/error.tsx so this client-side re-search path
            // doesn't flash a raw "session invalid" message instead of logging out.
            if (isSessionInvalidMessage(message)) {
                triggerSessionLogoutRedirect(router.replace)

                return
            }

            setError(message)
        } finally {
            if (request_id === latest_request_id.current) setLoading(false)
        }
    }

    const updateDraftFilter = <K extends keyof StaffFilterModel>(key: K, value: StaffFilterModel[K]) => {
        const next_filter = { ...latest_filter_ref.current, [key]: value }

        latest_filter_ref.current = next_filter
        setDraftFilter(next_filter)
    }

    // Select-based filters (status, is_login) search immediately on change, unlike the free-text
    // search box which still waits for Enter/Search — matches the resident list filter bar convention.
    const handleFilterSelectChange = <K extends keyof StaffFilterModel>(key: K, value: StaffFilterModel[K]) => {
        const next_filter = { ...latest_filter_ref.current, [key]: value, page_index: 1 }

        latest_filter_ref.current = next_filter
        setDraftFilter(next_filter)
        void loadData(next_filter)
    }

    const handleSearch = () => {
        void loadData({ ...latest_filter_ref.current, page_index: 1, channel_code: empty_filter.channel_code })
    }

    const resetFilter = () => {
        void loadData(empty_filter)
    }

    const handleExport = async () => {
        if (exporting_ref.current) return

        exporting_ref.current = true
        setExporting(true)

        try {
            // Export is fully backend-driven — it never depends on the current search filter.
            const response = await staffService.export_staff_list({ sessiontoken, language })

            const url = window.URL.createObjectURL(response.blob)
            const link = document.createElement('a')

            link.href = url
            link.download = response.filename
            document.body.appendChild(link)
            link.click()
            link.remove()
            window.URL.revokeObjectURL(url)

            SwalAlert('success', staffText(dictionary, 'export_excel_success', 'Xuất file Excel thành công.', text_namespace), 'center')
        } catch (err) {
            const message = err instanceof Error ? err.message : staffText(dictionary, 'export_excel_failed', 'Không thể xuất file Excel.', text_namespace)
            const executionId = staffService.getExportErrorExecutionId(err)
            const errorReference = executionId
                ? `\n${staffText(dictionary, 'export_error_reference', 'Mã tra cứu lỗi', text_namespace)}: ${executionId}`
                : ''

            SwalAlert('error', `${message}${errorReference}`, 'center')
        } finally {
            exporting_ref.current = false
            setExporting(false)
        }
    }

    const handlePageSizeChange = (event: SelectChangeEvent<number>) => {
        const page_size = Number(event.target.value)

        void loadData({ ...filter, page_size, page_index: 1 })
    }

    const handlePageChange = (_: React.ChangeEvent<unknown>, page_index: number) => {
        void loadData({ ...filter, page_index })
    }

    const handleJumpPage = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const page_index = Math.min(Math.max(Number(event.target.value) || 1, 1), Math.max(total_pages, 1))

        void loadData({ ...filter, page_index })
    }

    const selectStaff = useCallback((row: StaffModel) => {
        setSelectedStaff(row)
    }, [])

    const openModifyDialog = async (row: StaffModel | null = selected_staff, status?: StaffStatus) => {
        if (!row) return

        const usercode = row.user_code || row.user_id || row.login_name

        if (!usercode) {
            SwalAlert('error', staffText(dictionary, 'detail_empty', 'User detail not found.'), 'center')

            return
        }

        setLoadingModify(true)
        setModifyErrors({})
        setModifyModalError(null)

        try {
            const detail = await staffService.get_staff_detail({
                sessiontoken,
                language,
                usercode
            })

            const next_form = buildStaffUpdatePayloadFromAccount(detail.account)

            setModifyForm(status ? { ...next_form, status } : next_form)
            setInitialModifyForm(next_form)
            if (status && requiresStaffGenderSelection(next_form.gender, true)) {
                setModifyErrors({ gender: staffText(dictionary, 'gender_required', 'Please select a gender.') })
            }
            setModifyOpen(true)
        } catch (err) {
            const message = err instanceof Error ? err.message : staffText(dictionary, 'detail_empty', 'User detail not found.')

            SwalAlert('error', message, 'center')
        } finally {
            setLoadingModify(false)
        }
    }

    const closeModifyDialog = () => {
        setModifyOpen(false)
        setModifyForm(buildStaffUpdatePayloadFromAccount(null))
        setInitialModifyForm(buildStaffUpdatePayloadFromAccount(null))
        setModifyErrors({})
        setModifyModalError(null)
    }

    const hasModifyChanges = () => JSON.stringify(modify_form) !== JSON.stringify(initial_modify_form)

    const cancelModifyDialog = async () => {
        if (!hasModifyChanges()) {
            closeModifyDialog()

            return
        }

        const result = await Swal.fire({
            position: 'center',
            color: 'black',
            icon: 'warning',
            text: staffText(dictionary, 'close_confirm', 'Entered information will be lost. Are you sure you want to close this form?'),
            showCancelButton: true,
            allowOutsideClick: false,
            confirmButtonText: commonConfirmText(dictionary),
            cancelButtonText: commonCancelText(dictionary)
        })

        if (result.isConfirmed) closeModifyDialog()
    }

    const updateModifyForm = <K extends keyof StaffUpdatePayload>(key: K, value: StaffUpdatePayload[K]) => {
        setModifyModalError(null)
        setModifyForm(current => ({ ...current, [key]: value }))
        setModifyErrors(current => ({ ...current, [key]: undefined }))
    }

    const validateModifyForm = () => {
        const errors: Partial<Record<keyof StaffUpdatePayload, string>> = {}

        if (!Number(modify_form.id)) errors.id = staffText(dictionary, 'id_required', 'User id is required.')
        if (!modify_form.user_id.trim()) errors.user_id = staffText(dictionary, 'userid_required', 'UserId is required.')
        if (!modify_form.login_name.trim()) errors.login_name = staffText(dictionary, 'username_required', 'Username is required.')
        if (!modify_form.full_name.trim()) errors.full_name = staffText(dictionary, 'fullname_required', 'Fullname is required.')
        if (modify_form.gender === '') errors.gender = staffText(dictionary, 'gender_required', 'Please select a gender.')
        if (!modify_form.status) errors.status = staffText(dictionary, 'status_required', 'Status is required.')

        setModifyErrors(errors)

        return Object.keys(errors).length === 0
    }

    const handleModify = async () => {
        setModifyModalError(null)

        if (!validateModifyForm()) return

        setSavingModify(true)

        try {
            const success_message = staffText(dictionary, 'update_success', 'Update user successful.')

            await staffService.update_staff({
                sessiontoken,
                language,
                payload: {
                    ...modify_form,
                    login_name: modify_form.login_name.trim(),
                    full_name: modify_form.full_name.trim().replace(/\s+/g, ' '),
                    email: modify_form.email.trim(),
                    phone: modify_form.phone.trim(),
                    address: modify_form.address.trim()
                }
            })

            closeModifyDialog()
            window.setTimeout(() => {
                SwalAlert('success', success_message, 'center')
            }, 120)
            void loadData(filter)
        } catch (err) {
            const message = err instanceof Error ? err.message : staffText(dictionary, 'update_failed', 'Update user failed.')

            setModifyModalError(message)
        } finally {
            setSavingModify(false)
        }
    }

    return {
        filter,
        draft_filter,
        rows,
        total_count,
        loading,
        exporting,
        error,
        selected_staff,
        modify_open,
        modify_form,
        modify_errors,
        modify_modal_error,
        saving_modify,
        loading_modify,
        loadData,
        updateDraftFilter,
        handleFilterSelectChange,
        handleSearch,
        resetFilter,
        handleExport,
        handlePageSizeChange,
        handlePageChange,
        handleJumpPage,
        selectStaff,
        openModifyDialog,
        cancelModifyDialog,
        updateModifyForm,
        handleModify
    }
}

const commonConfirmText = (dictionary: StaffDictionary) => dictionary.common?.confirm ?? 'Confirm'
const commonCancelText = (dictionary: StaffDictionary) => dictionary.common?.cancel ?? 'Cancel'
