import type { SelectChangeEvent } from '@mui/material/Select'
import { useRouter } from '@shared/hooks/useRouter'
import { useCallback, useEffect, useState } from 'react'
import type { Locale } from '@/configs/i18n'

import { useWorkingProject } from '@/@core/stores/useWorkingProjectStore'
import { contractService } from '../services/contractService'
import type {
    ContractFormValues,
    ContractItem,
    ContractsDictionary,
    ContractsFilterModel,
    ContractsSearchResponse,
    CreateContractRequest,
    UpdateContractRequest
} from '../types'
import { ContractWorkflowError } from '../types'
import { contractsText, emptyContractsFilter } from '../components/contractHelpers'

type WorkflowErrorState = {
    message: string
    executionId?: string
    workflowId?: string
}

type Params = {
    dictionary: ContractsDictionary
    sessiontoken?: string
    language: Locale
    initialFilter: ContractsFilterModel
    initialData: ContractsSearchResponse
    initialError?: string | null
}

type Notice = { severity: 'success' | 'error'; message: string }

const toWorkflowDate = (value: string) => new Date(`${value}T00:00:00Z`).toISOString()

const normalizeContractValue = (value: string | number): number | '' => {
    if (value === '') return ''

    const parsed = Number(value)

    return Number.isFinite(parsed) ? parsed : ''
}

export const useContracts = ({
    dictionary,
    sessiontoken,
    language,
    initialFilter,
    initialData,
    initialError = null
}: Params) => {
    const router = useRouter()
    const workingProject = useWorkingProject()
    const [filter, setFilter] = useState(initialFilter)
    const [draftFilter, setDraftFilter] = useState(initialFilter)
    const [rows, setRows] = useState(initialData.items)
    const [totalCount, setTotalCount] = useState(initialData.total_count)
    const [totalPages, setTotalPages] = useState(initialData.total_pages)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<WorkflowErrorState | null>(initialError ? { message: initialError } : null)
    const [formMode, setFormMode] = useState<'create' | 'edit' | null>(null)
    const [formKey, setFormKey] = useState(0)
    const [editingContract, setEditingContract] = useState<ContractItem | null>(null)
    const [formLoading, setFormLoading] = useState(false)
    const [formError, setFormError] = useState<string | null>(null)
    const [detailOpen, setDetailOpen] = useState(false)
    const [detailLoading, setDetailLoading] = useState(false)
    const [detailError, setDetailError] = useState<string | null>(null)
    const [detailContract, setDetailContract] = useState<ContractItem | null>(null)
    const [deleteTarget, setDeleteTarget] = useState<ContractItem | null>(null)
    const [deleteLoading, setDeleteLoading] = useState(false)
    const [notice, setNotice] = useState<Notice | null>(null)

    const handleWorkflowError = useCallback((caught: unknown, fallback: string, workflowId?: string): WorkflowErrorState => {
        if (caught instanceof ContractWorkflowError && caught.next_action === 'logout') {
            router.push(`/${language}/logout`)
        }

        return {
            message: caught instanceof Error ? caught.message : fallback,
            executionId: caught instanceof ContractWorkflowError ? caught.execution_id : undefined,
            workflowId
        }
    }, [language, router])

    const loadData = useCallback(async (nextFilter: ContractsFilterModel = filter) => {
        setLoading(true)
        setError(null)

        try {
            const response = await contractService.simpleSearchContracts({
                sessiontoken,
                language,
                filter: nextFilter
            })
            const resolvedFilter = {
                ...nextFilter,
                page_index: response.page_index,
                page_size: response.page_size
            }

            setRows(response.items)
            setTotalCount(response.total_count)
            setTotalPages(response.total_pages)
            setFilter(resolvedFilter)
            setDraftFilter(resolvedFilter)

            return response
        } catch (caught) {
            setError(handleWorkflowError(caught, contractsText(dictionary, 'load_failed', 'Unable to load contracts.'), 'WF_BO_SIMPLE_SEARCH_CONTRACTS'))

            return undefined
        } finally {
            setLoading(false)
        }
    }, [dictionary, filter, handleWorkflowError, language, sessiontoken])

    useEffect(() => {
        if (!workingProject) return
        if (filter.project_id === workingProject.id) return

        void loadData({ ...draftFilter, project_id: workingProject.id, page_index: 1 })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [workingProject?.id])

    const updateDraftFilter = <K extends keyof ContractsFilterModel>(key: K, value: ContractsFilterModel[K]) => {
        setDraftFilter(current => ({ ...current, [key]: value }))
    }

    const handleSearch = () => void loadData({ ...draftFilter, page_index: 1 })
    const handleReset = () => void loadData({ ...emptyContractsFilter, project_id: filter.project_id })
    const handleRefresh = () => void loadData(filter)

    const handleOpenCreate = () => {
        setEditingContract(null)
        setFormError(null)
        setFormMode('create')
        setFormKey(current => current + 1)
    }

    const handleOpenEdit = (contract: ContractItem) => {
        setEditingContract(contract)
        setFormError(null)
        setFormMode('edit')
        setFormKey(current => current + 1)
    }

    const handleOpenDetailPage = (contract: ContractItem) => {
        if (!contract.id) return

        router.push(`/${language}/contracts/contracts/${contract.id}`)
    }

    const handleCloseForm = () => {
        if (!formLoading) setFormMode(null)
    }

    const mapCreatePayload = (values: ContractFormValues): CreateContractRequest => ({
        description: values.description.trim(),
        start_date: toWorkflowDate(values.start_date),
        project_id: Number(values.project_id),
        contract_value: normalizeContractValue(values.contract_value),
        vendor_id: Number(values.vendor_id),
        attachment_url: values.attachment_url.trim(),
        title: values.title.trim(),
        end_date: toWorkflowDate(values.end_date),
        ContractNumber: values.contract_number.trim()
    })

    const mapUpdatePayload = (values: ContractFormValues): UpdateContractRequest => ({
        id: Number(values.id),
        start_date: toWorkflowDate(values.start_date),
        contract_value: normalizeContractValue(values.contract_value),
        description: values.description.trim(),
        status: values.status,
        vendor_id: Number(values.vendor_id),
        attachment_url: values.attachment_url.trim(),
        title: values.title.trim(),
        end_date: toWorkflowDate(values.end_date),
        ContractNumber: values.contract_number.trim()
    })

    const handleCreate = async (values: ContractFormValues) => {
        setFormLoading(true)
        setFormError(null)

        try {
            await contractService.createContract({
                sessiontoken,
                language,
                fields: mapCreatePayload(values)
            })
            setFormMode(null)
            await loadData(filter)
            setNotice({ severity: 'success', message: contractsText(dictionary, 'contract_created', 'Contract has been created.') })
        } catch (caught) {
            setFormError(handleWorkflowError(caught, contractsText(dictionary, 'contract_create_failed', 'Failed to create contract.')).message)
        } finally {
            setFormLoading(false)
        }
    }

    const handleUpdate = async (values: ContractFormValues) => {
        setFormLoading(true)
        setFormError(null)

        try {
            await contractService.updateContract({
                sessiontoken,
                language,
                fields: mapUpdatePayload(values)
            })
            setFormMode(null)
            await loadData(filter)
            setNotice({ severity: 'success', message: contractsText(dictionary, 'contract_updated', 'Contract has been updated.') })
        } catch (caught) {
            setFormError(handleWorkflowError(caught, contractsText(dictionary, 'contract_update_failed', 'Failed to update contract.')).message)
        } finally {
            setFormLoading(false)
        }
    }

    const handleView = async (contract: ContractItem) => {
        setDetailOpen(true)
        setDetailLoading(true)
        setDetailError(null)
        setDetailContract(null)

        try {
            const detail = await contractService.getContractById({
                sessiontoken,
                language,
                id: contract.id
            })

            setDetailContract(detail)
        } catch (caught) {
            setDetailError(handleWorkflowError(caught, contractsText(dictionary, 'detail_load_failed', 'Unable to load contract detail.')).message)
        } finally {
            setDetailLoading(false)
        }
    }

    const handleDelete = async () => {
        if (!deleteTarget || deleteLoading) return

        setDeleteLoading(true)

        try {
            await contractService.deleteContract({
                sessiontoken,
                language,
                id: deleteTarget.id
            })
            setDeleteTarget(null)
            await loadData(filter)
            setNotice({ severity: 'success', message: contractsText(dictionary, 'contract_deleted', 'Contract has been deleted.') })
        } catch (caught) {
            setNotice({
                severity: 'error',
                message: handleWorkflowError(caught, contractsText(dictionary, 'contract_delete_failed', 'Failed to delete contract.')).message
            })
        } finally {
            setDeleteLoading(false)
        }
    }

    const handlePageSizeChange = (event: SelectChangeEvent<number>) => {
        void loadData({ ...filter, page_size: Number(event.target.value), page_index: 1 })
    }
    const handlePageChange = (_: React.ChangeEvent<unknown>, pageIndex: number) => {
        void loadData({ ...filter, page_index: pageIndex })
    }
    const handleJumpPage = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const pageIndex = Math.min(Math.max(Number(event.target.value) || 1, 1), Math.max(totalPages, 1))

        void loadData({ ...filter, page_index: pageIndex })
    }

    return {
        filter,
        draftFilter,
        rows,
        totalCount,
        loading,
        error,
        formMode,
        formKey,
        editingContract,
        formLoading,
        formError,
        detailOpen,
        detailLoading,
        detailError,
        detailContract,
        deleteTarget,
        deleteLoading,
        notice,
        workingProject,
        loadData,
        updateDraftFilter,
        handleSearch,
        handleReset,
        handleRefresh,
        handleOpenCreate,
        handleOpenEdit,
        handleOpenDetailPage,
        handleCloseForm,
        handleCreate,
        handleUpdate,
        handleView,
        handleCloseDetail: () => setDetailOpen(false),
        handleOpenDelete: setDeleteTarget,
        handleCloseDelete: () => { if (!deleteLoading) setDeleteTarget(null) },
        handleDelete,
        handleCloseNotice: () => setNotice(null),
        handlePageSizeChange,
        handlePageChange,
        handleJumpPage
    }
}
