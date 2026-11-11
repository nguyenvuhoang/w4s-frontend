import { describe, expect, it } from 'vitest'

import { formatStaffBirthDate, toStaffDateInputValue } from './staffDate'

describe('staff date of birth', () => {
    it.each([
        ['1990-01-31', '31/01/1990'],
        ['1990-01-31T00:00:00Z', '31/01/1990'],
        ['1990-01-31T23:30:00-10:00', '31/01/1990'],
        ['1990-01-31T00:30:00+14:00', '31/01/1990'],
        ['2000-02-29', '29/02/2000'],
        [' 1990-01-31 ', '31/01/1990'],
        ['1900-02-29', '-'], ['2026-02-30', '-'], ['2026-13-01', '-'],
        ['', '-'], [null, '-'], [undefined, '-'], ['invalid', '-']
    ])('renders %s as a calendar date %s without a timezone conversion or time', (value, expected) => {
        expect(formatStaffBirthDate(value)).toBe(expected)
    })

    it('uses the same calendar date for display and edit state', () => {
        expect(toStaffDateInputValue('1990-01-31T23:30:00-10:00')).toBe('1990-01-31')
        expect(toStaffDateInputValue(null)).toBe('')
        expect(toStaffDateInputValue('2026-02-30')).toBe('')
    })
})
