import { describe, expect, it } from 'vitest'

import { buildResidentDeletePayload } from './residentDeletePayload'

describe('buildResidentDeletePayload', () => {
    it('sends only the confirmed resident id, matching WF_BO_DELETE_RESIDENT fields contract', () => {
        expect(buildResidentDeletePayload(19415)).toEqual({ id: 19415 })
    })

    it('does not coerce or rename the id into user_code/resident_id/account_id', () => {
        const payload = buildResidentDeletePayload(19415) as Record<string, unknown>

        expect(payload.id).toBe(19415)
        expect('user_code' in payload).toBe(false)
        expect('resident_id' in payload).toBe(false)
        expect('account_id' in payload).toBe(false)
    })
})
