/* eslint-disable react-hooks/exhaustive-deps */
import { Locale } from '@/configs/i18n'
import { systemServiceApi } from '@/servers/system-service'
import { OpenAPIType, PageData } from '@/shared/types'
import { getDictionary } from '@/shared/utils/getDictionary'
import { getLocalizedUrl } from '@/shared/utils/i18n'
import { isValidResponse } from '@/shared/utils/isValidResponse'
import SwalAlert from '@/shared/utils/SwalAlert'
import { SelectChangeEvent } from '@mui/material'
import { Session } from 'next-auth'
import { useEffect, useMemo, useState } from 'react'

export type SearchForm = {
    query: string
    environment: string
    status: 'ALL' | 'ACTIVE' | 'INACTIVE' | 'REVOKED' | 'EXPIRED'
}

export const useOpenApiClientHandler = (
    openapiData: PageData<OpenAPIType>,
    session: Session | null,
    locale: Locale,
    dictionary?: Awaited<ReturnType<typeof getDictionary>>
) => {
    const [openapi, setOpenApi] = useState<PageData<OpenAPIType>>(openapiData)
    const [page, setPage] = useState<number>(Math.max((openapi?.page_index ?? 1), 0))
    const [jumpPage, setJumpPage] = useState<number>(openapi?.page_index || 1)
    const [rowsPerPage, setRowsPerPage] = useState<number>(openapi?.page_size || 10)
    const [totalCount, setTotalCount] = useState<number>(openapi?.total_count || 0)
    const [loading, setLoading] = useState(false)
    const [searchPayload, setSearchPayload] = useState<SearchForm>()
    const [statusOptions] = useState<{ value: string, label: string }[]>([
        { value: 'ACTIVE', label: 'Active' },
        { value: 'INACTIVE', label: 'Inactive' }
    ])

    const [selected, setSelected] = useState<string[]>([]) // dùng client_id làm id
    const currentPageIds = useMemo(
        () => (openapiData?.items ?? []).map(x => x.id),
        [openapiData?.items]
    )
    const isAllSelected = currentPageIds.length > 0 && currentPageIds.every(id => selected.includes(id))
    const isIndeterminate = selected.some(id => currentPageIds.includes(id)) && !isAllSelected

    const toggleAll = () => {
        if (isAllSelected) {
            setSelected(prev => prev.filter(id => !currentPageIds.includes(id)))
        } else {
            setSelected(prev => Array.from(new Set([...prev, ...currentPageIds])))
        }
    }
    const toggleOne = (id: string) => {
        setSelected(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]))
    }
    const clearSelection = () => setSelected([])

    // =========================
    // 🔵 COMPUTED VALUES
    // =========================
    const selectedId = selected[0] ?? null
    const selectedRow = openapi?.items?.find((x) => x.id === selectedId) || null
    const hasSelection = selected.length > 0

    const isActive = (s?: boolean | string | number) =>
        s === true || s === 1 || s === 'A' || s === 'Y' || s === 'ACTIVE'
    const canDelete = !!selectedRow && isActive(selectedRow.isactive)

    // =========================
    // 🟢 ROW ACTIONS
    // =========================
    const handleRowDblClick = (clientid: string, environment: string) => {
        if (hasSelection) return
        const url = getLocalizedUrl(`/coreapi/open-api/view/${clientid}/${environment}`, locale as Locale)
        window.open(url, '_blank')
    }

    const handleDeleteClick = async () => {
        if (selected.length !== 1) return
        const id = selected[0]
        const row = openapi?.items?.find((x) => x.id === id)

        if (!row || !dictionary) return

        SwalAlert(
            'question',
            dictionary['openapi'].deleteclient.replace('{0}', row.clientid),
            'center',
            false,
            true,
            true,
            async () => {
                const apiDeleteResult = await deleteOpenAPI(id, row.clientid)
                if (apiDeleteResult.ok) {
                    SwalAlert(
                        'success',
                        dictionary['openapi'].delete_success_text.replace('{0}', row.clientid),
                        'center'
                    )
                } else {
                    SwalAlert('error', apiDeleteResult.message, 'center')
                }
            }
        )
    }

    const openViewPage = () => {
        if (selectedRow) {
            const url = getLocalizedUrl(`/coreapi/open-api/view/${selectedRow.clientid}/${selectedRow.environment}`, locale as Locale)
            window.open(url, '_blank')
        }
    }

    const openModifyPage = () => {
        if (selectedRow) {
            const url = getLocalizedUrl(`/coreapi/open-api/modify/${selectedRow.clientid}/${selectedRow.environment}`, locale as Locale)
            window.open(url, '_blank')
        }
    }

    const openAddPage = () => {
        const url = getLocalizedUrl(`/coreapi/open-api/add`, locale as Locale)
        window.open(url, '_blank')
    }

    const fetchData = async (
        payload: SearchForm = searchPayload!,
        pageOverride: number = page,
        sizeOverride: number = rowsPerPage
    ) => {
        setLoading(true)
        try {
            const dataSearch = {
                ...payload,
                searchtext: ''
            }
            const openAPIdataApi = await systemServiceApi.searchData({
                sessiontoken: session?.user?.token as string,
                workflowid: "BO_EXECUTE_SQL_FROM_CMS",
                commandname: "SimpleSearchCoreAPIKeys",
                searchtext: '',
                pageSize: 10,
                pageIndex: 1,
                parameters: dataSearch
            });


            if (
                !isValidResponse(openAPIdataApi) ||
                (openAPIdataApi.payload.dataresponse.errors && openAPIdataApi.payload.dataresponse.errors.length > 0)
            ) {
                console.log(
                    'ExecutionID:',
                    openAPIdataApi.payload.dataresponse.errors[0].execute_id +
                    ' - ' +
                    openAPIdataApi.payload.dataresponse.errors[0].info
                )
                return
            }

            const datacontract = openAPIdataApi.payload.dataresponse.fo[0].input as PageData<OpenAPIType>
            setOpenApi(datacontract)
            setTotalCount(datacontract.total_count || 0)
        } catch (err) {
            console.error('Error fetching contract data:', err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (searchPayload) {
            fetchData(searchPayload)
        }
    }, [page, rowsPerPage, searchPayload])

    const defaultPayload: SearchForm = {
        query: '',
        environment: 'ALL',
        status: 'ALL'
    }

    const handleSearch = (data: SearchForm) => {
        setPage(0)
        setSearchPayload(data)
        fetchData(data, 0, rowsPerPage)
    }

    const handleJumpPage = (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = Number(event.target.value)
        if (value > 0 && value <= Math.ceil(totalCount / rowsPerPage)) {
            setJumpPage(value)
            setPage(value - 1) // page state starts from 0
        }
    }

    const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
        const payload = searchPayload ?? defaultPayload
        setPage(value)
        fetchData(payload, value, rowsPerPage)
    }

    const handlePageSizeChange = (event: SelectChangeEvent<number>) => {
        const newSize = Number(event.target.value)
        const payload = searchPayload ?? defaultPayload
        setPage(0)
        setRowsPerPage(newSize)
        fetchData(payload, 0, newSize)
    }

    // =========================
    // 🔴 DELETE LOGIC
    // =========================

    /**
     * Trả về { ok, message } để UI hiển thị Swal/toast.
     */
    const deleteOpenAPI = async (id: string, clientId: string,): Promise<{ ok: boolean; message: string }> => {
        if (!clientId) return { ok: false, message: 'Invalid client ID' }
        setLoading(true)
        try {
            const resp = await systemServiceApi.runFODynamic({
                sessiontoken: session?.user?.token as string,
                workflowid: "BO_EXECUTE_SQL_FROM_CMS",
                input: {
                    commandname: "DeleteCoreApiKeysById",
                    issearch: false,
                    parameters: {
                        id: Number(id),
                    },
                },
            });

            if (!isValidResponse(resp)) {
                const msg = (resp as any)?.payload?.dataresponse?.error?.[0]?.info
                    ?? (resp as any)?.message
                    ?? 'Delete client failed'
                return { ok: false, message: msg }
            }

            const errArr = (resp as any)?.payload?.dataresponse?.error
            if (Array.isArray(errArr) && errArr.length > 0) {
                const msg = errArr[0]?.info || 'Delete client failed'
                return { ok: false, message: msg }
            }

            const payload = searchPayload ?? defaultPayload

            const willBeEmptyPage = (openapi?.items?.length ?? 0) === 1
            const nextPage = willBeEmptyPage ? Math.max((page ?? 1) - 1, 0) : page

            await fetchData(payload, nextPage, rowsPerPage)

            // clear selection
            clearSelection()

            return { ok: true, message: `Client ${clientId} deleted` }
        } catch (e: any) {
            return { ok: false, message: e?.message || 'Delete client failed' }
        } finally {
            setLoading(false)
        }
    }


    return {
        // data
        openapi, page, setPage, jumpPage, setJumpPage, rowsPerPage, setRowsPerPage,
        totalCount, loading, statusOptions,

        // actions
        handleSearch, handleJumpPage, handlePageChange, handlePageSizeChange,

        // selection
        selected, setSelected, clearSelection,
        currentPageIds, isAllSelected, isIndeterminate,
        toggleAll, toggleOne,

        // computed
        selectedId, selectedRow, hasSelection, canDelete,

        // row actions
        handleRowDblClick, handleDeleteClick,
        openViewPage, openModifyPage, openAddPage,

        // delete API
        deleteOpenAPI,
        // deleteManySelected
    }
}
