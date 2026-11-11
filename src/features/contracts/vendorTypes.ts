import type { Locale } from '@/configs/i18n'
import type { getDictionary } from '@/shared/utils/getDictionary'
import type { Session } from 'next-auth'

export type VendorsDictionary = Awaited<ReturnType<typeof getDictionary>>

export type VendorsPageProps = {
    dictionary: VendorsDictionary
    session: Session | null
    locale: Locale
}

export type VendorItem = {
    id: number
    vendor_code: string
    project_id: number
    name: string
    tax_code: string | null
    contact_person: string | null
    phone: string | null
    email: string | null
    address: string | null
    status: string
}

export type VendorsFilterModel = {
    page_size: number
    page_index: number
    search_text: string
    project_id: number
}

export type VendorsSearchRequest = VendorsFilterModel

export type VendorsSearchResponse = {
    items: VendorItem[]
    total_count: number
    total_pages: number
    has_previous_page: boolean
    has_next_page: boolean
    page_index: number
    page_size: number
}

export type VendorProjectOption = {
    id: number
    code: string
    name: string
}

export type VendorFormValues = {
    id: number
    project_id: string
    vendor_code: string
    name: string
    tax_code: string
    contact_person: string
    phone: string
    email: string
    address: string
    status: string
}

export type CreateVendorRequest = {
    project_id: number
    name: string
    address: string
    phone: string
    vendor_code: string
    contact_person: string
    email: string
    tax_code: string
}

export type CreateVendorResponse = {
    id: number
    status: string
}

export type UpdateVendorRequest = {
    id: number
    phone: string
    tax_code: string
    name: string
    vendor_code: string
    contact_person: string
    status: string
    address: string
    email: string
}

export type DeleteVendorRequest = {
    id: number
}

export class VendorWorkflowError extends Error {
    next_action?: string
    execution_id?: string

    constructor(message: string, next_action?: string, execution_id?: string) {
        super(message)
        this.name = 'VendorWorkflowError'
        this.next_action = next_action
        this.execution_id = execution_id
    }
}
