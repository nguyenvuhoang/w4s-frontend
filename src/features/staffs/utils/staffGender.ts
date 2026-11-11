import type { StaffGender } from '../types'

// IPS uses 0 = unspecified, 1 = male, 2 = female. Preserve the numeric backend contract;
// only legacy M/F response values are accepted for read compatibility and are re-sent as numbers.
export const normalizeStaffGender = (value: unknown): StaffGender => {
    if (value === 0 || value === '0') return 0
    if (value === 1 || value === '1') return 1
    if (value === 2 || value === '2') return 2
    if (typeof value === 'string' && value.toUpperCase() === 'M') return 1
    if (typeof value === 'string' && value.toUpperCase() === 'F') return 2

    return ''
}

export const requiresStaffGenderSelection = (gender: unknown, willUpdateProfile: boolean): boolean => (
    willUpdateProfile && normalizeStaffGender(gender) === ''
)
