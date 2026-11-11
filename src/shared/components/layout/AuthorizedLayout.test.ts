import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

// AuthorizedLayout is an async Server Component with deep dependencies (next-auth's auth(),
// next/headers, backend services) that aren't practical to execute under vitest. Its decision
// logic was extracted to resolveRouteAccess, which is tested behaviorally in
// resolveRouteAccess.test.ts. These checks only pin the layout's thin wiring to it.
const source = readFileSync(new URL('./AuthorizedLayout.tsx', import.meta.url), 'utf8')

describe('AuthorizedLayout — wiring to resolveRouteAccess', () => {
    it('resolves mode, dictionary, session and backend token in one Promise.all', () => {
        expect(source).toMatch(/const \[mode, dictionary, session, rawBackendToken\] = await Promise\.all\(\[\s*getServerMode\(\),\s*getDictionary\(resolvedParams\.locale\),\s*auth\(\),\s*getServerBackendToken\(\),?\s*\]\)/)
    })

    it('redirects to logout before any backend authorization call when there is no session', () => {
        const redirectIndex = source.indexOf("redirect(getLocalizedUrl('/logout', resolvedParams.locale))")
        const accessIndex = source.indexOf('await resolveRouteAccess(')

        expect(redirectIndex).toBeGreaterThan(-1)
        expect(accessIndex).toBeGreaterThan(redirectIndex)
    })

    it('maps every non-allowed outcome to its own UI and only "allowed" grants access', () => {
        expect(source).toContain("if (access.kind === 'unavailable') {")
        expect(source).toContain('errorReference={access.executionId}')
        expect(source).toContain("if (access.kind === 'unauthorized') {")
        expect(source).toContain('<ErrorPage error="UNAUTHORIZED" side="server" />')
        expect(source).toContain("if (access.kind === 'error') {")
        expect(source).toContain("const hasAccess = access.kind === 'allowed'")
    })

    it('uses the scheduling hint only to decide when the menu starts, and refreshes it from the fresh context', () => {
        expect(source).toContain('startMenuInParallel: shouldStartMenuInParallel(backendToken, Boolean(staticPolicy))')
        expect(source).toContain('onContext: boContext => recordSuperAdminHint(backendToken, boContext.isSuperAdmin)')
        expect(source.match(/formService\.getMenuInfo\(/g)).toHaveLength(1)
        expect(source.match(/boContextService\.getContext\(/g)).toHaveLength(1)
    })
})
