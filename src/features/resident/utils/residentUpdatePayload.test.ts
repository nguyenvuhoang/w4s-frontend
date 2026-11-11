import { describe, expect, it } from 'vitest'

import type { ResidentPayload } from '../types'
import { buildResidentChangeUsernamePayload, buildResidentUpdateProfilePayload, resolveResidentUserCode } from './residentUpdatePayload'

const form: ResidentPayload = {
    resident_code: 'RS19402',
    user_code: 'USR19402',
    full_name: 'Nguyễn Văn A',
    gender: 'M',
    date_of_birth: '1990-01-01',
    phone: '0900000000',
    email: '  a@example.com  ',
    avatar_url: 'https://example.test/avatar.png',
    identity_number: '0123456789',
    status: 'A',
    nationality: 'Việt Nam',
    nationality_country_id: 'VN',
    description: 'Mô tả đã cập nhật'
}

describe('buildResidentUpdateProfilePayload', () => {
    it('keeps existing editable values and mirrors nationality and description in owner and root payloads', () => {
        const payload = buildResidentUpdateProfilePayload(19402, form, 'USR19402')

        expect(payload.id).toBe(19402)
        expect('resident_id' in payload).toBe(false)
        expect(payload.owner.full_name).toBe('Nguyễn Văn A')
        expect(payload.owner.user_code).toBe('USR19402')
        expect(payload.owner.email).toBe('a@example.com')
        expect(payload.owner.nationality).toBe('Việt Nam')
        expect(payload.owner.description).toBe('Mô tả đã cập nhật')
        expect(payload.nationality).toBe(payload.owner.nationality)
        expect(payload.description).toBe(payload.owner.description)
        expect('password' in payload.owner).toBe(false)
    })

    it('always puts user_code and resident_code at the root of fields (regression: user_code was missing)', () => {
        const payload = buildResidentUpdateProfilePayload(19402, { ...form, user_code: null }, 'USR19402')

        expect(payload.user_code).toBe('USR19402')
        expect(payload.resident_code).toBe('RS19402')
        expect(payload.owner.user_code).toBe('USR19402')
    })
})

describe('buildResidentChangeUsernamePayload', () => {
    it('sends root user_code with app_account containing only the username', () => {
        const payload = buildResidentChangeUsernamePayload(19402, form, 'USR19402', '  new.login  ')

        expect(payload.id).toBe(19402)
        expect(payload.resident_code).toBe('RS19402')
        expect(payload.user_code).toBe('USR19402')
        expect(payload.owner.user_code).toBe('USR19402')
        expect(payload.app_account).toEqual({ username: 'new.login' })
    })
})

describe('resolveResidentUserCode', () => {
    it('prefers the root user_code of the resident detail', () => {
        expect(resolveResidentUserCode(19402, { user_code: ' USR-DETAIL ' }, { resident_id: 19402, user_code: 'USR-OWNER' })).toBe('USR-DETAIL')
    })

    it('falls back to the owner user_code when it belongs to the same resident', () => {
        expect(resolveResidentUserCode(19402, { user_code: null }, { resident_id: 19402, user_code: 'USR-OWNER' })).toBe('USR-OWNER')
        expect(resolveResidentUserCode(19402, null, { resident_id: 19402, user_code: 'USR-OWNER' })).toBe('USR-OWNER')
    })

    it('does not use the owner user_code of a different resident', () => {
        expect(resolveResidentUserCode(19402, { user_code: '' }, { resident_id: 1, user_code: 'USR-OTHER' })).toBeNull()
    })

    it.each([null, undefined, '', '   '])('returns null when no valid user_code exists (%j)', user_code => {
        expect(resolveResidentUserCode(19402, { user_code: user_code as any }, { resident_id: 19402, user_code: user_code as any })).toBeNull()
    })
})
