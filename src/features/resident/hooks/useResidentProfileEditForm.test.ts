import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

// Same source-level regression-check convention as useResidentDetailActions.test.ts — this repo
// has no jsdom/@testing-library/react (vitest.config.ts runs environment: 'node'), so a real
// render-and-click test isn't possible here without new test infrastructure.
const source = readFileSync(new URL('./useResidentProfileEditForm.ts', import.meta.url), 'utf8')

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

describe('useResidentProfileEditForm — Modify Resident tab wiring', () => {
    it('validateForm requires resident_code, full_name, phone and a valid email', () => {
        const body = getFunctionBody('validateForm')

        expect(body).toContain('resident_code_required')
        expect(body).toContain('full_name_required')
        expect(body).toContain('phone_required')
        expect(body).toContain('email_pattern.test(email)')
    })

    it('save() bails out before calling the workflow when validateForm fails', () => {
        const body = getFunctionBody('save')
        const guardIndex = body.indexOf('if (!form_values || !validateForm()) return')
        const callIndex = body.indexOf('residentService.updateResidentProfile')

        expect(guardIndex).toBeGreaterThanOrEqual(0)
        expect(callIndex).toBeGreaterThan(guardIndex)
    })

    it('resolves user_code and bails out with an inline error before calling the workflow when it is missing', () => {
        const body = getFunctionBody('save')
        const resolveIndex = body.indexOf('resolveResidentUserCode(residentId, detail, general)')
        const guardIndex = body.indexOf('if (!user_code)')
        const callIndex = body.indexOf('residentService.updateResidentProfile')

        expect(resolveIndex).toBeGreaterThan(-1)
        expect(guardIndex).toBeGreaterThan(resolveIndex)
        expect(callIndex).toBeGreaterThan(guardIndex)
        expect(body.slice(guardIndex, callIndex)).toContain('update_user_code_missing')
    })

    it('calls only updateResidentProfile — never a User/account workflow — and builds the payload from residentId + form_values + user_code', () => {
        const body = getFunctionBody('save')

        expect(body).toContain('buildResidentUpdateProfilePayload(residentId, form_values, user_code)')
        expect(body).not.toContain('update_staff')
        expect(body).not.toContain('staffService')
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

    it('on failure: sets general_error (kept inline in the tab) and never throws past the hook', () => {
        const body = getFunctionBody('save')
        const catchIndex = body.indexOf('} catch')
        const catchBlock = body.slice(catchIndex)

        expect(catchBlock).toContain('setGeneralError(')
        expect(catchBlock).toContain('normalizeWorkflowErrorDetail(err')
        expect(catchBlock).not.toContain('SwalAlert')
    })

    it('always resets saving in a finally block', () => {
        const body = getFunctionBody('save')
        const financeIndex = body.lastIndexOf('finally')
        const setSavingFalseIndex = body.indexOf('setSaving(false)', financeIndex)

        expect(financeIndex).toBeGreaterThan(0)
        expect(setSavingFalseIndex).toBeGreaterThan(financeIndex)
    })
})
