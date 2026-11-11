import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

describe('ResidentAccountTab', () => {
    it('does not define a contact-information section for the login-information tab', () => {
        const source = readFileSync(new URL('./ResidentAccountTab.tsx', import.meta.url), 'utf8')

        expect(source).not.toContain('account_section_contact')
        expect(source).not.toContain('ContactPhoneOutlinedIcon')
    })

    it('does not define system information or a duplicate user-name field', () => {
        const source = readFileSync(new URL('./ResidentAccountTab.tsx', import.meta.url), 'utf8')

        expect(source).not.toContain('account_section_system')
        expect(source).not.toContain('SettingsOutlinedIcon')
        expect(source).not.toContain('account_user_name')
    })
})
