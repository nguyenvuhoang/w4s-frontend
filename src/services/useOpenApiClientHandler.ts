/* eslint-disable react-hooks/exhaustive-deps */
import { Locale } from '@/configs/i18n'
import { workflowService } from '@/servers/system-service'
import { OpenAPIType, PageData } from '@/shared/types'
import { getDictionary } from '@/shared/utils/getDictionary'
import { getLocalizedUrl } from '@/shared/utils/i18n'
import { isValidResponse } from '@/shared/utils/isValidResponse'
import SwalAlert from '@/shared/utils/SwalAlert'
import { SelectChangeEvent } from '@mui/material'
import { Session } from 'next-auth'
import { useCallback, useMemo, useRef, useState } from 'react'

export type SearchForm = {
    query: string
    environment: string
    status: 'ALL' | 'ACTIVE' | 'INACTIVE' | 'REVOKED' | 'EXPIRED'
}

export const useOpenApiClientHandler = (
    openapiDataInitial: PageData<OpenAPIType>,
    session: Session | null,
    locale: Locale,
    dictionary?: Awaited<ReturnType<typeof getDictionary>>
) => {
    // 🟠 STATE
    const [openapi, setOpenApi] = useState<PageData<OpenAPIType>>(openapiDataInitial)
    const [page, setPage] = useState<number | undefined>(Math.max(openapiDataInitial?.page_index || 1, 1))
    const [jumpPage, setJumpPage] = useState<number | undefined>(Math.max(openapiDataInitial?.page_index || 1, 1))
    const [rowsPerPage, setRowsPerPage] = useState<number>(Math.max(openapiDataInitial?.page_size || 10, 1))
    const [totalCount, setTotalCount] = useState<number>(openapiDataInitial?.total_count || 0)
    const [loading, setLoading] = useState(false)
    const [searchPayload, setSearchPayload] = useState<SearchForm>({
        query: '',
        environment: 'ALL',
        status: 'ALL'
    })

    const fetchInProgress = useRef(false)

    const [statusOptions] = useState<{ value: string, label: string }[]>([
        { value: 'Active', label: 'Active' },
        { value: 'InActive', label: 'Inactive' }
    ])

    const [selected, setSelected] = useState<string[]>([])

    // 🟠 COMPUTED
    const currentPageIds = useMemo(
        () => (openapi?.items ?? []).map(x => x.id).filter(Boolean),
        [openapi?.items]
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
        if (!id) return
        setSelected(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]))
    }
    const clearSelection = () => setSelected([])

    const selectedId = selected[0] ?? null
    const selectedRow = openapi?.items?.find((x) => x.id === selectedId) || null
    const hasSelection = selected.length > 0
    const canDelete = !!selectedRow && (selectedRow.status === 'Active' || selectedRow.status === 'InActive')

    // =========================
    // 🟢 FETCH LOGIC (PROTECTED)
    // =========================
    const fetchData = useCallback(async (
        payload: SearchForm,
        pageIdx: number | undefined,
        pageSize: number
    ) => {
        // Guard against infinite loops or concurrent calls using Ref
        if (fetchInProgress.current) return

        const safePage = Math.max(Number(pageIdx) || 1, 1)
        const safeSize = Math.max(Number(pageSize) || 1, 1)

        fetchInProgress.current = true
        setLoading(true)
        try {
            const searchParts: string[] = []
            if (payload?.query) searchParts.push(payload.query)
            if (payload?.status && payload.status !== 'ALL') searchParts.push(payload.status)
            const searchtext = searchParts.join(' ')

            const resp = await workflowService.loadApiKeys({
                sessiontoken: session?.user?.token as string,
                language: locale,
                pageindex: safePage,
                pagesize: safeSize,
                searchtext: searchtext,
            })

            if (isValidResponse(resp)) {
                const data = resp.payload.dataresponse.data as unknown as PageData<OpenAPIType>
                if (data) {
                    setOpenApi(data)
                    setTotalCount(Number(data.total_count) || 0)

                    const apiPage = (Number(data.page_index) || 0) <= 0 ? 1 : data.page_index
                    setPage(apiPage)
                    setJumpPage(apiPage)

                    if (data.page_size && data.page_size > 0) {
                        setRowsPerPage(Number(data.page_size))
                    }
                }
            }
        } catch (err) {
            console.error('Fetch error:', err)
        } finally {
            setLoading(false)
            fetchInProgress.current = false
        }
    }, [session?.user?.token, locale])

    // KHÔNG dùng useEffect để tránh vòng lặp re-render. 
    // Mọi hành động reload dữ liệu phải gọi fetchData trực tiếp.

    const handleSearch = (data: SearchForm) => {
        setSearchPayload(data)
        fetchData(data, 1, rowsPerPage)
    }

    const handleJumpPage = (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = Number(event.target.value)
        setJumpPage(value)
        const maxPage = Math.ceil(totalCount / Math.max(rowsPerPage, 1))
        if (value > 0 && value <= (maxPage || 1)) {
            fetchData(searchPayload, value, rowsPerPage)
        }
    }

    const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
        fetchData(searchPayload, value, rowsPerPage)
    }

    const handlePageSizeChange = (event: SelectChangeEvent<number>) => {
        const newSize = Number(event.target.value)
        if (newSize > 0) {
            setRowsPerPage(newSize)
            fetchData(searchPayload, 1, newSize)
        }
    }

    // =========================
    // 🟢 ROW ACTIONS
    // =========================
    const handleRowDblClick = (id: string) => {
        if (!id) return
        const url = getLocalizedUrl(`/api-manager/credentials/view/${id}`, locale as Locale)
        window.open(url, '_blank')
    }

    const handleDeleteClick = async () => {
        if (!selectedId || !selectedRow || !dictionary || loading) return

        SwalAlert(
            'question',
            dictionary['openapi'].deleteclient.replace('{0}', selectedRow.client_id),
            'center',
            false,
            true,
            true,
            async () => {
                const apiDeleteResult = await deleteOpenAPI(selectedId, selectedRow.client_id)
                if (apiDeleteResult.ok) {
                    SwalAlert(
                        'success',
                        dictionary['openapi'].delete_success_text.replace('{0}', selectedRow.client_id),
                        'center',
                        false,
                        false,
                        true // withConfirm: true -> will reload on OK
                    )
                } else {
                    SwalAlert('error', apiDeleteResult.message, 'center')
                }
            }
        )
    }

    const openViewPage = () => {
        if (selectedRow) {
            const url = getLocalizedUrl(`/api-manager/credentials/view/${selectedRow.id}`, locale as Locale)
            window.open(url, '_blank')
        }
    }

    const openModifyPage = () => {
        if (selectedRow) {
            const url = getLocalizedUrl(`/api-manager/credentials/modify/${selectedRow.id}`, locale as Locale)
            window.open(url, '_blank')
        }
    }

    const openAddPage = () => {
        const url = getLocalizedUrl(`/api-manager/credentials/add`, locale as Locale)
        window.open(url, '_blank')
    }

    const deleteOpenAPI = async (id: string, clientId: string): Promise<{ ok: boolean; message: string }> => {
        if (loading) return { ok: false, message: 'Processing...' }
        setLoading(true)
        try {
            const resp = await workflowService.deleteAPIKey({
                sessiontoken: session?.user?.token as string,
                fields: {
                    client_id: clientId,
                },
                language: locale,
            });

            if (!isValidResponse(resp)) {
                const msg = (resp as any)?.payload?.dataresponse?.errors?.[0]?.info
                    ?? (resp as any)?.message
                    ?? 'Delete client failed'
                return { ok: false, message: msg }
            }

            return { ok: true, message: `Client ${clientId} deleted` }
        } catch (e: any) {
            return { ok: false, message: e?.message || 'Delete client failed' }
        } finally {
            setLoading(false)
        }
    }

    return {
        openapi, page, setPage, jumpPage, setJumpPage, rowsPerPage, setRowsPerPage,
        totalCount, loading, statusOptions,
        handleSearch, handleJumpPage, handlePageChange, handlePageSizeChange,
        selected, setSelected, clearSelection,
        currentPageIds, isAllSelected, isIndeterminate,
        toggleAll, toggleOne,
        selectedId, selectedRow, hasSelection, canDelete,
        handleRowDblClick, handleDeleteClick,
        openViewPage, openModifyPage, openAddPage,
        deleteOpenAPI,
    }
}
