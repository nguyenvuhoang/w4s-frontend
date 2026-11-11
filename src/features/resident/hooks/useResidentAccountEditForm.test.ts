import { readFileSync } from 'node:fs'
import { describe, expect, it, vi } from 'vitest'

// buildStaffUpdateWorkflowFields/buildStaffUpdatePayloadFromAccount are pure mapping functions,
// but importing staffService.ts also imports the real workflow network client — mock it out the
// same way staffService.test.ts does, so these are plain unit tests with no network client init.
vi.mock('@/servers/system-service', () => ({ workflowService: {} }))

import { buildStaffUpdatePayloadFromAccount, buildStaffUpdateWorkflowFields } from '@/features/staffs/services/staffService'
import type { UserAccountDetail } from '@/features/staffs/types'

// Same source-level regression-check convention as useResidentDetailActions.test.ts — this repo
// has no jsdom/@testing-library/react (vitest.config.ts runs environment: 'node'), so a real
// render-and-click test isn't possible here without new test infrastructure.
const source = readFileSync(new URL('./useResidentAccountEditForm.ts', import.meta.url), 'utf8')

// A realistic resident app account — same shape as ResidentAccount (see types.ts) — cast through
// UserAccountDetail the same way useResidentAccountEditForm.buildFormFromAccount does, since the
// resident module reuses the Staffs/User Management module's request mapper as-is.
const residentAccountFixture = {
    id: 9001,
    user_id: 'U-RESIDENT-9001',
    user_code: 'RES9001',
    login_name: 'resident.app.user',
    first_name: 'Nguyen',
    middle_name: 'Van',
    last_name: 'An',
    gender: 1,
    address: '123 Le Loi',
    email: 'resident@example.com',
    birthday: '1990-01-01',
    phone: '0900000000',
    status: 'A',
    department_code: 'DEPT_RESIDENT',
    user_level: 0,
    policy_id: 42
} as unknown as UserAccountDetail

const getFunctionBody = (name: string) => {
    const start = source.indexOf(`const ${name} = `)

    if (start === -1) throw new Error(`Function "${name}" not found in source.`)

    const nextFunctionMarkers = ['\n    const ', '\n    return {']
    const nextIndexes = nextFunctionMarkers
        .map(marker => source.indexOf(marker, start + name.length))
        .filter(index => index !== -1)

    const end = nextIndexes.length > 0 ? Math.min(...nextIndexes) : source.length

    return source.slice(start, end)
}

describe('useResidentAccountEditForm — Modify User tab wiring', () => {
    it('buildFormFromAccount returns null (no form) when the resident has no linked account', () => {
        const body = getFunctionBody('buildFormFromAccount')

        expect(body).toContain('account ?')
        expect(body).toContain('buildStaffUpdatePayloadFromAccount')
    })

    it('save() bails out before calling the workflow when validateForm fails', () => {
        const body = getFunctionBody('save')
        const guardIndex = body.indexOf('if (!form_values || !validateForm()) return')
        const callIndex = body.indexOf('staffService.update_staff')

        expect(guardIndex).toBeGreaterThanOrEqual(0)
        expect(callIndex).toBeGreaterThan(guardIndex)
    })

    it('calls only staffService.update_staff (WF_BO_UPDATE_USER) — never the resident profile workflow', () => {
        const body = getFunctionBody('save')

        expect(body).toContain('staffService.update_staff(')
        expect(body).not.toContain('updateResidentProfile')
        expect(body).not.toContain('residentService')
    })

    it('on success: shows SwalAlert and only calls onSaved from inside the confirm callback, not eagerly', () => {
        const body = getFunctionBody('save')
        const tryIndex = body.indexOf('try {')
        const swalIndex = body.indexOf('SwalAlert(', tryIndex)
        const onSavedIndex = body.indexOf('onSaved?.()', swalIndex)
        const catchIndex = body.indexOf('} catch')

        expect(swalIndex).toBeGreaterThan(tryIndex)
        expect(swalIndex).toBeLessThan(catchIndex)
        expect(onSavedIndex).toBeGreaterThan(swalIndex)
        expect(onSavedIndex).toBeLessThan(catchIndex)
    })

    it('on failure: sets general_error (kept inline in the tab) instead of using SwalAlert', () => {
        const body = getFunctionBody('save')
        const catchIndex = body.indexOf('} catch')
        const catchBlock = body.slice(catchIndex)

        expect(catchBlock).toContain('setGeneralError(')
        expect(catchBlock).not.toContain('SwalAlert')
    })

    it('always resets saving in a finally block', () => {
        const body = getFunctionBody('save')
        const financeIndex = body.lastIndexOf('finally')
        const setSavingFalseIndex = body.indexOf('setSaving(false)', financeIndex)

        expect(financeIndex).toBeGreaterThan(0)
        expect(setSavingFalseIndex).toBeGreaterThan(financeIndex)
    })

    it('a resident with no linked account never produces a form, so save() can never reach WF_BO_UPDATE_USER', () => {
        expect(buildStaffUpdatePayloadFromAccount(null)).toEqual(
            expect.objectContaining({ id: 0, user_id: '', login_name: '' })
        )
    })

    it('on success: updates the baseline and local form_values to the just-saved payload, so a page reload reflects the same data without waiting on a round trip', () => {
        const body = getFunctionBody('save')
        const callIndex = body.indexOf('staffService.update_staff')
        const baselineIndex = body.indexOf('baseline.current = normalized', callIndex)
        const setFormValuesIndex = body.indexOf('setFormValues(normalized)', callIndex)
        const swalIndex = body.indexOf('SwalAlert(', callIndex)

        expect(baselineIndex).toBeGreaterThan(callIndex)
        expect(setFormValuesIndex).toBeGreaterThan(baselineIndex)
        expect(swalIndex).toBeGreaterThan(setFormValuesIndex)
    })

    it('sends WF_BO_UPDATE_USER with the resident account\'s own id/user_id — never a hardcoded or missing User ID', () => {
        const payload = buildStaffUpdatePayloadFromAccount(residentAccountFixture)
        const fields = buildStaffUpdateWorkflowFields(payload)

        expect(fields.id).toBe(residentAccountFixture.id)
        expect(fields.userid).toBe(residentAccountFixture.user_id)
        expect(fields.username).toBe(residentAccountFixture.login_name)
    })

    it('never sends assign_role_id, policy_id or user_level — a resident account save can never overwrite role/policy assignment', () => {
        const payload = buildStaffUpdatePayloadFromAccount(residentAccountFixture)
        const fields = buildStaffUpdateWorkflowFields(payload) as Record<string, unknown>

        expect(Object.keys(fields).sort()).toEqual([
            'address', 'department_code', 'description', 'email', 'firstname', 'gender',
            'id', 'lastname', 'middlename', 'phone', 'status', 'userid', 'username'
        ])
        expect(fields).not.toHaveProperty('assign_role_id')
        expect(fields).not.toHaveProperty('policy_id')
        expect(fields).not.toHaveProperty('user_level')
        expect(fields).not.toHaveProperty('birthday')
        expect(fields).not.toHaveProperty('date_of_birth')
    })

    it('sends the whole edited resident full name as firstname without splitting it into middlename/lastname', () => {
        const payload = { ...buildStaffUpdatePayloadFromAccount(residentAccountFixture), full_name: 'Nguyễn Văn Hoàng' }
        const fields = buildStaffUpdateWorkflowFields(payload)

        expect(fields.firstname).toBe('Nguyễn Văn Hoàng')
        expect(fields.middlename).toBe('')
        expect(fields.lastname).toBe('')
    })

    it('round-trips every field the UI never edits (address/department_code) unchanged when only one field is edited', () => {
        const baselinePayload = buildStaffUpdatePayloadFromAccount(residentAccountFixture)
        const editedPayload = { ...baselinePayload, email: 'new-email@example.com' }
        const fields = buildStaffUpdateWorkflowFields(editedPayload)

        expect(fields.email).toBe('new-email@example.com')
        expect(fields.address).toBe(baselinePayload.address)
        expect(fields.department_code).toBe(baselinePayload.department_code)
        expect(fields.phone).toBe(baselinePayload.phone)
    })
})
