type StaffNameParts = {
    first_name?: string | null
    middle_name?: string | null
    last_name?: string | null
}

export const formatStaffFullName = (name?: StaffNameParts | null) => (
    [name?.last_name, name?.middle_name, name?.first_name].filter(Boolean).join(' ').trim()
)
