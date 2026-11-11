import { beforeEach, describe, expect, it, vi } from 'vitest'

// Exercises the real WF_BO_CHANGE_USERNAME request/response mapping with the network client mocked.
const { runFODynamic } = vi.hoisted(() => ({ runFODynamic: vi.fn() }))

vi.mock('@/servers/system-service', () => ({ workflowService: { runFODynamic } }))

import { buildStaffChangeUsernameWorkflowFields, mapChangeUsernameResponse, STAFF_CHANGE_USERNAME_WORKFLOW_ID, staffService } from './staffService'

describe('buildStaffChangeUsernameWorkflowFields', () => {
    it('sends exactly { new_username, password } — no user_id/old_username added to the contract', () => {
        const fields = buildStaffChangeUsernameWorkflowFields({ new_username: 'new.user', password: 'Secret#1' })

        expect(Object.keys(fields).sort()).toEqual(['new_username', 'password'])
    })

    it('trims the new username but sends the password exactly as entered', () => {
        expect(buildStaffChangeUsernameWorkflowFields({ new_username: '  new.user  ', password: ' Secret#1 ' })).toEqual({
            new_username: 'new.user',
            password: ' Secret#1 '
        })
    })
})

describe('mapChangeUsernameResponse', () => {
    it('prefers the username returned by the backend', () => {
        expect(mapChangeUsernameResponse({ payload: { success: true, data: { new_username: 'from.backend' } } }, 'submitted')).toBe('from.backend')
    })

    it('falls back to the submitted username when the response does not echo one', () => {
        expect(mapChangeUsernameResponse({ payload: { success: true, data: null } }, 'submitted')).toBe('submitted')
        expect(mapChangeUsernameResponse({ payload: { success: true, data: { new_username: '  ' } } }, 'submitted')).toBe('submitted')
    })
})

describe('staffService.change_username', () => {
    beforeEach(() => {
        runFODynamic.mockReset()
    })

    it('calls WF_BO_CHANGE_USERNAME with the session token and the mapped fields, and returns the new username', async () => {
        runFODynamic.mockResolvedValue({ status: 200, payload: { success: true, data: { new_username: 'new.user' } } })

        const result = await staffService.change_username({
            sessiontoken: 'token',
            language: 'vi',
            payload: { new_username: ' new.user ', password: 'Secret#1' }
        })

        expect(result).toBe('new.user')
        expect(runFODynamic).toHaveBeenCalledTimes(1)
        expect(runFODynamic).toHaveBeenCalledWith({
            sessiontoken: 'token',
            workflowid: STAFF_CHANGE_USERNAME_WORKFLOW_ID,
            input: { new_username: 'new.user', password: 'Secret#1' },
            language: 'vi'
        })
        expect(STAFF_CHANGE_USERNAME_WORKFLOW_ID).toBe('WF_BO_CHANGE_USERNAME')
    })

    it.each([
        ['username already exists', 'Tên đăng nhập đã tồn tại'],
        ['wrong verification password', 'Mật khẩu không đúng']
    ])('throws the backend message with the execution_id reference when %s', async (_, info) => {
        runFODynamic.mockResolvedValue({
            status: 200,
            payload: { success: false, errors: [{ info, execution_id: 'EXEC-1' }] }
        })

        await expect(staffService.change_username({
            sessiontoken: 'token',
            language: 'vi',
            payload: { new_username: 'new.user', password: 'Secret#1' }
        })).rejects.toThrow(`${info} Mã tra cứu lỗi: EXEC-1`)
    })

    it('throws when the workflow reports success: false without errors[]', async () => {
        runFODynamic.mockResolvedValue({ success: false, message: 'Failed' })

        await expect(staffService.change_username({
            sessiontoken: 'token',
            payload: { new_username: 'new.user', password: 'Secret#1' }
        })).rejects.toThrow('Failed')
    })

    it('never calls the workflow without a session', async () => {
        await expect(staffService.change_username({
            payload: { new_username: 'new.user', password: 'Secret#1' }
        })).rejects.toThrow()
        expect(runFODynamic).not.toHaveBeenCalled()
    })
})
