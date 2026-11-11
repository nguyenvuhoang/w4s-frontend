import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

import { ENTITY_AUDIT_ENTITY_NAMES, isEntityAuditEntityName } from '@/shared/types/entityAudit'

const source = readFileSync(new URL('./route.ts', import.meta.url), 'utf8')

describe('generic entity-audit BFF', () => {
    it('only forwards whitelisted Backend entity names', () => {
        expect(ENTITY_AUDIT_ENTITY_NAMES).toEqual(['Resident', 'Project', 'Building', 'Floor', 'Apartment'])
        expect(isEntityAuditEntityName('Apartment')).toBe(true)
        expect(isEntityAuditEntityName('Building')).toBe(true)
        expect(isEntityAuditEntityName('Tower')).toBe(false)
        expect(isEntityAuditEntityName('Users')).toBe(false)
        expect(source).toContain('if (!isEntityAuditEntityName(entityName))')
    })

    it('rejects invalid ids and goes through the shared proxy', () => {
        expect(source).toContain('!Number.isInteger(entityId) || entityId <= 0')
        expect(source).toContain('return proxyEntityAudit(request, entityName, entityId)')
    })
})
