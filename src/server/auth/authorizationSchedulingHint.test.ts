import { beforeEach, describe, expect, it } from 'vitest'

import {
  getSuperAdminHint,
  recordSuperAdminHint,
  resetSuperAdminHints,
  shouldStartMenuInParallel
} from './authorizationSchedulingHint'

describe('authorizationSchedulingHint', () => {
  beforeEach(() => {
    resetSuperAdminHints()
  })

  it('unknown session: start the menu in parallel (regular-user fast path)', () => {
    expect(getSuperAdminHint('token-a')).toBeNull()
    expect(shouldStartMenuInParallel('token-a', false)).toBe(true)
  })

  it('super admin session: skip the speculative menu call', () => {
    recordSuperAdminHint('token-a', true)

    expect(shouldStartMenuInParallel('token-a', false)).toBe(false)
  })

  it('is partitioned per session token (another user/session is unaffected)', () => {
    recordSuperAdminHint('token-admin', true)

    expect(shouldStartMenuInParallel('token-user', false)).toBe(true)
  })

  it('follows the latest context result (permission change)', () => {
    recordSuperAdminHint('token-a', true)
    recordSuperAdminHint('token-a', false)

    expect(shouldStartMenuInParallel('token-a', false)).toBe(true)
  })

  it('expires', () => {
    const now = 1_000_000

    recordSuperAdminHint('token-a', true, now)

    expect(getSuperAdminHint('token-a', now + 31 * 60 * 1000)).toBeNull()
  })

  it('static policy routes never start the menu, whatever the hint', () => {
    expect(shouldStartMenuInParallel('token-a', true)).toBe(false)
  })

  it('no token: no hint is stored or read', () => {
    recordSuperAdminHint(null, true)

    expect(getSuperAdminHint(null)).toBeNull()
  })
})
