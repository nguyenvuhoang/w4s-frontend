export type ResidentDictionary = Record<string, string>

export const text = (dict: ResidentDictionary, key: string, fallback: string) => dict[key] || fallback

const stripCodePrefix = (code: string, label: string) => {
    const trimmed = label.trim()
    const prefix = `${code} -`

    return trimmed.toUpperCase().startsWith(prefix) ? trimmed.slice(prefix.length).trim() : trimmed
}

export const optionLabel = (dict: ResidentDictionary, code: string, key: string, fallback: string) => (
    stripCodePrefix(code, text(dict, key, fallback))
)

export const localizedCatalogLabel = (dict: ResidentDictionary, code?: string, label?: string) => {
    const value = (code || '').trim()
    const sourceLabel = (label || '').trim()

    if (!value && !sourceLabel) return ''
    if (!value) return sourceLabel

    const mappedLabels: Record<string, string> = {
        OWNER: optionLabel(dict, 'OWNER', 'option_owner_role', 'Owner'),
        TENANT: optionLabel(dict, 'TENANT', 'option_tenant_role', 'Tenant'),
        MEMBER: optionLabel(dict, 'MEMBER', 'option_member_role', 'Member'),
        FAMILY: optionLabel(dict, 'FAMILY', 'option_member_role', 'Member'),
        REPRESENTATIVE: optionLabel(dict, 'REPRESENTATIVE', 'option_representative_role', 'Representative'),
        SPOUSE: optionLabel(dict, 'SPOUSE', 'option_relationship_spouse', 'Spouse'),
        CHILD: optionLabel(dict, 'CHILD', 'option_relationship_child', 'Child'),
        PARENT: optionLabel(dict, 'PARENT', 'option_relationship_parent', 'Parent'),
        SIBLING: optionLabel(dict, 'SIBLING', 'option_relationship_sibling', 'Sibling'),
        RELATIVE: optionLabel(dict, 'RELATIVE', 'option_relationship_relative', 'Relative'),
        AUTHORIZED_REPRESENTATIVE: optionLabel(dict, 'AUTHORIZED_REPRESENTATIVE', 'option_relationship_authorized_representative', 'Authorized Representative'),
        OCCUPANT: optionLabel(dict, 'OCCUPANT', 'option_relationship_occupant', 'Occupant'),
        OTHER: optionLabel(dict, 'OTHER', 'option_other', 'Other'),
        ACTIVE: optionLabel(dict, 'ACTIVE', 'option_active', 'Active'),
        INACTIVE: optionLabel(dict, 'INACTIVE', 'option_inactive', 'Inactive'),
        PENDING: optionLabel(dict, 'PENDING', 'option_pending', 'Pending'),
        NOT_ACTIVATED: optionLabel(dict, 'NOT_ACTIVATED', 'option_not_activated', 'Not activated'),
        PENDING_VERIFY: optionLabel(dict, 'PENDING_VERIFY', 'option_pending_verify', 'Pending verify'),
        ACTIVATED: optionLabel(dict, 'ACTIVATED', 'option_activated', 'Activated'),
        LOCKED: optionLabel(dict, 'LOCKED', 'option_locked', 'Locked'),
        HANDED_OVER: optionLabel(dict, 'HANDED_OVER', 'option_handed_over', 'Handed over'),
        NOT_HANDED_OVER: optionLabel(dict, 'NOT_HANDED_OVER', 'option_not_handed_over', 'Not handed over'),
        OCCUPIED: optionLabel(dict, 'OCCUPIED', 'option_occupied', 'Occupied'),
        VACANT: optionLabel(dict, 'VACANT', 'option_vacant', 'Vacant'),
        SHOPHOUSE: optionLabel(dict, 'SHOPHOUSE', 'option_shophouse', 'Shophouse'),
        APARTMENT: optionLabel(dict, 'APARTMENT', 'option_apartment', 'Apartment'),
        OFFICE: optionLabel(dict, 'OFFICE', 'option_office', 'Office')
    }

    return mappedLabels[value] ?? stripCodePrefix(value, sourceLabel || value)
}
