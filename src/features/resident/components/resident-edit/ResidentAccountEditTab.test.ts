import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

// Source-level regression check (same convention as useResidentDetailActions.test.ts — no
// jsdom/@testing-library/react in this repo). Guards against the temporary-workflow warning
// Alert, removed once WF_BO_UPDATE_USER was confirmed as the official Modify User workflow for
// this account, from silently coming back.
const source = readFileSync(new URL('./ResidentAccountEditTab.tsx', import.meta.url), 'utf8')

describe('ResidentAccountEditTab — no stale "temporary workflow" warning', () => {
    it('does not render the removed temporary-workflow notice key', () => {
        expect(source).not.toContain('account_edit_workflow_notice')
    })

    it('renders no extra severity="warning" banner', () => {
        const warningAlertCount = (source.match(/severity="warning"/g) ?? []).length

        expect(warningAlertCount).toBe(0)
    })
})

describe('ResidentAccountEditTab — username management only', () => {
    it.each(['account_full_name', 'account_email', 'account_phone', 'field_gender', 'account_birthday', 'account_status', 'account_department_code', 'account_address'])(
        'no longer renders the %s field',
        key => {
            expect(source).not.toContain(`'${key}'`)
        }
    )

    it('has no Save button or form submit of its own', () => {
        expect(source).not.toContain('on_save')
        expect(source).not.toContain("'save'")
        expect(source).not.toContain('type="submit"')
    })

    it('keeps the read-only login name and the Change Username button', () => {
        expect(source).toContain("'account_login_name'")
        expect(source).toContain('slotProps={{ input: { readOnly: true } }}')
        expect(source).toContain('onClick={on_change_username}')
    })
})
