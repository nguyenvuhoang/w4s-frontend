import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { createNavigationLifecycle, normalizeNavigationUrl, NAVIGATION_RECOVERY_MS } from './navigationLifecycle'

const base = 'https://ips.test/vi/module/contracts'

describe('navigation lifecycle', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('normalizes relative URLs and query key order without ignoring query/hash/locale', () => {
    expect(normalizeNavigationUrl('/vi/module/./contracts?b=2&a=1', base))
      .toBe(normalizeNavigationUrl(`${base}?a=1&b=2`, base))
    expect(normalizeNavigationUrl('?page=2', base)).not.toBe(normalizeNavigationUrl('?page=1', base))
    expect(normalizeNavigationUrl('#details', base)).not.toBe(normalizeNavigationUrl(base, base))
    expect(normalizeNavigationUrl('/en/module/contracts', base)).not.toBe(normalizeNavigationUrl(base, base))
    expect(normalizeNavigationUrl('?tag=b&tag=a', base)).not.toBe(normalizeNavigationUrl('?tag=a&tag=b', base))
  })

  it('starts first parent navigation and does nothing when the active parent is clicked again', () => {
    const lifecycle = createNavigationLifecycle()
    const id = lifecycle.begin(base, 'https://ips.test/vi/home')

    expect(id).not.toBeNull()
    lifecycle.completeRoute(base)
    expect(lifecycle.getSnapshot()).toBeNull()
    expect(lifecycle.begin(base, base)).toBeNull()
  })

  it('deduplicates a double click before the destination commits', () => {
    const lifecycle = createNavigationLifecycle()
    const id = lifecycle.begin('/vi/contracts', base)

    expect(lifecycle.begin('/vi/contracts', base)).toBeNull()
    expect(lifecycle.getSnapshot()?.id).toBe(id)
    lifecycle.completeRoute('https://ips.test/vi/contracts')
    expect(lifecycle.getSnapshot()).toBeNull()
  })

  it('an old commit/error cannot close a newer navigation', () => {
    const lifecycle = createNavigationLifecycle()
    const first = lifecycle.begin('/vi/contracts', base)!
    const second = lifecycle.begin('/vi/users/staffs', base)!

    lifecycle.finish(first)
    lifecycle.completeRoute('https://ips.test/vi/contracts')
    expect(lifecycle.getSnapshot()?.id).toBe(second)
    lifecycle.completeRoute('https://ips.test/vi/users/staffs')
    expect(lifecycle.getSnapshot()).toBeNull()
  })

  it.each([
    ['/vi/contracts/company', base],
    ['/vi/module/contracts', 'https://ips.test/vi/contracts/company'],
    ['?page=2', base],
    ['#details', base],
    ['/en/module/contracts', base]
  ])('allows parent/child/query/hash/locale navigation: %s', (href, current) => {
    const lifecycle = createNavigationLifecycle()

    expect(lifecycle.begin(href, current)).not.toBeNull()
    lifecycle.completeRoute(new URL(href, current).href)
    expect(lifecycle.getSnapshot()).toBeNull()
  })

  it('cleans up a failed/cancelled transition and accepts another click', () => {
    const lifecycle = createNavigationLifecycle()
    const first = lifecycle.begin('/vi/contracts', base)!

    lifecycle.finish(first)
    expect(lifecycle.getSnapshot()).toBeNull()
    expect(lifecycle.begin('/vi/contracts', base)).not.toBeNull()
  })

  it('does not create loading for invalid, external or non-http destinations', () => {
    const lifecycle = createNavigationLifecycle()

    for (const href of ['http://[', 'https://other.test/page', 'mailto:user@ips.test', 'javascript:void(0)']) {
      expect(lifecycle.begin(href, base)).toBeNull()
    }
    expect(lifecycle.getSnapshot()).toBeNull()
  })

  it('supports explicit refresh of the current URL', () => {
    const lifecycle = createNavigationLifecycle()

    expect(lifecycle.begin(base, base, true)).not.toBeNull()
  })

  it('finishes an ordinary link redirect without accepting source or superseded commits', () => {
    const lifecycle = createNavigationLifecycle()

    lifecycle.begin('/vi/contracts', base)
    lifecycle.begin('/vi/users/staffs', base)
    lifecycle.completeRoute(base)
    lifecycle.completeRoute(`${base}#details`)
    lifecycle.completeRoute('https://ips.test/vi/contracts')
    lifecycle.completeRoute('https://ips.test/vi/contracts#details')
    expect(lifecycle.getSnapshot()).not.toBeNull()
    lifecycle.completeRoute('https://ips.test/vi/access-denied')
    expect(lifecycle.getSnapshot()).toBeNull()
  })

  it('leaves managed redirects/errors to their owning React transition', () => {
    const lifecycle = createNavigationLifecycle()
    const id = lifecycle.begin('/vi/contracts', base, false, true, true)!

    lifecycle.completeRoute('https://ips.test/vi/access-denied')
    expect(lifecycle.getSnapshot()?.id).toBe(id)
    lifecycle.finish(id)
    expect(lifecycle.getSnapshot()).toBeNull()
  })

  it('recovers missing completion signals and cancels all timers on disposal', () => {
    const lifecycle = createNavigationLifecycle()

    lifecycle.begin('/vi/contracts', base)
    vi.advanceTimersByTime(NAVIGATION_RECOVERY_MS)
    expect(lifecycle.getSnapshot()).toBeNull()
    lifecycle.begin('/vi/users/staffs', base)
    lifecycle.dispose()
    expect(lifecycle.getSnapshot()).toBeNull()
    expect(vi.getTimerCount()).toBe(0)
  })

  it('never begins a navigation toward the route the router already committed', () => {
    const lifecycle = createNavigationLifecycle()

    lifecycle.completeRoute('https://ips.test/vi/home')
    expect(lifecycle.begin('https://ips.test/vi/home', base)).toBeNull()
    expect(lifecycle.getSnapshot()).toBeNull()
    expect(lifecycle.begin('https://ips.test/vi/home', base, true)).not.toBeNull() // explicit refresh
  })

  it('a history traversal supersedes the in-flight navigation and leaves no timers', () => {
    const lifecycle = createNavigationLifecycle()

    lifecycle.begin('/vi/contracts', base)
    lifecycle.settleHistoryTraversal(base)
    expect(lifecycle.getSnapshot()).toBeNull()
    expect(vi.getTimerCount()).toBe(0)
    lifecycle.settleHistoryTraversal(base) // idle traversal is a no-op
    expect(lifecycle.getSnapshot()).toBeNull()
  })

  it('keeps a navigation the restored page started itself before popstate arrived', () => {
    const lifecycle = createNavigationLifecycle()
    const restored = 'https://ips.test/vi/resident/list?status=A'

    lifecycle.completeRoute(restored) // Router commits the restored entry first (runtime order).
    const id = lifecycle.begin('/vi/resident/list', restored, false, true, true)

    lifecycle.settleHistoryTraversal(restored)
    expect(lifecycle.getSnapshot()?.id).toBe(id)
    lifecycle.finish(id!)
  })
})
