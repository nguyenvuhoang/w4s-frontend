import { describe, expect, it } from 'vitest'

import { formatHandoverDate, toHandoverDateInput, toHandoverDatePayload } from './projectDateHelpers'

describe('handover date (date-only)', () => {
  it('displays DD/MM/YYYY and "--" when empty', () => {
    expect(formatHandoverDate('2026-03-05')).toBe('05/03/2026')
    expect(formatHandoverDate(null)).toBe('--')
    expect(formatHandoverDate(undefined)).toBe('--')
    expect(formatHandoverDate('')).toBe('--')
  })

  it('a UTC instant from WF_BO_GET_PROJECT_DETAIL is the Vietnam calendar day (+07), not the UTC day', () => {
    // Real response: the Vietnam midnight of 29/09 stored as a UTC instant.
    expect(formatHandoverDate('2026-09-28T17:00:00Z')).toBe('29/09/2026')
    expect(toHandoverDateInput('2026-09-28T17:00:00Z')).toBe('2026-09-29')
    expect(formatHandoverDate('2026-03-05T23:30:00Z')).toBe('06/03/2026')
    expect(formatHandoverDate('2026-03-05T00:00:00+07:00')).toBe('05/03/2026')
    // saving an untouched edit form sends the same Vietnam day back
    expect(toHandoverDatePayload(toHandoverDateInput('2026-09-28T17:00:00Z'))).toBe('2026-09-29')
  })

  it('a date-only value or a date-time without timezone keeps its calendar day', () => {
    expect(formatHandoverDate('2026-09-29')).toBe('29/09/2026')
    expect(toHandoverDateInput('2026-09-29T00:00:00')).toBe('2026-09-29')
  })

  it('sends YYYY-MM-DD, and null (never today) when no date is chosen', () => {
    expect(toHandoverDatePayload('2026-03-05')).toBe('2026-03-05')
    expect(toHandoverDatePayload('')).toBeNull()
  })

  it('ignores values that are not a date', () => {
    expect(toHandoverDateInput('not a date')).toBe('')
    expect(formatHandoverDate('05/03/2026')).toBe('--')
  })
})
