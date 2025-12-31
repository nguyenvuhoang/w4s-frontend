// hooks/useContractHandler.ts
import { Locale } from '@/configs/i18n'
import { systemServiceApi } from '@/servers/system-service'
import { ContractType } from '@/types/bankType'
import { PageData } from '@/types/systemTypes'
import { isValidResponse } from '@/utils/isValidResponse'
import { SelectChangeEvent } from '@mui/material'
import { Session } from 'next-auth'
import { useCallback, useEffect, useMemo, useState } from 'react'

export type SearchForm = {
    contractnumber: string
    phonenumber: string
    cifnumber: string
    fullname: string
    idcard: string
    status: string
}

const EMPTY_SEARCH: SearchForm = {
    contractnumber: '',
    phonenumber: '',
    cifnumber: '',
    fullname: '',
    idcard: '',
    status: 'ALL',
}

export const useContractApproveHandler = (
    contractdata: PageData<ContractType>,
    session: Session | null,
    locale: Locale
) => {
    const [contracts, setContracts] = useState<PageData<ContractType>>(contractdata)

    const [page, setPage] = useState<number>(Math.max((contractdata?.page_index ?? 1), 0))
    const [jumpPage, setJumpPage] = useState<number>(contractdata.page_index || 1) // 1-based display value
    const [rowsPerPage, setRowsPerPage] = useState<number>(contractdata.page_size || 10)
    const [totalCount, setTotalCount] = useState<number>(contractdata.total_count || 0)
    const [loading, setLoading] = useState(false)
    const [searchPayload, setSearchPayload] = useState<SearchForm | undefined>()
    const [statusOptions, setStatusOptions] = useState<{ value: string; label: string }[]>([])
    const [contractTypeOptions, setContractTypeOptions] = useState<{ value: string, label: string }[]>([])
    const [contractLevelOptions, setContractLevelOptions] = useState<{ value: string | number, label: string }[]>([
        { value: 'ALL', label: 'All' },
        { value: '1', label: 'Level 1' },
        { value: '2', label: 'Level 2' }
    ])
    const token = session?.user?.token as string | undefined

    const effectiveSearch = useMemo(
        () => (searchPayload ? searchPayload : EMPTY_SEARCH),
        [searchPayload]
    )

    const fetchData = useCallback(
        async (payload: SearchForm, page0: number, size: number) => {
            if (!token) return
            setLoading(true)
            try {
                const dataSearch = { ...payload, searchtext: '' }

                const contractdataApi = await systemServiceApi.runFODynamic({
                    sessiontoken: token,
                    workflowid: 'SYS_EXECUTE_SQL',
                    input: {
                        commandname: 'ApproveContract',
                        issearch: true,
                        pageindex: page0 + 1,
                        pagesize: size,
                        parameters: dataSearch,
                    },
                })

                if (
                    !isValidResponse(contractdataApi) ||
                    (contractdataApi.payload.dataresponse.error &&
                        contractdataApi.payload.dataresponse.error.length > 0)
                ) {
                    const err = contractdataApi.payload.dataresponse.error?.[0]
                    if (err) {
                        console.log('ExecutionID:', err.execute_id + ' - ' + err.info)
                    }
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
        },
        [token]
    )

    useEffect(() => {
        fetchData(effectiveSearch, page, rowsPerPage)
    }, [fetchData, effectiveSearch, page, rowsPerPage])

    const handleSearch = (data: SearchForm) => {
        setPage(0)
        setJumpPage(1)
        setSearchPayload(data)
    }

    const handleJumpPage = (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = Number(event.target.value)
        const maxPage = Math.max(Math.ceil(totalCount / rowsPerPage), 1)
        if (value > 0 && value <= maxPage) {
            setJumpPage(value)
            setPage(value - 1)
        }
    }

    const fetchStatusOptions = useCallback(async () => {
        if (!token) return
        const getCdlistApi = await systemServiceApi.getCdList({
            codename: 'CONTRACTSTATUS',
            codegroup: 'BO',
            sessiontoken: token,
            language: locale || 'en',
        })

        if (!isValidResponse(getCdlistApi) || !getCdlistApi.payload.dataresponse?.fo) {
            console.error('Failed to fetch status options:', getCdlistApi)
            return
        }

        const data_query = getCdlistApi.payload.dataresponse.fo[0].input.items || []
        const filtered = data_query.filter(
            (item: any) => item.codeid === 'P' || item.codeid === 'G'
        )

        const options = filtered.map((item: any) => {
            let label = item.caption || item.codeid
            if (item.languagecaption) {
                try {
                    const parsed = JSON.parse(item.languagecaption)
                    label = parsed?.[locale] || label
                } catch {
                    // ignore bad JSON
                }
            }
            return { value: item.codeid, label }
        })

        options.unshift({ value: 'ALL', label: 'All' })
        setStatusOptions(options)
    }, [token, locale])

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


    const handlePageChange = (_: React.ChangeEvent<unknown>, value: number) => {
        setPage(value - 1) // convert 1-based UI to 0-based internal
        setJumpPage(value)
    }

    const handlePageSizeChange = (event: SelectChangeEvent<number>) => {
        const newSize = Number(event.target.value)
        setPage(0)
        setJumpPage(1)
        setRowsPerPage(newSize)
    }

    return {
        contracts,
        page,
        setPage,
        jumpPage,
        setJumpPage,
        rowsPerPage,
        setRowsPerPage,
        totalCount,
        loading,
        handleSearch,
        statusOptions,
        contractTypeOptions,
        handleJumpPage,
        handlePageChange,
        handlePageSizeChange,
        contractLevelOptions
    }
}
