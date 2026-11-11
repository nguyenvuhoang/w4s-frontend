import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

// useResidentDetailActions is a React hook (useState) rendered inside ResidentDetailPage, which
// needs a DOM to mount/click-test — this repo has no jsdom/@testing-library/react dependency
// (vitest.config.ts runs environment: 'node'), so a true render-and-click integration test isn't
// possible here without adding new test infrastructure. This is a source-level regression check
// instead, consistent with this repo's existing convention for hard-to-render hooks (see
// useResidentList.test.ts, residentDetailErrors.test.ts). The workflow-id/payload/error-shape
// behavior of residentService.deleteResident itself is covered by residentDeleteService.test.ts
// with a real mocked fetch; this file pins down the hook's control flow around it.
const source = readFileSync(new URL('./useResidentDetailActions.ts', import.meta.url), 'utf8')

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

describe('useResidentDetailActions — delete confirm wiring', () => {
    it('startDeleteConfirm opens the delete confirm dialog without calling any workflow', () => {
        const body = getFunctionBody('startDeleteConfirm')

        expect(body).toContain("setConfirmType('delete')")
        expect(body).not.toContain('residentService')
    })

    it('closeConfirm (Cancel) never calls residentService — cancelling never triggers the workflow', () => {
        const body = getFunctionBody('closeConfirm')

        expect(body).not.toContain('residentService')
    })

    it('closeConfirm is a no-op while a delete is in flight, so it cannot be dismissed mid-request', () => {
        const body = getFunctionBody('closeConfirm')

        expect(body).toContain('if (deleting) return')
    })

    it('handleConfirm guards against double-submit before doing anything else', () => {
        const body = getFunctionBody('handleConfirm')
        const guardIndex = body.indexOf('if (!confirm_type || deleting) return')
        const deleteCallIndex = body.indexOf('residentService.deleteResident')

        expect(guardIndex).toBeGreaterThanOrEqual(0)
        expect(deleteCallIndex).toBeGreaterThan(guardIndex)
    })

    it('sets deleting=true only right before the workflow call, and resets it in a finally', () => {
        const body = getFunctionBody('handleConfirm')
        const setDeletingTrueIndex = body.indexOf('setDeleting(true)')
        const deleteCallIndex = body.indexOf('residentService.deleteResident')
        const financeIndex = body.lastIndexOf('finally')
        const setDeletingFalseIndex = body.indexOf('setDeleting(false)', financeIndex)

        expect(setDeletingTrueIndex).toBeGreaterThanOrEqual(0)
        expect(deleteCallIndex).toBeGreaterThan(setDeletingTrueIndex)
        expect(financeIndex).toBeGreaterThan(deleteCallIndex)
        expect(setDeletingFalseIndex).toBeGreaterThan(financeIndex)
    })

    it('deletes using buildResidentDeletePayload(residentId) — the currently opened resident id, never user_code/resident_id/account_id', () => {
        const body = getFunctionBody('handleConfirm')

        expect(body).toContain('buildResidentDeletePayload(residentId)')
        expect(body).not.toContain('user_code')
        expect(body).not.toContain('account_id')
    })

    it('on success: closes the dialog, shows a SwalAlert, and only navigates away after the user dismisses it', () => {
        const body = getFunctionBody('handleConfirm')
        const tryIndex = body.indexOf('try {')
        const successCloseIndex = body.indexOf('setConfirmType(null)', tryIndex)
        const swalIndex = body.indexOf('SwalAlert(', tryIndex)
        const onDeleteSuccessIndex = body.indexOf('onDeleteSuccess?.()', swalIndex)
        const catchIndex = body.indexOf('} catch')

        // setConfirmType(null) + SwalAlert both happen inside the try block, before the catch.
        expect(successCloseIndex).toBeGreaterThan(tryIndex)
        expect(successCloseIndex).toBeLessThan(catchIndex)
        expect(swalIndex).toBeGreaterThan(successCloseIndex)
        expect(swalIndex).toBeLessThan(catchIndex)
        // onDeleteSuccess is only invoked from inside the SwalAlert confirm callback, not called eagerly.
        expect(onDeleteSuccessIndex).toBeGreaterThan(swalIndex)
        expect(onDeleteSuccessIndex).toBeLessThan(catchIndex)
    })

    it('on failure: sets confirm_error (kept inside the modal) instead of using SwalAlert, and never resets confirm_type — the dialog stays open for retry', () => {
        const body = getFunctionBody('handleConfirm')
        const catchIndex = body.indexOf('} catch')
        const catchBlock = body.slice(catchIndex)

        expect(catchBlock).toContain('setConfirmError(')
        expect(catchBlock).not.toContain('SwalAlert')
        expect(catchBlock).not.toContain('setConfirmType(null)')
        expect(catchBlock).not.toContain('router')
    })

    it('never renders a raw workflow payload/exception — only the normalized message plus an execution id reference', () => {
        const body = getFunctionBody('handleConfirm')
        const catchIndex = body.indexOf('} catch')
        const catchBlock = body.slice(catchIndex)

        expect(catchBlock).toContain('normalizeWorkflowErrorDetail(err')
        expect(catchBlock).toContain('workflowError.message')
        expect(catchBlock).toContain('workflowError.executionId')
    })
})
