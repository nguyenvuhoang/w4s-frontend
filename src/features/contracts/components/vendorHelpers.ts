import type { VendorFormValues, VendorItem, VendorProjectOption, VendorsDictionary, VendorsFilterModel } from '../vendorTypes'

export const emptyVendorsFilter: VendorsFilterModel = {
    page_size: 10,
    page_index: 0,
    search_text: '',
    project_id: 1
}

export const vendorsText = (dictionary: VendorsDictionary, key: string, fallback: string) => (
    dictionary.vendors?.[key] ?? fallback
)

export const commonText = (dictionary: VendorsDictionary, key: string, fallback: string) => (
    dictionary.common?.[key] ?? fallback
)

export const displayVendorValue = (value: string | number | null | undefined) => {
    if (value === null || value === undefined || value === '') return '-'

    return String(value)
}

export const getVendorStatusColor = (status: string) => {
    if (status === 'A') return 'success'
    if (status === 'I') return 'default'
    if (status === 'D') return 'error'

    return 'warning'
}

export const getVendorStatusLabel = (dictionary: VendorsDictionary, status: string) => {
    if (status === 'A') return vendorsText(dictionary, 'status_active', 'Active')
    if (status === 'I') return vendorsText(dictionary, 'status_inactive', 'Inactive')
    if (status === 'D') return vendorsText(dictionary, 'status_deleted', 'Deleted')

    return status || '-'
}

export const vendorEditStatusOptions = ['A', 'I'] as const

export const buildVendorFormValues = (vendor: VendorItem): VendorFormValues => ({
    id: vendor.id,
    project_id: String(vendor.project_id || ''),
    vendor_code: vendor.vendor_code || '',
    name: vendor.name || '',
    tax_code: vendor.tax_code || '',
    contact_person: vendor.contact_person || '',
    phone: vendor.phone || '',
    email: vendor.email || '',
    address: vendor.address || '',
    status: vendor.status || 'A'
})

export const buildCreateVendorFormValues = (project_id?: number): VendorFormValues => ({
    id: 0,
    project_id: project_id ? String(project_id) : '',
    vendor_code: '',
    name: '',
    tax_code: '',
    contact_person: '',
    phone: '',
    email: '',
    address: '',
    status: 'A'
})

export const resolveDefaultVendorProjectId = (projectOptions: VendorProjectOption[]) => (
    projectOptions[0]?.id ?? emptyVendorsFilter.project_id
)

export const formatVendorError = (
    dictionary: VendorsDictionary,
    message: string,
    execution_id?: string
) => {
    if (!execution_id) return message

    return `${message} ${vendorsText(dictionary, 'error_reference', 'Error Reference')}: ${execution_id}`
}
