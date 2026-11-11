import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

// Source-level regression checks (same convention as useResidentAccountEditForm.test.ts — this repo
// has no jsdom/@testing-library/react, vitest runs environment: 'node').
const hookSource = readFileSync(new URL('./useResidentChangeUsername.ts', import.meta.url), 'utf8')
const dialogSource = readFileSync(new URL('../components/resident-edit/ResidentChangeUsernameDialog.tsx', import.meta.url), 'utf8')
const tabSource = readFileSync(new URL('../components/resident-edit/ResidentAccountEditTab.tsx', import.meta.url), 'utf8')
const pageSource = readFileSync(new URL('../components/ResidentEditPage.tsx', import.meta.url), 'utf8')

const getFunctionBody = (source: string, name: string) => {
    const start = source.indexOf(`const ${name} = `)
    const next = source.indexOf('\n    const ', start + 1)

    return source.slice(start, next === -1 ? undefined : next)
}

const WORKFLOW_CALL = 'residentService.updateResidentProfile'

describe('useResidentChangeUsername', () => {
    it('uses WF_BO_UPDATE_RESIDENT_PROFILE (via residentService) and no longer WF_BO_CHANGE_USERNAME', () => {
        expect(hookSource).toContain(WORKFLOW_CALL)
        expect(hookSource).toContain('buildResidentChangeUsernamePayload')
        expect(hookSource).not.toContain('staffService')
        expect(hookSource).not.toContain('password')
    })

    it('blocks double-submit with a synchronous in-flight guard before calling the workflow', () => {
        const body = getFunctionBody(hookSource, 'submit')
        const guardIndex = body.indexOf('if (in_flight.current) return')
        const setFlightIndex = body.indexOf('in_flight.current = true')
        const callIndex = body.indexOf(WORKFLOW_CALL)

        expect(guardIndex).toBeGreaterThan(-1)
        expect(setFlightIndex).toBeGreaterThan(guardIndex)
        expect(callIndex).toBeGreaterThan(setFlightIndex)
    })

    it('validates and requires the loaded profile before calling the workflow', () => {
        const body = getFunctionBody(hookSource, 'submit')
        const callIndex = body.indexOf(WORKFLOW_CALL)

        expect(body.indexOf('validateChangeUsernameForm')).toBeGreaterThan(-1)
        expect(body.indexOf('validateChangeUsernameForm')).toBeLessThan(callIndex)
        expect(body.indexOf('if (!general || !detail)')).toBeGreaterThan(-1)
        expect(body.indexOf('if (!general || !detail)')).toBeLessThan(callIndex)
    })

    it('resolves user_code and does not call the workflow when it is missing', () => {
        const body = getFunctionBody(hookSource, 'submit')
        const guardIndex = body.indexOf('if (!user_code)')

        expect(body).toContain('resolveResidentUserCode(residentId, detail, general)')
        expect(guardIndex).toBeGreaterThan(-1)
        expect(guardIndex).toBeLessThan(body.indexOf(WORKFLOW_CALL))
        expect(body).toContain('user_code, new_username)')
    })

    it('on success: closes the dialog, resets the form, syncs the username and shows SwalAlert', () => {
        const body = getFunctionBody(hookSource, 'submit')
        const callIndex = body.indexOf(WORKFLOW_CALL)

        expect(body.indexOf('setOpen(false)', callIndex)).toBeGreaterThan(callIndex)
        expect(body.indexOf('reset()', callIndex)).toBeGreaterThan(callIndex)
        expect(body.indexOf('onChanged?.(new_username)', callIndex)).toBeGreaterThan(callIndex)
        expect(body.indexOf('SwalAlert(', callIndex)).toBeGreaterThan(callIndex)
        expect(body.indexOf("'success'", callIndex)).toBeGreaterThan(callIndex)
    })

    it('on error: keeps the dialog open with the entered username and shows the error inside it', () => {
        const catchBody = getFunctionBody(hookSource, 'submit').split('} catch (err) {')[1].split('} finally {')[0]

        expect(catchBody).toContain('setError(')
        expect(catchBody).toContain('executionId')
        expect(catchBody).not.toContain('setOpen(false)')
        expect(catchBody).not.toContain('setValues(')
    })

    it('does not close while a request is in flight', () => {
        expect(getFunctionBody(hookSource, 'closeDialog')).toContain('if (in_flight.current) return')
    })
})

describe('ResidentChangeUsernameDialog', () => {
    it('ignores backdrop clicks and Escape', () => {
        expect(dialogSource).toContain('disableEscapeKeyDown')
        expect(dialogSource).toContain("reason === 'backdropClick'")
    })

    it('renders the current username read-only and has no password field', () => {
        expect(dialogSource).toContain('slotProps={{ input: { readOnly: true } }}')
        expect(dialogSource).not.toContain('password')
    })

    it('disables Cancel and Confirm while submitting', () => {
        expect(dialogSource).toContain('onClick={handleClose} disabled={submitting}')
        expect(dialogSource).toContain('onClick={on_confirm} disabled={submitting}')
    })
})

describe('ResidentAccountEditTab — login name', () => {
    it('keeps the login name read-only and opens the Change Username dialog from its own button', () => {
        expect(tabSource).toContain('slotProps={{ input: { readOnly: true } }}')
        expect(tabSource).toContain('onClick={on_change_username}')
    })

    it('syncs the new login name into the account form (so the next Save sends it) and refreshes from the backend', () => {
        expect(pageSource).toContain('accountForm.applyLoginName(new_username)')
        expect(pageSource).toContain('router.refresh()')
    })
})
