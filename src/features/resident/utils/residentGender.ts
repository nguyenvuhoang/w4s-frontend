import type { Gender } from '../types'

// Detail responses may contain a display label rather than the M/F/O form code.
// Keep this conversion at the form boundary; do not change the raw response.
export const normalizeResidentGender = (value: unknown): Gender => {
    if (typeof value !== 'string') return ''

    switch (value.normalize('NFC').trim().toUpperCase()) {
        case 'M':
        case 'MALE':
        case 'NAM':
            return 'M'
        case 'F':
        case 'FEMALE':
        case 'NỮ':
        case 'NU':
            return 'F'
        case 'O':
        case 'OTHER':
        case 'KHÁC':
        case 'KHAC':
            return 'O'
        default:
            return ''
    }
}
