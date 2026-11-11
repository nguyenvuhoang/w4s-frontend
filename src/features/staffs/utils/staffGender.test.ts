import { describe, expect, it } from 'vitest'

import { normalizeStaffGender, requiresStaffGenderSelection } from './staffGender'

describe('normalizeStaffGender', () => {
    it.each([
        [0, 0], ['0', 0], [1, 1], ['1', 1], [2, 2], ['2', 2],
        // Legacy string responses are read compatibly, but all workflow payloads remain numeric.
        ['M', 1], ['F', 2], ['m', 1], ['f', 2],
        ['', ''], [null, ''], [undefined, ''], [' ', ''],
        [false, ''], [true, ''], [3, '']
    ])('maps %s to %s without coercing empty/unknown values to a sex', (value, expected) => {
        expect(normalizeStaffGender(value)).toBe(expected)
    })
})

describe('gender validation at update boundaries', () => {
    it('does not require a profile gender for an avatar-only update', () => {
        expect(requiresStaffGenderSelection(null, false)).toBe(false)
        expect(requiresStaffGenderSelection('', false)).toBe(false)
    })

    it('routes a status/profile write with unknown gender to explicit selection', () => {
        expect(requiresStaffGenderSelection(null, true)).toBe(true)
        expect(requiresStaffGenderSelection('', true)).toBe(true)
    })

    it('allows status/profile writes for all backend gender values, including numeric zero', () => {
        expect(requiresStaffGenderSelection(0, true)).toBe(false)
        expect(requiresStaffGenderSelection(1, true)).toBe(false)
        expect(requiresStaffGenderSelection(2, true)).toBe(false)
        expect(requiresStaffGenderSelection('0', true)).toBe(false)
    })
})
