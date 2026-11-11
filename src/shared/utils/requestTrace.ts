/**
 * Development-only request tracing.
 *
 * Every traced request gets a correlation id, a duration and a *fingerprint* of its payload —
 * a short hash, never the payload itself, so no token / cookie / personal data ever reaches the
 * console. Entries are kept in a bounded in-memory ring buffer exposed as
 * `window.__IPS_REQUEST_TRACE__` so a benchmark run can be summarized from DevTools:
 *
 *   __IPS_REQUEST_TRACE__.summary()   // counts, duplicates, median/p95, top 10 slowest
 *   __IPS_REQUEST_TRACE__.clear()
 *
 * Enabled when NODE_ENV === 'development', or explicitly with NEXT_PUBLIC_REQUEST_TRACE=1
 * (e.g. to compare against a local production build). Disabled tracing is a no-op.
 */

export type RequestTraceCache = 'hit' | 'miss' | 'inflight' | 'none'

export type RequestTraceEntry = {
  requestId: string
  target: string
  startedAt: number
  durationMs: number
  route: string
  caller: string
  fingerprint: string
  cache: RequestTraceCache
  status: number | 'error'
  side: 'client' | 'server'
}

export type RequestTraceSummary = {
  total: number
  network: number
  cacheHits: number
  inflightJoins: number
  duplicates: Array<{ target: string; fingerprint: string; count: number }>
  medianMs: number
  p95Ms: number
  slowest: RequestTraceEntry[]
}

const MAX_ENTRIES = 500
const DUPLICATE_WINDOW_MS = 2000

const entries: RequestTraceEntry[] = []
let sequence = 0

export const isRequestTraceEnabled = () =>
  process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_REQUEST_TRACE === '1'

export const createRequestId = () => {
  sequence = (sequence + 1) % 1_000_000

  return `rq-${Date.now().toString(36)}-${sequence.toString(36)}`
}

/** Deterministic JSON with sorted keys, so equivalent payloads produce the same string. */
export const stableStringify = (value: unknown): string => {
  const seen = new WeakSet<object>()

  const walk = (input: unknown): unknown => {
    if (input === null || typeof input !== 'object') return input
    if (seen.has(input as object)) return '[Circular]'
    seen.add(input as object)

    if (Array.isArray(input)) return input.map(walk)

    return Object.keys(input as Record<string, unknown>)
      .sort()
      .reduce<Record<string, unknown>>((acc, key) => {
        acc[key] = walk((input as Record<string, unknown>)[key])

        return acc
      }, {})
  }

  return JSON.stringify(walk(value)) ?? ''
}

/** FNV-1a 32-bit hash — enough to tell "same payload" apart, irreversible for logging purposes. */
export const fingerprintPayload = (value: unknown): string => {
  const text = typeof value === 'string' ? value : stableStringify(value)
  let hash = 0x811c9dc5

  for (let index = 0; index < text.length; index++) {
    hash ^= text.charCodeAt(index)
    hash = Math.imul(hash, 0x01000193)
  }

  return (hash >>> 0).toString(16).padStart(8, '0')
}

const INFRA_FRAME = /requestTrace|inflightDedupe|servers[\\/_]lib[\\/_]http|servers[\\/_]lib[\\/_]api|workflow\.service|codeListService|node_modules|react-dom|<anonymous>/

/** Best-effort first application frame of the current stack (development only). */
export const resolveCaller = (): string => {
  const stack = new Error().stack?.split('\n').slice(1) ?? []
  const frame = stack.find(line => !INFRA_FRAME.test(line))

  if (!frame) return 'unknown'

  const match = frame.match(/at\s+([^\s(]+)?\s*\(?([^)]*)\)?/)
  const fn = match?.[1] ?? 'anonymous'
  const file = (match?.[2] ?? '').split(/[\\/]/).pop()?.replace(/[?#].*$/, '').replace(/:\d+:\d+$/, '') ?? ''

  return file ? `${fn} @ ${file}` : fn
}

const currentRoute = () => (typeof window !== 'undefined' ? window.location.pathname : 'server')

const percentile = (sorted: number[], ratio: number) => {
  if (!sorted.length) return 0

  return sorted[Math.min(sorted.length - 1, Math.ceil(ratio * sorted.length) - 1)]
}

export const summarizeRequestTrace = (source: RequestTraceEntry[] = entries): RequestTraceSummary => {
  const network = source.filter(entry => entry.cache === 'miss' || entry.cache === 'none')
  const durations = network.map(entry => entry.durationMs).sort((a, b) => a - b)
  const groups = new Map<string, RequestTraceEntry[]>()

  network.forEach(entry => {
    const key = `${entry.target}|${entry.fingerprint}`
    const group = groups.get(key) ?? []

    group.push(entry)
    groups.set(key, group)
  })

  const duplicates: RequestTraceSummary['duplicates'] = []

  groups.forEach(group => {
    const sorted = [...group].sort((a, b) => a.startedAt - b.startedAt)
    let count = 1

    for (let index = 1; index < sorted.length; index++) {
      if (sorted[index].startedAt - sorted[index - 1].startedAt <= DUPLICATE_WINDOW_MS) count++
    }

    if (count > 1) duplicates.push({ target: sorted[0].target, fingerprint: sorted[0].fingerprint, count })
  })

  return {
    total: source.length,
    network: network.length,
    cacheHits: source.filter(entry => entry.cache === 'hit').length,
    inflightJoins: source.filter(entry => entry.cache === 'inflight').length,
    duplicates,
    medianMs: percentile(durations, 0.5),
    p95Ms: percentile(durations, 0.95),
    slowest: [...network].sort((a, b) => b.durationMs - a.durationMs).slice(0, 10)
  }
}

const exposeOnWindow = () => {
  if (typeof window === 'undefined') return

  const target = window as unknown as { __IPS_REQUEST_TRACE__?: unknown }

  if (target.__IPS_REQUEST_TRACE__) return

  target.__IPS_REQUEST_TRACE__ = {
    entries,
    summary: () => summarizeRequestTrace(),
    clear: () => {
      entries.length = 0
    }
  }
}

export const recordRequestTrace = (
  entry: Omit<RequestTraceEntry, 'route' | 'side'> & { route?: string }
) => {
  if (!isRequestTraceEnabled()) return

  const full: RequestTraceEntry = {
    ...entry,
    route: entry.route ?? currentRoute(),
    side: typeof window === 'undefined' ? 'server' : 'client'
  }

  entries.push(full)
  if (entries.length > MAX_ENTRIES) entries.splice(0, entries.length - MAX_ENTRIES)
  exposeOnWindow()

  // eslint-disable-next-line no-console
  console.debug(
    `[req-trace] ${full.requestId} ${full.target} ${full.durationMs}ms status=${full.status} cache=${full.cache} fp=${full.fingerprint} route=${full.route} caller=${full.caller}`
  )
}

/** Test helper. */
export const resetRequestTrace = () => {
  entries.length = 0
}

export const getRequestTraceEntries = () => entries
