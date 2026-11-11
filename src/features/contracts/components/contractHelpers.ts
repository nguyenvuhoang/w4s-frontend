import type { ContractItem, ContractsDictionary, ContractsFilterModel } from '../types'

export const emptyContractsFilter: ContractsFilterModel = {
    page_size: 10,
    page_index: 0,
    search_text: '',
    project_id: 0
}

export const contractsText = (dictionary: ContractsDictionary, key: string, fallback: string) => (
    dictionary.contracts?.[key] ?? fallback
)

export const commonText = (dictionary: ContractsDictionary, key: string, fallback: string) => (
    dictionary.common?.[key] ?? fallback
)

export const emptyText = (value: string | number | null | undefined) => {
    if (value === null || value === undefined || value === '') return '-'

    return String(value)
}

export const formatContractDate = (value: string) => {
    if (!value) return emptyText(value)

    const date = new Date(value)

    if (Number.isNaN(date.getTime())) return emptyText(null)

    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = date.getFullYear()

    return `${day}/${month}/${year}`
}

export const formatContractValue = (value: ContractItem['contract_value'] | '') => {
    if (value === null || value === undefined || value === '' || !Number.isFinite(Number(value))) return emptyText(null)

    return new Intl.NumberFormat('en-US', {
        maximumFractionDigits: 2
    }).format(Number(value))
}

export const getContractStatusColor = (status: string) => {
    if (status === 'A') return 'success'
    if (status === 'I') return 'default'

    return 'warning'
}

export const getContractStatusLabel = (dictionary: ContractsDictionary, status: string) => {
    if (status === 'A') return contractsText(dictionary, 'status_active', 'Hoạt động')
    if (status === 'I') return contractsText(dictionary, 'status_inactive', 'Inactive')
    if (status === 'B') return dictionary.common?.status_blocked ?? 'Blocked'
    if (status === 'DRAFT') return dictionary.common?.status_draft ?? 'Draft'

    return emptyText(status)
}
