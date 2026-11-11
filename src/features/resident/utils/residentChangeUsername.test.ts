import { describe, expect, it } from 'vitest'

import type { ResidentContextGeneral, ResidentDetail } from '../types'
import { validateChangeUsernameForm } from './residentChangeUsername'
import { buildResidentChangeUsernamePayload, buildResidentProfileFormFromGeneral } from './residentUpdatePayload'

const dictionary = {} as any

describe('validateChangeUsernameForm', () => {
    it('accepts a valid new username', () => {
        expect(validateChangeUsernameForm(dictionary, 'testlogin', { new_username: 'testlogin2' })).toEqual({})
    })

    it.each(['', '   '])('requires a new username (%j)', new_username => {
        expect(validateChangeUsernameForm(dictionary, 'testlogin', { new_username }).new_username).toBeTruthy()
    })

    it.each(['testlogin', '  testlogin  '])('rejects a new username equal to the current one after trimming (%j)', new_username => {
        expect(validateChangeUsernameForm(dictionary, 'testlogin', { new_username }).new_username).toBeTruthy()
    })
})

describe('buildResidentChangeUsernamePayload', () => {
    const general: ResidentContextGeneral = {
        resident_id: 19418,
        resident_code: 'RES001',
        user_code: 'USR001',
        full_name: 'Nguyen Van A',
        gender: 'M',
        date_of_birth: '1990-05-20T00:00:00Z',
        phone: '0900000000',
        email: ' a@example.com ',
        avatar_url: null,
        identity_number: '012345678901',
        has_mobile_account: true
    }

    const detail = { nationality: 'VN', description: 'Ghi chú' } as ResidentDetail

    it('keeps the persisted profile and only adds app_account.username (trimmed, no password)', () => {
        const form = buildResidentProfileFormFromGeneral(general, 'A', detail)
        const payload = buildResidentChangeUsernamePayload(19418, form, 'USR001', '  new.login  ')

        expect(payload).toEqual({
            id: 19418,
            resident_code: 'RES001',
            user_code: 'USR001',
            owner: {
                resident_code: 'RES001',
                user_code: 'USR001',
                full_name: 'Nguyen Van A',
                gender: 'M',
                date_of_birth: '1990-05-20',
                phone: '0900000000',
                email: 'a@example.com',
                avatar_url: null,
                identity_number: '012345678901',
                status: 'A',
                nationality: 'VN',
                description: 'Ghi chú'
            },
            nationality: 'VN',
            description: 'Ghi chú',
            app_account: { username: 'new.login' }
        })
        expect(JSON.stringify(payload)).not.toContain('password')
    })
})
