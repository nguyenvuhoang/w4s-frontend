import type { Locale } from '@/configs/i18n'
import type { getDictionary } from '@/shared/utils/getDictionary'
import type { Session } from 'next-auth'

export type ContractsDictionary = Awaited<ReturnType<typeof getDictionary>>

export type ContractsPageProps = {
    dictionary: ContractsDictionary
    session: Session | null
    locale: Locale
}

export type ContractListItem = {
    id: number
    contract_number: string
    project_id: number
    project_code: string
    vendor_code: string
    title: string
    start_date: string
    end_date: string
    contract_value: number
    status: string
}

export type ContractItem = Omit<ContractListItem, 'contract_value'> & {
    vendor_id: number | null
    description: string | null
    contract_value: number | null
    attachment_url: string | null
}

export type ContractsFilterModel = {
    page_size: number
    page_index: number
    search_text: string
    project_id: number
}

export type ContractsSearchRequest = ContractsFilterModel

export type ContractsSearchResponse = {
    items: ContractItem[]
    total_count: number
    total_pages: number
    has_previous_page: boolean
    has_next_page: boolean
    page_index: number
    page_size: number
}

export type ContractFormValues = {
    id?: number
    contract_number: string
    title: string
    description: string
    project_id: string | number
    vendor_id: string | number
    start_date: string
    end_date: string
    contract_value: string | number
    attachment_url: string
    status: string
}

export type CreateContractRequest = {
    description: string
    start_date: string
    project_id: number
    contract_value: number | ''
    vendor_id: number
    attachment_url: string
    title: string
    end_date: string
    ContractNumber: string
}

export type UpdateContractRequest = {
    id: number
    start_date: string
    contract_value: number | ''
    description: string
    status: string
    vendor_id: number
    attachment_url: string
    title: string
    end_date: string
    ContractNumber: string
}

export type DeleteContractRequest = {
    id: number
}

export type ContractProjectOption = {
    id: number
    code: string
    name: string
}

export class ContractWorkflowError extends Error {
    next_action?: string
    execution_id?: string

    constructor(message: string, next_action?: string, execution_id?: string) {
        super(message)
        this.name = 'ContractWorkflowError'
        this.next_action = next_action
        this.execution_id = execution_id
    }
}
