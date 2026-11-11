import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { resolveRouteAccess, type MenuInfoResponse, type RouteAccessContext } from './resolveRouteAccess'

const later = <T,>(ms: number, value: T) => new Promise<T>(resolve => setTimeout(() => resolve(value), ms))
const failLater = (ms: number, error: unknown) => new Promise<never>((_, reject) => setTimeout(() => reject(error), ms))

const menuOk = (userCommand: unknown = [{ href: '/resident/list' }]): MenuInfoResponse => ({
  status: 200,
  payload: { dataresponse: { success: true, data: { data: userCommand }, errors: [] } }
})

const serviceUnavailable = (executionId?: string) =>
  Object.assign(new Error('Gateway Timeout'), { serviceUnavailable: true as const, executionId })

const user: RouteAccessContext = { userCode: 'U01', isSuperAdmin: false }
const superAdmin: RouteAccessContext = { userCode: 'ADMIN', isSuperAdmin: true }

const run = (overrides: Partial<Parameters<typeof resolveRouteAccess<RouteAccessContext>>[0]> = {}) =>
  resolveRouteAccess<RouteAccessContext>({
    hasStaticPolicy: false,
    startMenuInParallel: true,
    getContext: () => later(2, user),
    getMenu: () => later(2, menuOk()),
    hasStaticAccess: () => true,
    hasMenuAccess: userCommand => Array.isArray(userCommand) && userCommand.some((item: any) => item.href === '/resident/list'),
    ...overrides
  })

describe('resolveRouteAccess', () => {
  const unhandled: unknown[] = []
  const onUnhandled = (reason: unknown) => {
    unhandled.push(reason)
  }

  beforeEach(() => {
    unhandled.length = 0
    process.on('unhandledRejection', onUnhandled)
  })

  afterEach(() => {
    process.off('unhandledRejection', onUnhandled)
  })

  const settle = () => new Promise(resolve => setTimeout(resolve, 30))

  it('menu success + context success: allowed; both calls start before either settles', async () => {
    const order: string[] = []
    const result = await run({
      getContext: () => {
        order.push('context:start')

        return later(5, user)
      },
      getMenu: () => {
        order.push('menu:start')

        return later(5, menuOk())
      }
    })

    expect(result).toEqual({ kind: 'allowed', identity: 'U01' })
    expect(order).toEqual(['menu:start', 'context:start'])
  })

  it('permission change: a menu without the route denies access (fresh menu every time)', async () => {
    await expect(run({ getMenu: () => later(1, menuOk([{ href: '/contracts' }])) }))
      .resolves.toEqual({ kind: 'denied', identity: 'U01' })
  })

  it('context timeout: unavailable with the error reference — never allowed', async () => {
    const result = await run({ getContext: () => failLater(1, serviceUnavailable('exec-ctx')) })

    expect(result).toEqual({ kind: 'unavailable', executionId: 'exec-ctx' })
  })

  it('context timeout while the parallel menu later fails too: no unhandled rejection', async () => {
    const result = await run({
      getContext: () => failLater(1, serviceUnavailable()),
      getMenu: () => failLater(10, new Error('menu NETWORK_ERROR'))
    })

    await settle()
    expect(result).toEqual({ kind: 'unavailable', executionId: null })
    expect(unhandled).toEqual([])
  })

  it('menu timeout (504 response): error, not allowed, not stuck', async () => {
    const result = await run({
      getMenu: () => later(3, { status: 504, payload: { dataresponse: { errors: [{ info: 'Gateway Timeout', execute_id: 'ex-9' }] } } })
    })

    expect(result).toEqual({ kind: 'error', message: 'ExecutionID:ex-9 - Gateway Timeout' })
  })

  it('menu rejects (network error) before context settles: error once needed, no unhandled rejection', async () => {
    const result = await run({
      getContext: () => later(10, user),
      getMenu: () => failLater(1, new Error('menu NETWORK_ERROR'))
    })

    await settle()
    expect(result).toEqual({ kind: 'error', message: 'menu NETWORK_ERROR' })
    expect(unhandled).toEqual([])
  })

  it('session expiration on the menu (401): unauthorized flow', async () => {
    await expect(run({ getMenu: () => later(1, { status: 401, payload: { dataresponse: { errors: [] } } }) }))
      .resolves.toEqual({ kind: 'unauthorized' })
  })

  it('session expiration on the context (UNAUTHORIZED error): error page flow, never allowed', async () => {
    await expect(run({ getContext: () => failLater(1, new Error('UNAUTHORIZED')) }))
      .resolves.toEqual({ kind: 'error', message: 'UNAUTHORIZED' })
  })

  it.each([403, 500, 503])('menu HTTP %i: error, never allowed', async status => {
    const result = await run({ getMenu: () => later(1, { status, payload: { dataresponse: { errors: [{ info: `HTTP ${status}` }] } } }) })

    expect(result.kind).toBe('error')
  })

  it('a 200 menu without success=true is still rejected (same rule as isValidResponse)', async () => {
    const result = await run({ getMenu: () => later(1, { status: 200, payload: { dataresponse: { data: { data: [] }, errors: [] } } }) })

    expect(result.kind).toBe('error')
  })

  it('super admin: allowed without waiting for the menu; a failing parallel menu is ignored safely', async () => {
    const result = await run({
      getContext: () => later(1, superAdmin),
      getMenu: () => failLater(10, new Error('menu 401'))
    })

    await settle()
    expect(result).toEqual({ kind: 'allowed', identity: 'ADMIN' })
    expect(unhandled).toEqual([])
  })

  it('super admin hint (startMenuInParallel=false): the menu workflow is never called', async () => {
    const getMenu = vi.fn(() => later(1, menuOk()))

    await expect(run({ startMenuInParallel: false, getContext: () => later(1, superAdmin), getMenu }))
      .resolves.toEqual({ kind: 'allowed', identity: 'ADMIN' })
    expect(getMenu).not.toHaveBeenCalled()
  })

  it('stale hint (said super admin, no longer is): menu is fetched after the context and decides access', async () => {
    const getMenu = vi.fn(() => later(1, menuOk([])))

    await expect(run({ startMenuInParallel: false, getMenu })).resolves.toEqual({ kind: 'denied', identity: 'U01' })
    expect(getMenu).toHaveBeenCalledTimes(1)
  })

  it('static policy routes never call the menu and use the static rule', async () => {
    const getMenu = vi.fn(() => later(1, menuOk()))

    await expect(run({ hasStaticPolicy: true, hasStaticAccess: () => false, getMenu }))
      .resolves.toEqual({ kind: 'denied', identity: 'U01' })
    expect(getMenu).not.toHaveBeenCalled()
  })

  it('calls each workflow at most once per authorization (no duplicate requests)', async () => {
    const getContext = vi.fn(() => later(1, user))
    const getMenu = vi.fn(() => later(1, menuOk()))

    await run({ getContext, getMenu })
    expect(getContext).toHaveBeenCalledTimes(1)
    expect(getMenu).toHaveBeenCalledTimes(1)
  })

  it('reports every resolved context (used to refresh the scheduling hint)', async () => {
    const onContext = vi.fn()

    await run({ getContext: () => later(1, superAdmin), onContext })
    expect(onContext).toHaveBeenCalledWith(superAdmin)
  })
})
