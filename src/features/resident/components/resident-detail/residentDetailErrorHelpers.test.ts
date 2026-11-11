import { describe, expect, it } from 'vitest'

import { getResidentDetailPageState, getResidentDetailFallbackFields } from './residentDetailErrorHelpers'

describe('resident detail error handling', () => {
    it('uses a not-found state only when the detail workflow reports the not-found code', () => {
        expect(getResidentDetailPageState(null, { message: 'not found', errorCode: 'ips.resident.id.notfound' })).toBe('not-found')
        expect(getResidentDetailPageState({ id: 1 } as any, { message: 'not found', errorCode: 'ips.resident.id.notfound' })).toBe('ready')
    })

    it('uses the generic error state when resident detail cannot load for another reason', () => {
        expect(getResidentDetailPageState(null, { message: 'temporary failure', executionId: 'exec-1' })).toBe('error')
    })

    it('keeps the normal detail state when the resident detail workflow succeeds', () => {
        expect(getResidentDetailPageState({ id: 1 } as any, null)).toBe('ready')
    })

    it('keeps only actual detail values when context is unavailable', () => {
        expect(getResidentDetailFallbackFields({ id: 2, resident_code: '', full_name: 'Nguyễn A', phone: null, email: 'a@example.com' } as any)).toEqual([
            ['full_name', 'Nguyễn A'],
            ['email', 'a@example.com'],
            ['nationality', '--'],
            ['description', '--'],
            ['id', 2]
        ])
    })
})
