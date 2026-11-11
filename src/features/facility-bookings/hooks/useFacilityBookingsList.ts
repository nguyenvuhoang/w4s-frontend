import type { SelectChangeEvent } from '@mui/material/Select'
import type { Locale } from '@/configs/i18n'
import { useRouter } from '@shared/hooks/useRouter'
import { useCallback, useState } from 'react'

import {
    bookingText,
    empty_facility_booking_filter
} from '../components/facilityBookingHelpers'
import { facilityBookingService } from '../services/facilityBookingService'
import type {
    CreateFacilityBookingForm,
    CreateFacilityBookingRequest,
    FacilityBookingFilterModel,
    FacilityBookingItem,
    FacilityBookingSearchResponse,
    FacilityBookingsDictionary
} from '../types'
import { FacilityBookingWorkflowError } from '../types'

type Params = {
    dictionary: FacilityBookingsDictionary
    sessiontoken?: string
    language: Locale
    initial_filter: FacilityBookingFilterModel
    initial_data: FacilityBookingSearchResponse
    initial_error?: string | null
}

type MutationNotice = { severity: 'success' | 'error'; message: string }

const normalizeTime = (value: string) => value.length === 5 ? `${value}:00` : value

export function useFacilityBookingsList({
    dictionary,
    sessiontoken,
    language,
    initial_filter,
    initial_data,
    initial_error = null
}: Params) {
    const router = useRouter()
    const [filter, setFilter] = useState(initial_filter)
    const [draft_filter, setDraftFilter] = useState(initial_filter)
    const [rows, setRows] = useState<FacilityBookingItem[]>(initial_data.items)
    const [total_count, setTotalCount] = useState(initial_data.total_count)
    const [total_pages, setTotalPages] = useState(initial_data.total_pages)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(initial_error)
    const [create_open, setCreateOpen] = useState(false)
    const [create_key, setCreateKey] = useState(0)
    const [create_loading, setCreateLoading] = useState(false)
    const [create_error, setCreateError] = useState<string | null>(null)
    const [detail_open, setDetailOpen] = useState(false)
    const [detail_loading, setDetailLoading] = useState(false)
    const [detail_error, setDetailError] = useState<string | null>(null)
    const [detail_booking, setDetailBooking] = useState<FacilityBookingItem | null>(null)
    const [deactivate_target, setDeactivateTarget] = useState<FacilityBookingItem | null>(null)
    const [deactivate_loading, setDeactivateLoading] = useState(false)
    const [mutation_notice, setMutationNotice] = useState<MutationNotice | null>(null)

    const resolveError = useCallback((caught: unknown, fallback_key: string) => {
        if (caught instanceof FacilityBookingWorkflowError) {
            if (caught.next_action === 'logout') router.push(`/${language}/logout`)
            if (caught.error_code === 'ips.resident.notfound') {
                return bookingText(dictionary, 'resident_profile_not_found')
            }
        }

        return caught instanceof Error ? caught.message : bookingText(dictionary, fallback_key)
    }, [dictionary, language, router])

    const loadData = useCallback(async (next_filter: FacilityBookingFilterModel = filter) => {
        setLoading(true)
        setError(null)

        try {
            const response = await facilityBookingService.simpleSearchFacilityBookings({
                sessiontoken,
                language,
                filter: next_filter
            })

            const resolved_filter = {
                ...next_filter,
                page_index: response.page_index,
                page_size: response.page_size
            }

            setRows(response.items)
            setTotalCount(response.total_count)
            setTotalPages(response.total_pages)
            setFilter(resolved_filter)
            setDraftFilter(resolved_filter)
        } catch (err) {
            setError(resolveError(err, 'load_failed'))
        } finally {
            setLoading(false)
        }
    }, [filter, language, resolveError, sessiontoken])

    const updateDraftFilter = <K extends keyof FacilityBookingFilterModel>(key: K, value: FacilityBookingFilterModel[K]) => {
        setDraftFilter(current => ({ ...current, [key]: value }))
    }

    const handleSearch = () => {
        void loadData({ ...draft_filter, page_index: 1 })
    }

    const resetFilter = () => {
        void loadData({
            ...empty_facility_booking_filter,
            project_id: draft_filter.project_id || empty_facility_booking_filter.project_id
        })
    }

    const handleRefresh = () => {
        void loadData(filter)
    }

    const handleOpenCreate = () => {
        setCreateError(null)
        setCreateOpen(true)
        setCreateKey(current => current + 1)
    }

    const handleCloseCreate = () => {
        if (!create_loading) setCreateOpen(false)
    }

    const handleCreate = async (values: CreateFacilityBookingForm) => {
        setCreateLoading(true)
        setCreateError(null)

        const fields: CreateFacilityBookingRequest = {
            booking_date: new Date(`${values.booking_date}T00:00:00Z`).toISOString(),
            project_id: Number(values.project_id),
            end_time: normalizeTime(values.end_time),
            apartment_id: Number(values.apartment_id),
            facility_id: Number(values.facility_id),
            terms_accepted: Boolean(values.terms_accepted),
            note: values.note.trim(),
            facility_time_slot_id: Number(values.facility_time_slot_id),
            start_time: normalizeTime(values.start_time)
        }

        try {
            await facilityBookingService.createFacilityBooking({ sessiontoken, language, fields })
            setCreateOpen(false)
            await loadData(filter)
            setMutationNotice({ severity: 'success', message: bookingText(dictionary, 'facility_booking_created') })
        } catch (caught) {
            setCreateError(resolveError(caught, 'create_facility_booking_failed'))
        } finally {
            setCreateLoading(false)
        }
    }

    const handleView = async (row: FacilityBookingItem) => {
        setDetailOpen(true)
        setDetailLoading(true)
        setDetailError(null)
        setDetailBooking(null)

        try {
            const detail = await facilityBookingService.getFacilityBookingById({
                sessiontoken,
                language,
                id: row.id
            })

            setDetailBooking(detail)
        } catch (caught) {
            setDetailError(resolveError(caught, 'detail_load_failed'))
        } finally {
            setDetailLoading(false)
        }
    }

    const handleDeactivate = async () => {
        if (!deactivate_target || deactivate_loading) return

        setDeactivateLoading(true)

        try {
            await facilityBookingService.deactivateFacilityBooking({
                sessiontoken,
                language,
                id: deactivate_target.id
            })
            setDeactivateTarget(null)
            await loadData(filter)
            setMutationNotice({ severity: 'success', message: bookingText(dictionary, 'facility_booking_deactivated') })
        } catch (caught) {
            setMutationNotice({
                severity: 'error',
                message: resolveError(caught, 'deactivate_facility_booking_failed')
            })
        } finally {
            setDeactivateLoading(false)
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

    return {
        filter,
        draft_filter,
        rows,
        total_count,
        loading,
        error,
        create_open,
        create_key,
        create_loading,
        create_error,
        detail_open,
        detail_loading,
        detail_error,
        detail_booking,
        deactivate_target,
        deactivate_loading,
        mutation_notice,
        loadData,
        updateDraftFilter,
        handleSearch,
        resetFilter,
        handleRefresh,
        handleOpenCreate,
        handleCloseCreate,
        handleCreate,
        handleView,
        handleCloseDetail: () => setDetailOpen(false),
        handleOpenDeactivate: setDeactivateTarget,
        handleCloseDeactivate: () => { if (!deactivate_loading) setDeactivateTarget(null) },
        handleDeactivate,
        handleCloseMutationNotice: () => setMutationNotice(null),
        handlePageSizeChange,
        handlePageChange,
        handleJumpPage
    }
}
