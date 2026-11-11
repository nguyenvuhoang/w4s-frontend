import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// Minimal browser globals for SessionManager under the node test environment.
class MemoryStorage {
  private store = new Map<string, string>()
  getItem(key: string) { return this.store.get(key) ?? null }
  setItem(key: string, value: string) { this.store.set(key, String(value)) }
  removeItem(key: string) { this.store.delete(key) }
}

const createTrackedTarget = () => {
  const listeners = new Map<string, Set<unknown>>()
  return {
    listeners,
    addEventListener: vi.fn((type: string, fn: unknown) => {
      if (!listeners.has(type)) listeners.set(type, new Set())
      listeners.get(type)!.add(fn)
    }),
    removeEventListener: vi.fn((type: string, fn: unknown) => {
      listeners.get(type)?.delete(fn)
    }),
    count: () => Array.from(listeners.values()).reduce((sum, set) => sum + set.size, 0)
  }
}

let doc: ReturnType<typeof createTrackedTarget> & { visibilityState: string }
let win: ReturnType<typeof createTrackedTarget> & { location: { pathname: string; href: string } }
let fetchMock: ReturnType<typeof vi.fn>

const loadSessionManager = async () => (await import('./sessionManager')).SessionManager

beforeEach(() => {
  vi.useFakeTimers()
  vi.resetModules()
  doc = Object.assign(createTrackedTarget(), { visibilityState: 'visible' })
  win = Object.assign(createTrackedTarget(), { location: { pathname: '/vi/dashboard', href: '/vi/dashboard' } })
  fetchMock = vi.fn().mockResolvedValue({ ok: true })
  vi.stubGlobal('window', win)
  vi.stubGlobal('document', doc)
  vi.stubGlobal('localStorage', new MemoryStorage())
  vi.stubGlobal('sessionStorage', new MemoryStorage())
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('SessionManager idle timeout toggle', () => {
  it('logs out with session_timeout after inactivity when idle timeout is enabled (default)', async () => {
    const SessionManager = await loadSessionManager()
    const manager = new SessionManager({ sessionTimeoutMinutes: 1, checkIntervalSeconds: 10 })
    const logoutSpy = vi.spyOn(manager, 'triggerLogout').mockResolvedValue()

    expect(doc.listeners.get('mousemove')?.size).toBe(1)
    localStorage.setItem('lastActivity', String(Date.now() - 2 * 60 * 1000))
    vi.advanceTimersByTime(10_000)

    expect(logoutSpy).toHaveBeenCalledWith('session_timeout')
    manager.destroy()
  })

  it('creates no activity listeners/interval and never logs out on inactivity when disabled', async () => {
    const SessionManager = await loadSessionManager()
    const manager = new SessionManager({ sessionTimeoutMinutes: 1, checkIntervalSeconds: 10, idleTimeoutEnabled: false })
    const logoutSpy = vi.spyOn(manager, 'triggerLogout').mockResolvedValue()

    expect(doc.listeners.get('mousemove')).toBeUndefined()
    expect(vi.getTimerCount()).toBe(0)
    localStorage.setItem('lastActivity', String(Date.now() - 24 * 60 * 60 * 1000))
    vi.advanceTimersByTime(24 * 60 * 60 * 1000)

    expect(logoutSpy).not.toHaveBeenCalled()
    expect(fetchMock).not.toHaveBeenCalled()
    manager.destroy()
  })

  it('keeps manual logout working when idle timeout is disabled', async () => {
    const SessionManager = await loadSessionManager()
    const manager = new SessionManager({ idleTimeoutEnabled: false })

    await manager.triggerLogout('manual')

    expect(fetchMock).toHaveBeenCalledWith('/api/logout', expect.objectContaining({ method: 'POST' }))
    expect(win.location.href).toBe('/vi/login')
    manager.destroy()
  })

  it('removes all listeners and timers on destroy so re-initialization does not leak', async () => {
    const SessionManager = await loadSessionManager()
    const enabled = new SessionManager()
    expect(doc.count() + win.count()).toBeGreaterThan(0)
    enabled.destroy()
    expect(doc.count() + win.count()).toBe(0)
    expect(vi.getTimerCount()).toBe(0)

    const disabled = new SessionManager({ idleTimeoutEnabled: false })
    disabled.destroy()
    expect(doc.count() + win.count()).toBe(0)
  })
})

describe('ENABLE_IDLE_TIMEOUT env parsing', () => {
  const loadFlag = async (value: string | undefined) => {
    vi.resetModules()
    if (value === undefined) vi.stubEnv('NEXT_PUBLIC_ENABLE_IDLE_TIMEOUT', undefined as unknown as string)
    else vi.stubEnv('NEXT_PUBLIC_ENABLE_IDLE_TIMEOUT', value)
    const { ENABLE_IDLE_TIMEOUT } = await import('@/configs/sessionConfig')
    vi.unstubAllEnvs()
    return ENABLE_IDLE_TIMEOUT
  }

  it('is enabled when unset or true, disabled only when false', async () => {
    expect(await loadFlag(undefined)).toBe(true)
    expect(await loadFlag('true')).toBe(true)
    expect(await loadFlag('false')).toBe(false)
    expect(await loadFlag(' FALSE ')).toBe(false)
  })
})
