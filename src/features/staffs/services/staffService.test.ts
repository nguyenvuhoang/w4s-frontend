import { describe, expect, it, vi } from 'vitest'

// These tests exercise real payload/response mapping without initializing the network client.
vi.mock('@/servers/system-service', () => ({ workflowService: {} }))

import { buildStaffCreateWorkflowFields, buildStaffUpdatePayloadFromAccount, buildStaffUpdateWorkflowFields, mapCreateUserSuccess, mapStaffDetailResponse } from './staffService'
import { empty_staff_form } from '../components/staff-list/staffListHelpers'

const completeResponse = {
    status: 200,
    payload: {
        success: true,
        data: {
            user_code: '00224abd74644738af19dbf2d1c15973',
            data_template: {
                user_code: '00224abd74644738af19dbf2d1c15973',
                user_name: 'Test123',
                email: 'dainghia1224@gmail.com',
                fullname: 'Nghĩa',
                phone: '',
                password: '***'
            },
            notification_type: 'MAIL'
        }
    }
}

describe('mapCreateUserSuccess', () => {
    it('maps account information from response.data.data_template, not the response data root', () => {
        expect(mapCreateUserSuccess(completeResponse)).toMatchObject({
            userCode: '00224abd74644738af19dbf2d1c15973',
            username: 'Test123',
            fullname: 'Nghĩa',
            email: 'dainghia1224@gmail.com',
            phone: '',
            password: '***',
            notificationType: 'MAIL',
            hasAccountInformation: true
        })
    })

    it('keeps an omitted optional phone field empty without invalidating the account information', () => {
        const response = {
            status: 200,
            payload: {
                success: true,
                data: {
                    data_template: {
                        user_name: 'Test123',
                        fullname: 'Nghĩa',
                        email: 'dainghia1224@gmail.com'
                    }
                }
            }
        }

        expect(mapCreateUserSuccess(response)).toMatchObject({
            phone: '',
            hasAccountInformation: true
        })
    })

    it.each([
        ['data_template is null', { status: 200, payload: { success: true, data: { data_template: null } } }],
        ['response data is null', { status: 200, payload: { success: true, data: null } }],
        ['success response has no account information', { status: 200, payload: { success: true, data: { data_template: {} } } }]
    ])('flags a warning state when %s', (_, response) => {
        const result = mapCreateUserSuccess(response)

        expect(result.hasAccountInformation).toBe(false)
        expect(result.username).toBe('')
        expect(result.fullname).toBe('')
        expect(result.email).toBe('')
    })
})

describe('staff create full name mapping', () => {
    it.each([
        ['Nguyễn Văn Hoàng', 'Nguyễn Văn Hoàng'],
        ['  Trần Thị Ngọc Ánh  ', 'Trần Thị Ngọc Ánh'],
        ['Nghĩa', 'Nghĩa']
    ])('sends the whole full name %j as firstname without splitting', (full_name, expected) => {
        const fields = buildStaffCreateWorkflowFields({ ...empty_staff_form, gender: 1, full_name })

        expect(fields.firstname).toBe(expected)
        expect(fields.middlename).toBe('')
        expect(fields.lastname).toBe('')
    })
})

describe('staff update full name mapping', () => {
    it.each([
        ['Nguyễn Văn Hoàng', 'Nguyễn Văn Hoàng'],
        ['  Trần Thị Ngọc Ánh  ', 'Trần Thị Ngọc Ánh'],
        ['Nghĩa', 'Nghĩa']
    ])('sends the whole edited full name %j as firstname without splitting', (full_name, expected) => {
        const fields = buildStaffUpdateWorkflowFields({ ...buildStaffUpdatePayloadFromAccount(null), gender: 1, full_name })

        expect(fields.firstname).toBe(expected)
        expect(fields.middlename).toBe('')
        expect(fields.lastname).toBe('')
    })

    it('keeps a full name stored in first_name unchanged when saving without editing it', () => {
        const account = { id: 1, user_id: 'U1', login_name: 'staff', first_name: 'Nguyễn Văn Hoàng', middle_name: '', last_name: '', gender: 1 }
        const fields = buildStaffUpdateWorkflowFields(buildStaffUpdatePayloadFromAccount(account as any))

        expect(fields.firstname).toBe('Nguyễn Văn Hoàng')
        expect(fields.middlename).toBe('')
        expect(fields.lastname).toBe('')
    })
})

describe('staff gender mapping', () => {
    it.each([null, undefined, ''])('keeps an unspecified gender (%s) empty in edit state', gender => {
        expect(buildStaffUpdatePayloadFromAccount({ gender } as any).gender).toBe('')
    })

    it.each([[0, 0], ['0', 0], [1, 1], ['1', 1], [2, 2], ['2', 2]] as const)('normalizes response gender %s without changing a valid backend enum', (gender, expected) => {
        const detail = mapStaffDetailResponse({ data: { account: { gender, login_name: 'staff' } } })

        expect(detail.account?.gender).toBe(expected)
        expect(buildStaffUpdatePayloadFromAccount(detail.account).gender).toBe(expected)
    })

    it.each([null, '', 'unknown'])('preserves unknown detail gender %s without inventing a backend enum', gender => {
        expect(mapStaffDetailResponse({ data: { account: { gender } } }).account?.gender).toBeNull()
    })

    it('does not invent an account when the response contains no account', () => {
        expect(mapStaffDetailResponse({ data: { account: null } }).account).toBeNull()
    })

    it.each([0, 1, 2] as const)('sends explicitly selected gender %s unchanged as a number in create and update', gender => {
        expect(buildStaffCreateWorkflowFields({ ...empty_staff_form, gender }).gender).toBe(gender)
        expect(buildStaffUpdateWorkflowFields({ ...buildStaffUpdatePayloadFromAccount(null), gender }).gender).toBe(gender)
    })

    it('prevents an unspecified gender from silently becoming a workflow default', () => {
        expect(() => buildStaffCreateWorkflowFields(empty_staff_form)).toThrow()
        expect(() => buildStaffCreateWorkflowFields({ ...empty_staff_form, gender: '' })).toThrow()
        expect(() => buildStaffUpdateWorkflowFields({ ...buildStaffUpdatePayloadFromAccount(null), gender: '' })).toThrow()
    })
})
