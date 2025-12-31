// hooks/useContractHandler.ts
import { Locale } from '@/configs/i18n'
import { systemServiceApi } from '@/servers/system-service'
import { Transaction } from '@/types/bankType'
import { PageData } from '@/types/systemTypes'
import { isValidResponse } from '@/utils/isValidResponse'
import { SelectChangeEvent } from '@mui/material'
import { Session } from 'next-auth'
import { useEffect, useMemo, useState } from 'react'

// ====== SEARCH FORM (updated to match the UI) ======
export type SearchForm = {
    refnumber: string
    transactionref: string
    debitaccount: string
    creditaccount: string
    contractno: string
    customername: string
    cifnumber: string            // "Customer code in corebank"
    license: string
    fromdate: string             // e.g. '15/08/2025'
    todate: string               // e.g. '15/08/2025'
    status: string               // 'ALL' or code
    transactiontype: string      // 'ALL' or code
    schedule: boolean
}

export const useTransactionHistoryHandler = (
    transactionhistorydata: PageData<Transaction>,
    session: Session | null,
    locale: Locale
) => {
    const [transactions, setTransactions] = useState<PageData<Transaction>>(transactionhistorydata)
    const [page, setPage] = useState<number>(Math.max(transactionhistorydata?.page_index ?? 1, 0))
    const [jumpPage, setJumpPage] = useState<number>(transactionhistorydata.page_index || 1)
    const [rowsPerPage, setRowsPerPage] = useState<number>(transactionhistorydata.page_size || 10)
    const [totalCount, setTotalCount] = useState<number>(transactionhistorydata.total_count || 0)
    const [loading, setLoading] = useState(false)

    // ====== filters/options ======
    const [searchPayload, setSearchPayload] = useState<SearchForm>()
    const [statusOptions, setStatusOptions] = useState<{ value: string; label: string }[]>([])
    const [txTypeOptions, setTxTypeOptions] = useState<{ value: string; label: string }[]>([])

    // ====== selection (kept as-is in case you reuse it) ======
    const [selected, setSelected] = useState<string[]>([]) // use transaction_number as id
    const currentPageIds = useMemo(() => (transactions?.items ?? []).map(x => x.transaction_number), [transactions?.items])
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

    // ====== helpers ======
    const normalizePayload = (p: SearchForm) => {
        // Ensure empty strings don’t get sent as weird values; keep your current param names.
        return {
            refnumber: p.refnumber?.trim() || '',
            transactionref: p.transactionref?.trim() || '',
            debitaccount: p.debitaccount?.trim() || '',
            creditaccount: p.creditaccount?.trim() || '',
            contractno: p.contractno?.trim() || '',
            customername: p.customername?.trim() || '',
            cifnumber: p.cifnumber?.trim() || '',
            license: p.license?.trim() || '',
            fromdate: p.fromdate || '',
            todate: p.todate || '',
            status: p.status || 'ALL',
            transactiontype: p.transactiontype || 'ALL',
            schedule: !!p.schedule
        }
    }

    const fetchData = async (
        payload: SearchForm = searchPayload!,
        pageOverride: number = page,
        sizeOverride: number = rowsPerPage
    ) => {
        setLoading(true)
        try {
            const parameters = normalizePayload(payload)

            const transactiondataApi = await systemServiceApi.runFODynamic({
                sessiontoken: session?.user?.token as string,
                workflowid: 'SYS_EXECUTE_SQL',
                input: {
                    commandname: 'SimpleSearchTransactionHistory',
                    issearch: true,
                    pageindex: pageOverride,
                    pagesize: sizeOverride,
                    parameters: {
                        ...parameters,
                        searchtext: '' // keep your existing param
                    }
                }
            })

            if (
                !isValidResponse(transactiondataApi) ||
                (transactiondataApi.payload.dataresponse.error && transactiondataApi.payload.dataresponse.error.length > 0)
            ) {
                console.log(
                    'ExecutionID:',
                    transactiondataApi.payload.dataresponse.error?.[0]?.execute_id + ' - ' + transactiondataApi.payload.dataresponse.error?.[0]?.info
                )
                return
            }

            const datatransaction = transactiondataApi.payload.dataresponse.fo[0].input as PageData<Transaction>
            setTransactions(datatransaction)
            setTotalCount(datatransaction.total_count || 0)
        } catch (err) {
            console.error('Error fetching transaction data:', err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (searchPayload) fetchData(searchPayload)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, rowsPerPage, searchPayload])

    const handleSearch = (data: SearchForm) => {
        setPage(0)
        setJumpPage(1)
        setSearchPayload(data)
        fetchData(data, 0, rowsPerPage)
    }

    const handleJumpPage = (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = Number(event.target.value)
        const maxPage = Math.max(1, Math.ceil(totalCount / rowsPerPage))
        if (value > 0 && value <= maxPage) {
            setJumpPage(value)
            setPage(value - 1) // page state starts from 0
        }
    }

    // ====== options loading ======
    const fetchStatusOptions = async () => {
        const res = await systemServiceApi.getCdList({
            codename: 'TRANSACTIONSTATUS', // changed from CONTRACTSTATUS
            codegroup: 'BO',
            sessiontoken: session?.user?.token as string,
            language: locale || 'en'
        })

        if (!isValidResponse(res) || !res.payload.dataresponse?.fo) return
        const items = res.payload.dataresponse.fo[0].input.items || []
        const opts = items.map((it: any) => ({ value: it.codeid, label: it.caption }))
        opts.unshift({ value: 'ALL', label: 'All' })
        setStatusOptions(opts)
    }

    const fetchTxTypeOptions = async () => {
        const res = await systemServiceApi.getCdList({
            codename: 'TRANSACTIONTYPE',
            codegroup: 'BO',
            sessiontoken: session?.user?.token as string,
            language: locale || 'en'
        })

        if (!isValidResponse(res) || !res.payload.dataresponse?.fo) return
        const items = res.payload.dataresponse.fo[0].input.items || []
        const opts = items.map((it: any) => ({ value: it.codeid, label: it.caption }))
        opts.unshift({ value: 'ALL', label: 'All' })
        setTxTypeOptions(opts)
    }

    useEffect(() => {
        fetchStatusOptions()
        fetchTxTypeOptions()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
        const payload =
            searchPayload ??
            ({
                refnumber: '',
                transactionref: '',
                debitaccount: '',
                creditaccount: '',
                contractno: '',
                customername: '',
                cifnumber: '',
                license: '',
                fromdate: '',
                todate: '',
                status: 'ALL',
                transactiontype: 'ALL',
                schedule: false
            } as SearchForm)

        setPage(value)
        fetchData(payload, value, rowsPerPage)
    }

    const handlePageSizeChange = (event: SelectChangeEvent<number>) => {
        const newSize = Number(event.target.value)
        const payload =
            searchPayload ??
            ({
                refnumber: '',
                transactionref: '',
                debitaccount: '',
                creditaccount: '',
                contractno: '',
                customername: '',
                cifnumber: '',
                license: '',
                fromdate: '',
                todate: '',
                status: 'ALL',
                transactiontype: 'ALL',
                schedule: false
            } as SearchForm)

        setPage(0)
        setRowsPerPage(newSize)
        fetchData(payload, 0, newSize)
    }

    return {
        // data
        transactions,
        page,
        setPage,
        jumpPage,
        setJumpPage,
        rowsPerPage,
        setRowsPerPage,
        totalCount,
        loading,

        // options
        statusOptions,
        txTypeOptions,

        // actions
        handleSearch,
        handleJumpPage,
        handlePageChange,
        handlePageSizeChange,

        // selection
        selected,
        setSelected,
        clearSelection,
        currentPageIds,
        isAllSelected,
        isIndeterminate,
        toggleAll,
        toggleOne
    }
}
