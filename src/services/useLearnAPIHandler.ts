/* eslint-disable react-hooks/exhaustive-deps */
import { Locale } from '@/configs/i18n'
import { learnAPIService } from '@/servers/system-service/services/learnapi.service'
import { LearnAPIType, PageData } from '@/shared/types'
import { getDictionary } from '@/shared/utils/getDictionary'
import { isValidResponse } from '@/shared/utils/isValidResponse'
import SwalAlert from '@/shared/utils/SwalAlert'
import { SelectChangeEvent } from '@mui/material'
import { Session } from 'next-auth'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'

export interface LearnAPISearchForm {
    query: string
    channel: 'ALL' | 'BO' | 'FO'
    method: 'ALL' | 'GET' | 'POST' | 'PUT' | 'DELETE'
}

export function useLearnAPIHandler(
    initialData: PageData<LearnAPIType>,
    session: Session | null,
    locale: Locale,
    dictionary?: Awaited<ReturnType<typeof getDictionary>>
) {
    const router = useRouter()

    // =========================
    // 🟢 DATA & PAGINATION STATE
    // =========================
    const [learnAPIs, setLearnAPIs] = useState<PageData<LearnAPIType>>(initialData)
    const [page, setPage] = useState(initialData?.page_index ?? initialData?.pageindex ?? 1)
    const [rowsPerPage, setRowsPerPage] = useState(initialData?.page_size ?? initialData?.pagesize ?? 10)
    const [jumpPage, setJumpPage] = useState(page)
    const [totalCount, setTotalCount] = useState(initialData?.total_count ?? 0)
    const [loading, setLoading] = useState(false)
    const [searchPayload, setSearchPayload] = useState<LearnAPISearchForm | null>(null)

    // =========================
    // 🟢 SELECTION STATE
    // =========================
    const [selected, setSelected] = useState<string[]>([])
    const toggleAll = () => {
        if (selected.length === learnAPIs?.items?.length) {
            setSelected([])
        } else {
            setSelected(learnAPIs?.items?.map((r) => r.learn_api_id) ?? [])
        }
    }
    const toggleOne = (id: string) => {
        setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [id]))
    }
    const clearSelection = () => setSelected([])

    // Computed selection helpers
    const isAllSelected = learnAPIs?.items?.length > 0 && selected.length === learnAPIs?.items?.length
    const isIndeterminate = selected.length > 0 && selected.length < (learnAPIs?.items?.length ?? 0)

    // Options for filters
    const channelOptions = [
        { value: 'ALL', label: 'All' },
        { value: 'BO', label: 'BO' },
        { value: 'FO', label: 'FO' }
    ]

    const methodOptions = [
        { value: 'ALL', label: 'All' },
        { value: 'GET', label: 'GET' },
        { value: 'POST', label: 'POST' },
        { value: 'PUT', label: 'PUT' },
        { value: 'DELETE', label: 'DELETE' }
    ]

    // =========================
    // 🟢 ROW ACTIONS
    // =========================
    const handleRowDblClick = (learnApiId: string) => {
        router.push(`/${locale}/api-manager/apis/${learnApiId}`)
    }

    const openViewPage = () => {
        if (selected.length === 1) {
            router.push(`/${locale}/api-manager/apis/${selected[0]}`)
        }
    }

    const openModifyPage = () => {
        if (selected.length === 1) {
            router.push(`/${locale}/api-manager/apis/modify/${selected[0]}`)
        }
    }

    const openAddPage = () => {
        router.push(`/${locale}/api-manager/apis/add`)
    }

    const handleDelete = async () => {
        if (selected.length !== 1) return

        const id = selected[0]
        SwalAlert(
            'warning',
            `Are you sure you want to delete API: ${id}?`,
            'center',
            true, // allowOutsideClick
            true, // showCancelButton
            true, // withConfirm (MUST BE TRUE to trigger functional)
            async () => {
                setLoading(true)
                try {
                    const res = await learnAPIService.delete({
                        sessiontoken: session?.user?.token as string,
                        language: locale,
                        learn_api_id: id
                    })

                    if (isValidResponse(res) && !res.payload.dataresponse.errors?.length) {
                        SwalAlert('success', 'Delete successful', 'center')
                        clearSelection()
                        fetchData()
                    } else {
                        const error = res.payload.dataresponse.errors?.[0]?.info || 'Delete failed'
                        const exception = res.payload.dataresponse.execution_id || 'Delete failed'
                        SwalAlert('error', error + ' - ' + exception, 'center')
                    }
                } catch (error) {
                    console.error('Delete error:', error)
                    SwalAlert('error', 'An unexpected error occurred during deletion.', 'center')
                } finally {
                    setLoading(false)
                }
            }
        )
    }

    // =========================
    // 🟢 DATA FETCHING
    // =========================
    const fetchData = async (
        payload: LearnAPISearchForm = searchPayload!,
        pageOverride: number = page,
        sizeOverride: number = rowsPerPage
    ) => {
        setLoading(true)
        try {
            const learnAPIDataApi = await learnAPIService.search({
                sessiontoken: session?.user?.token as string,
                language: locale,
                pageindex: pageOverride,
                pagesize: sizeOverride,
                searchtext: payload?.query ?? '',
            })

            if (
                !isValidResponse(learnAPIDataApi) ||
                (learnAPIDataApi.payload.dataresponse.errors && learnAPIDataApi.payload.dataresponse.errors.length > 0)
            ) {
                console.log(
                    'Error:',
                    learnAPIDataApi.payload.dataresponse.errors?.[0]?.execute_id +
                    ' - ' +
                    learnAPIDataApi.payload.dataresponse.errors?.[0]?.info
                )
                return
            }

            const dataResult = learnAPIDataApi.payload.dataresponse.data as unknown as PageData<LearnAPIType>

            // Client-side filter by channel and method if needed
            let filteredItems = dataResult?.items ?? []
            if (payload?.channel && payload.channel !== 'ALL') {
                filteredItems = filteredItems.filter(item => item.channel === payload.channel)
            }
            if (payload?.method && payload.method !== 'ALL') {
                filteredItems = filteredItems.filter(item => item.learn_api_method === payload.method)
            }

            const actualTotalCount = dataResult?.total_count ?? filteredItems.length

            setLearnAPIs({
                ...dataResult,
                items: filteredItems,
                total_count: actualTotalCount
            })
            setTotalCount(actualTotalCount)
        } catch (err) {
            console.error('Error fetching LearnAPI data:', err)
        } finally {
            setLoading(false)
        }
    }

    // =========================
    // 🟢 PAGINATION & SEARCH HANDLERS
    // =========================
    const handleSearch = (data: LearnAPISearchForm) => {
        setSearchPayload(data)
        setPage(1)
        fetchData(data, 1, rowsPerPage)
    }

    const handleJumpPage = (event: React.ChangeEvent<HTMLInputElement>) => {
        const input = event.target.value
        const n = parseInt(input, 10)
        if (!isNaN(n) && n >= 1) {
            setJumpPage(n)
            if (n <= Math.ceil(totalCount / rowsPerPage)) {
                setPage(n)
                fetchData(searchPayload!, n, rowsPerPage)
            }
        }
    }

    const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
        setPage(value)
        fetchData(searchPayload!, value, rowsPerPage)
    }

    const handlePageSizeChange = (event: SelectChangeEvent<number>) => {
        const newSize = Number(event.target.value)
        setRowsPerPage(newSize)
        setPage(1)
        fetchData(searchPayload!, 1, newSize)
    }

    // Update jumpPage when page changes
    useEffect(() => {
        setJumpPage(page)
    }, [page])

    // =========================
    // 🟢 COMPUTED VALUES
    // =========================
    const selectedRow = useMemo(() => {
        if (selected.length !== 1) return null
        return learnAPIs?.items?.find((r) => r.learn_api_id === selected[0]) ?? null
    }, [selected, learnAPIs])

    const hasSelection = selected.length > 0
    const selectedId = selected.length === 1 ? selected[0] : null

    return {
        learnAPIs,
        page,
        jumpPage,
        rowsPerPage,
        totalCount,
        loading,
        handleSearch,
        handleJumpPage,
        handlePageChange,
        handlePageSizeChange,
        channelOptions,
        methodOptions,
        selected,
        isAllSelected,
        isIndeterminate,
        toggleAll,
        toggleOne,
        clearSelection,
        selectedId,
        selectedRow,
        hasSelection,
        handleRowDblClick,
        openViewPage,
        openModifyPage,
        openAddPage,
        handleDelete
    }
}
