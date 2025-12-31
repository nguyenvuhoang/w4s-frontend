import { Locale } from '@/configs/i18n'
import { systemServiceApi } from '@/servers/system-service'
import { ContractType } from '@/types/bankType'
import { PageData } from '@/types/systemTypes'
import { isValidResponse } from '@/utils/isValidResponse'
import { SelectChangeEvent } from '@mui/material'
import { Session } from 'next-auth'
import { useEffect, useMemo, useState } from 'react'

export type SearchForm = {
    contractnumber: string
    phonenumber: string
    cifnumber: string
    fullname: string
    idcard: string
    status: string
    contracttype: string
    contractlevel: string
}

export const useContractHandler = (
    contractdata: PageData<ContractType>,
    session: Session | null,
    locale: Locale
) => {
    const [contracts, setContracts] = useState<PageData<ContractType>>(contractdata)
    const [page, setPage] = useState<number>(Math.max((contractdata?.page_index ?? 1), 0))
    const [jumpPage, setJumpPage] = useState<number>(contractdata.page_index || 1)
    const [rowsPerPage, setRowsPerPage] = useState<number>(contractdata.page_size || 10)
    const [totalCount, setTotalCount] = useState<number>(contractdata.total_count || 0)
    const [loading, setLoading] = useState(false)
    const [searchPayload, setSearchPayload] = useState<SearchForm>()
    const [statusOptions, setStatusOptions] = useState<{ value: string, label: string }[]>([])
    const [contractTypeOptions, setContractTypeOptions] = useState<{ value: string, label: string }[]>([])
    const [contractLevelOptions, setContractLevelOptions] = useState<{ value: string | number, label: string }[]>([
        { value: 'ALL', label: 'All' },
        { value: '1', label: 'Level 1' },
        { value: '2', label: 'Level 2' }
    ])
    const [selected, setSelected] = useState<string[]>([]) // dùng contractnumber làm id
    const currentPageIds = useMemo(
        () => (contracts?.items ?? []).map(x => x.contractnumber),
        [contracts?.items]
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
                searchtext: ''
            }
            const contractdataApi = await systemServiceApi.runFODynamic({
                sessiontoken: session?.user?.token as string,
                workflowid: 'SYS_EXECUTE_SQL',
                input: {
                    commandname: 'SimpleSearchContract',
                    issearch: true,
                    pageindex: pageOverride,
                    pagesize: sizeOverride,
                    parameters: dataSearch
                }
            })

            if (
                !isValidResponse(contractdataApi) ||
                (contractdataApi.payload.dataresponse.error && contractdataApi.payload.dataresponse.error.length > 0)
            ) {
                console.log(
                    'ExecutionID:',
                    contractdataApi.payload.dataresponse.error[0].execute_id +
                    ' - ' +
                    contractdataApi.payload.dataresponse.error[0].info
                )
                return
            }

            const datacontract = contractdataApi.payload.dataresponse.fo[0].input as PageData<ContractType>
            setContracts(datacontract)
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
        contractnumber: '',
        phonenumber: '',
        cifnumber: '',
        fullname: '',
        idcard: '',
        status: 'ALL',
        contracttype: 'ALL',
        contractlevel: 'ALL'
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

    const fetchStatusOptions = async () => {
        const getCdlistApi = await systemServiceApi.getCdList({
            codename: 'CONTRACTSTATUS',
            codegroup: 'BO',
            sessiontoken: session?.user?.token as string,
            language: locale || 'en'
        })

        if (!isValidResponse(getCdlistApi) || !getCdlistApi.payload.dataresponse || !getCdlistApi.payload.dataresponse.fo) {
            console.error('Failed to fetch status options:', getCdlistApi)
            return
        }
        const data_query = getCdlistApi.payload.dataresponse.fo[0].input.items || []
        let data_result: any[] = []
        data_result = data_result.concat(data_query)

        const options = data_result.map((item: any) => ({
            value: item.codeid,
            label: item.caption
        }))
        options.unshift({ value: 'ALL', label: 'All' })
        setStatusOptions(options)
    }

    const fetchContractTypeOptions = async () => {
        const getCdlistApi = await systemServiceApi.getCdList({
            codename: 'CONTRACTTYPE',
            codegroup: 'BO',
            sessiontoken: session?.user?.token as string,
            language: locale || 'en'
        })

        if (!isValidResponse(getCdlistApi) || !getCdlistApi.payload.dataresponse || !getCdlistApi.payload.dataresponse.fo) {
            console.error('Failed to fetch contract type options:', getCdlistApi)
            return
        }
        const data_query = getCdlistApi.payload.dataresponse.fo[0].input.items || []
        let data_result: any[] = []
        data_result = data_result.concat(data_query)

        const options = data_result.map((item: any) => ({
            value: item.codeid,
            label: item.caption
        }))
        options.unshift({ value: 'ALL', label: 'All' })
        setContractTypeOptions(options)
    }

    useEffect(() => {
        fetchStatusOptions()
        fetchContractTypeOptions()
    }, [])

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
     * Xoá 1 hợp đồng theo contractNo.
     * Trả về { ok, message } để UI hiển thị Swal/toast.
     */
    const deleteContract = async (contractNo: string): Promise<{ ok: boolean; message: string }> => {
        if (!contractNo) return { ok: false, message: 'Invalid contract number' }
        setLoading(true)
        try {
            const resp = await systemServiceApi.runFODynamic({
                sessiontoken: session?.user?.token as string,
                workflowid: 'BO_DELETE_CONTRACT',
                input: {
                    contractnumber: contractNo,
                    applicationcode: 'BO',
                    description: `Delete contract ${contractNo}`
                }
            })

            if (!isValidResponse(resp)) {
                const msg = (resp as any)?.payload?.dataresponse?.error?.[0]?.info
                    ?? (resp as any)?.message
                    ?? 'Delete contract failed'
                return { ok: false, message: msg }
            }

            // Có backend trả error trong payload?
            const errArr = (resp as any)?.payload?.dataresponse?.error
            if (Array.isArray(errArr) && errArr.length > 0) {
                const msg = errArr[0]?.info || 'Delete contract failed'
                return { ok: false, message: msg }
            }

            // Refresh lại danh sách theo filter hiện tại
            const payload = searchPayload ?? defaultPayload

            // Nếu trang hiện tại chỉ còn 1 record và xoá nó => lùi về trang trước (tránh trống trang)
            const willBeEmptyPage = (contracts?.items?.length ?? 0) === 1
            const nextPage = willBeEmptyPage ? Math.max((page ?? 1) - 1, 0) : page

            await fetchData(payload, nextPage, rowsPerPage)

            // clear selection
            clearSelection()

            return { ok: true, message: `Contract ${contractNo} deleted` }
        } catch (e: any) {
            return { ok: false, message: e?.message || 'Delete contract failed' }
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
                // tuần tự (nếu muốn song song: Promise.allSettled, nhưng cẩn trọng rate-limit/backend)
                // eslint-disable-next-line no-await-in-loop
                const r = await deleteContract(id)
                results.push({ id, ...r })
            }

            const allOk = results.every(r => r.ok)
            const msg = allOk ? 'All selected contracts deleted' : 'Some contracts failed to delete'
            return { ok: allOk, message: msg, results }
        } finally {
            setLoading(false)
        }
    }

    return {
        // data
        contracts, page, setPage, jumpPage, setJumpPage, rowsPerPage, setRowsPerPage,
        totalCount, loading, contractTypeOptions, statusOptions, contractLevelOptions,

        // actions
        handleSearch, handleJumpPage, handlePageChange, handlePageSizeChange,

        // selection
        selected, setSelected, clearSelection,
        currentPageIds, isAllSelected, isIndeterminate,
        toggleAll, toggleOne,

        // delete (NEW)
        deleteContract,
        deleteManySelected
    }
}
