import { Locale } from '@/configs/i18n'
import { workflowService } from '@/servers/system-service'
import { AccountChartType } from '@/types/bankType'
import { PageData } from '@/types/systemTypes'
import { isValidResponse } from '@/utils/isValidResponse'
import { SelectChangeEvent } from '@mui/material'
import { Session } from 'next-auth'
import { useEffect, useMemo, useState } from 'react'

export type SearchForm = {
    searchtext?: string;
    accountnumber?: string;
    accountname?: string;
    accountlevelfrom?: number | string;
    accountlevelto?: number | string;
    currency?: string;
    classification?: string;
    balanceside?: string;
    group?: string;
    status?: string;
    branchcode?: string;
};


export const useAccountChartHandler = (
    accountchartdata: PageData<AccountChartType>,
    session: Session | null,
    locale: Locale
) => {
    const [accountChart, setAccountChart] = useState<PageData<AccountChartType>>(accountchartdata)
    const [page, setPage] = useState<number>(Math.max((accountchartdata?.page_index ?? 1), 0))
    const [jumpPage, setJumpPage] = useState<number>(accountchartdata.page_index || 1)
    const [rowsPerPage, setRowsPerPage] = useState<number>(accountchartdata.page_size || 10)
    const [totalCount, setTotalCount] = useState<number>(accountchartdata.total_count || 0)
    const [loading, setLoading] = useState(false)
    const [searchPayload, setSearchPayload] = useState<SearchForm>()

    const [selected, setSelected] = useState<string[]>([]) // dùng account_number làm id
    const currentPageIds = useMemo(
        () => (accountChart?.items ?? []).map(x => x.accountnumber as string),
        [accountChart?.items]
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

    const fetchData = async (
        payload: SearchForm = searchPayload!,
        pageOverride: number = page,
        sizeOverride: number = rowsPerPage
    ) => {
        setLoading(true)
        try {
            const dataSearch = {
                ...payload,
                // searchtext: ''
            }
            const contractdataApi = await workflowService.runFODynamic({
                sessiontoken: session?.user?.token as string,
                workflowid: 'BO_EXECUTE_SQL_FROM_ACT',
                input: {
                    commandname: 'SimpleSearchAccountChart',
                    issearch: true,
                    pageindex: pageOverride,
                    pagesize: sizeOverride,
                    parameters: dataSearch
                }
            });

            if (
                !isValidResponse(contractdataApi) ||
                (contractdataApi.payload.dataresponse.errors && contractdataApi.payload.dataresponse.errors.length > 0)
            ) {
                console.log(
                    'ExecutionID:',
                    contractdataApi.payload.dataresponse.errors[0].execute_id +
                    ' - ' +
                    contractdataApi.payload.dataresponse.errors[0].info
                )
                return
            }

            const dataaccountchart = contractdataApi.payload.dataresponse.data.input as PageData<AccountChartType>
            setAccountChart(dataaccountchart)
            setTotalCount(dataaccountchart.total_count || 0)
        } catch (err) {
            console.error('Error fetching account chart data:', err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
    const payload = searchPayload ?? defaultPayload;
    fetchData(payload, page, rowsPerPage);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, rowsPerPage, searchPayload]);

    const defaultPayload: SearchForm = {
        searchtext: '',
        accountnumber: '',
        accountname: '',
        accountlevelfrom: '',
        accountlevelto: '',
        currency: '',
        classification: 'ALL',
        balanceside: 'ALL',
        group: 'ALL',
        status: 'ALL',
        branchcode: '',
    };


    const handleSearch = (data: SearchForm) => {
        setPage(1);
        setJumpPage(1);
        setSearchPayload(data);
        fetchData(data, 1, rowsPerPage);
    }

    const handleJumpPage = (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = Number(event.target.value)
        if (value > 0 && value <= Math.ceil(totalCount / rowsPerPage)) {
            setJumpPage(value)
            setPage(value)
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
        setPage(1)
        setRowsPerPage(newSize)
        fetchData(payload, 1, newSize)
    }

    // =========================
    // 🔴 DELETE LOGIC
    // =========================

    /**
     * Xoá 1 hợp đồng theo contractNo.
     * Trả về { ok, message } để UI hiển thị Swal/toast.
     */
    const deleteAccountchart = async (accountnumber: string): Promise<{ ok: boolean; message: string }> => {
        if (!accountnumber) return { ok: false, message: 'Invalid account number' }
        setLoading(true)
        try {
            const resp = await workflowService.runFODynamic({
                sessiontoken: session?.user?.token as string,
                workflowid: 'BO_DELETE_ACCOUNTCHART',
                input: {
                    accountnumber: accountnumber,
                }
            })

            if (!isValidResponse(resp)) {
                const msg = (resp as any)?.payload?.dataresponse?.error?.[0]?.info
                    ?? (resp as any)?.message
                    ?? 'Delete account chart failed'
                return { ok: false, message: msg }
            }

            const errArr = (resp as any)?.payload?.dataresponse?.error
            if (Array.isArray(errArr) && errArr.length > 0) {
                const msg = errArr[0]?.info || 'Delete account chart failed'
                return { ok: false, message: msg }
            }

            const payload = searchPayload ?? defaultPayload

            const willBeEmptyPage = (accountChart?.items?.length ?? 0) === 1
            const nextPage = willBeEmptyPage ? Math.max((page ?? 1) - 1, 0) : page

            await fetchData(payload, nextPage, rowsPerPage)

            // clear selection
            clearSelection()

            return { ok: true, message: `Account chart ${accountnumber} deleted` }
        } catch (e: any) {
            return { ok: false, message: e?.message || 'Delete account chart failed' }
        } finally {
            setLoading(false)
        }
    }

    /**
     * Xoá tất cả các contract đang chọn (selected).
     * Trả về { ok, message, results } – trong đó results liệt kê từng id ok/failed.
     */
    const deleteManySelected = async (): Promise<{
        ok: boolean
        message: string
        results: { id: string; ok: boolean; message: string }[]
    }> => {
        if (selected.length === 0) {
            return { ok: false, message: 'No rows selected', results: [] }
        }
        setLoading(true)
        const results: { id: string; ok: boolean; message: string }[] = []
        try {
            for (const id of selected) {
                const r = await deleteAccountchart(id)
                results.push({ id, ...r })
            }

            const allOk = results.every(r => r.ok)
            const msg = allOk ? 'All selected accounts deleted' : 'Some accounts failed to delete'
            return { ok: allOk, message: msg, results }
        } finally {
            setLoading(false)
        }
    }

    return {
        accountChart, page, setPage, jumpPage, setJumpPage, rowsPerPage, setRowsPerPage,
        totalCount, loading,

        handleSearch, handleJumpPage, handlePageChange, handlePageSizeChange,

        selected, setSelected, clearSelection,
        currentPageIds, isAllSelected, isIndeterminate,
        toggleAll, toggleOne,

        deleteAccountchart,
        deleteManySelected
    }
}
