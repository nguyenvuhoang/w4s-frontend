import { describe, expect, it } from 'vitest'

import { normalizeResidentGender } from './residentGender'

describe('resident edit gender normalization', () => {
    it.each(['M', 'F', 'O'] as const)('preserves the valid backend code %s', gender => {
        expect(normalizeResidentGender(gender)).toBe(gender)
    })

    it.each([
        ['NỮ', 'F'], ['Nữ', 'F'], [' nữ ', 'F'], ['Nu', 'F'], ['Female', 'F'],
        ['Nam', 'M'], ['Male', 'M'], ['Khác', 'O'], ['Other', 'O']
    ])('maps the display label %s to the Select code %s', (value, expected) => {
        expect(normalizeResidentGender(value)).toBe(expected)
    })

    it('accepts decomposed Vietnamese Unicode', () => {
        expect(normalizeResidentGender('NỮ'.normalize('NFD'))).toBe('F')
    })

    it.each([null, undefined, '', 'unknown', 0, 1])('keeps unrecognized gender %s empty instead of guessing', value => {
        expect(normalizeResidentGender(value)).toBe('')
    })
})
