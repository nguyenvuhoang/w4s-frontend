import { env } from '@/env.mjs'
import { dataService } from '@/servers/system-service'
import { SMSContentType } from '@/types/bankType'
import { PageData } from '@/types/systemTypes'
import { isValidResponse } from '@/utils/isValidResponse'
import dayjs from 'dayjs'
import { Session } from 'next-auth'
import { useCallback, useEffect, useState } from 'react'
import { exportToExcel } from './exportToExcel'
import { exportToPDF } from './exportToPDF'
import SwalAlert from '@/utils/SwalAlert'

export const useSMSMessageHandler = (
  session: Session | null,
  smsData: PageData<SMSContentType>,
  setSmsData: React.Dispatch<React.SetStateAction<PageData<SMSContentType>>>
) => {
  const [page, setPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [visibleIds, setVisibleIds] = useState<number[]>([])
  const [modalContent, setModalContent] = useState<any>(null)
  const [isModalOpen, setModalOpen] = useState(false)

  const [searchPhone, setSearchPhone] = useState('')
  const [jumpPage, setJumpPage] = useState(1)
  const [isExportModalOpen, setExportModalOpen] = useState(false)
  const [pageSize, setPageSize] = useState(smsData.page_size || 10)
  const [loading, setLoading] = useState(false)
  const [lastSearchRequest, setLastSearchRequest] = useState<any | null>(null)

  const today = dayjs().format('DD/MM/YYYY')

  const [filters, setFilters] = useState({
    phonenumber: '',
    providername: 'ALL',
    fromdate: today,
    todate: today,
    status: 'ALL',
  })

  const [appliedFilters, setAppliedFilters] = useState({ ...filters })

  const totalResults = smsData.total_count || 0

  const handleToggleView = (id: number) => {
    setVisibleIds(prev => (prev.includes(id) ? prev.filter(v => v !== id) : [...prev, id]))
  }

  const buildRequest = (pageindex: number, pagesize: number, f: typeof appliedFilters) => ({
    sessiontoken: session?.user?.token as string,
    workflowid: `${env.NEXT_PUBLIC_APPLICATION_CODE}_SEARCH_SMS_MESSAGE`,
    commandname: 'SimpleSearchSMSSendOut',
    searchtext: '',
    pageSize: pagesize,
    pageIndex: pageindex,
    parameters: {
      phonenumber: f.phonenumber ?? '',
      providername: f.providername ?? '',
      fromdate: f.fromdate ?? '',
      todate: f.todate ?? '',
      status: f.status ?? '',
    },
  })

  const executeSearchAPI = useCallback(
    async (pageindex: number, pagesize: number, f = appliedFilters) => {
      setLoading(true)
      try {
        const requestBody = buildRequest(pageindex, pagesize, f)
        setLastSearchRequest(requestBody)
        const dataSearchAPI = await dataService.searchData(requestBody)

        if (!isValidResponse(dataSearchAPI) || dataSearchAPI.payload?.dataresponse?.error?.length > 0) {
          console.log(
            'ExecutionID:',
            dataSearchAPI.payload?.dataresponse?.error?.[0]?.execute_id,
            '-',
            dataSearchAPI.payload?.dataresponse?.error?.[0]?.info
          )
          return
        }

        const data = dataSearchAPI.payload.dataresponse.fo[0].input
        setSmsData(data)
      } catch (error) {
        console.error('Error executing search API:', error)
      } finally {
        setLoading(false)
      }
    },
    [session?.user?.token, appliedFilters, setSmsData]
  )

  const handlePageChange = (_: React.ChangeEvent<unknown>, value: number) => {
    if (value !== page) {
      setPage(value)
      executeSearchAPI(value, pageSize)
    }
  }

  const handleJumpPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(event.target.value)
    const maxPage = Math.ceil((totalResults || 0) / pageSize) || 1
    if (value > 0 && value <= maxPage) {
      setJumpPage(value)
      setPage(value)
      executeSearchAPI(value, pageSize)
    }
  }

  const handlePageSizeChange = (event: any) => {
    const newSize = Number(event.target.value)
    if (newSize !== pageSize) {
      setPageSize(newSize)
      setRowsPerPage(newSize)
      setPage(1)
      executeSearchAPI(1, newSize)
    }
  }
  useEffect(() => {
    setFilters(prev => ({ ...prev, phonenumber: searchPhone }))
  }, [searchPhone])

  const handlePreviewModal = (data: any, previewtype: string, datatype?: string) => {
    try {
      if (data === undefined || data === null) {
        console.warn('Data is undefined or null')
        return
      }
      let previewData: any = null

      if (previewtype === 'XML') {
        previewData = new DOMParser().parseFromString(data, 'text/xml')
      } else if (previewtype === 'JSON') {
        try {
          previewData = typeof data === 'string' ? JSON.parse(data) : data
        } catch (err) {
          console.error('Invalid JSON format:', err)
          return
        }
      } else {
        previewData = data
      }

      const preview = { previewtype, previewdata: previewData, datatype }
      setModalContent(preview)
      setModalOpen(true)
    } catch (error) {
      console.error('Failed to parse data:', error)
    }
  }

  const handleExport = async (type: 'PDF' | 'EXCEL') => {
    // export theo lần search gần nhất (appliedFilters)
    if (!lastSearchRequest) {
      console.warn('No previous search request to export')
      SwalAlert('Warning', 'No search request to export', 'center')
      return
    }
    const exportRequest = { ...lastSearchRequest, pageSize: 9_999_999, pageIndex: 1 }
    try {
      const response = await dataService.searchData(exportRequest)
      if (!isValidResponse(response) || response.payload.dataresponse.error?.length > 0) {
        console.warn('Export error:', response.payload.dataresponse.error[0])
        SwalAlert('Warning', 'No data search', 'center')
        return
      }
      const fullData = response.payload.dataresponse.fo[0].input?.items || []
      if (type === 'PDF') exportToPDF(fullData)
      else exportToExcel(fullData)
    } catch (error) {
      console.error('Export failed:', error)
    }
  }

  const handleFilterChange = (key: keyof typeof filters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const handleSearch = async () => {
    const committed = { ...filters }
    setAppliedFilters(committed)
    setPage(1)
    await executeSearchAPI(1, pageSize, committed)
  }

  return {
    page,
    rowsPerPage,
    visibleIds,
    modalContent,
    isModalOpen,
    searchPhone,
    jumpPage,
    isExportModalOpen,
    pageSize,
    loading,
    totalResults,

    setSearchPhone,
    setExportModalOpen,
    setModalOpen,

    handleToggleView,
    handlePageChange,
    handleJumpPage,
    handlePageSizeChange,
    handlePreviewModal,
    handleExport,

    filters,
    handleFilterChange,
    handleSearch,
  }
}
