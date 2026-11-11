import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const source = readFileSync(new URL('./route.ts', import.meta.url), 'utf8')
const proxy = readFileSync(new URL('../../_lib/entityAuditProxy.ts', import.meta.url), 'utf8')

describe('resident audit-history BFF', () => {
    it('accepts only a positive entity id and fixes the Resident entity server-side', () => {
        expect(source).toContain('!Number.isInteger(entityId) || entityId <= 0')
        expect(source).toContain("proxyEntityAudit(request, 'Resident', entityId)")
        expect(source).not.toContain('entity_name')
    })

    it('resolves the backend credential server-side and preserves error execution ids', () => {
        expect(proxy).toContain('getBackendToken(request)')
        expect(proxy).toContain('execution_id: getString')
        expect(proxy).toContain("'/ips/api/entity-audit/get'")
        expect(proxy).toContain('JSON.stringify({ entity_name: entityName, entity_id: entityId })')
    })
})
