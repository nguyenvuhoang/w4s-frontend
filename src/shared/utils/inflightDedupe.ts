/**
 * In-flight request deduplication for read-only workflow calls.
 *
 * Two *identical* read requests that overlap in time (same user token, project scope, language,
 * app, workflow id and fields) share one network round trip. Nothing is cached after the request
 * settles: the next call always reaches the backend, so refresh / revalidation / post-mutation
 * reloads keep their current behavior.
 *
 * Safety rules:
 *  - Only workflow ids that look read-only (SEARCH/GET/VIEW/LIST/...) and contain no write verb
 *    are ever deduplicated. Mutation workflows always go to the network.
 *  - Starting any non-read request clears the in-flight table, so a reload issued right after a
 *    mutation can never join a read that started *before* that mutation (stale data).
 *  - Every joiner receives its own structured clone, so one caller mutating the response object
 *    cannot affect another caller.
 */

const READ_TOKENS = new Set(['SEARCH', 'GET', 'VIEW', 'LIST', 'LOOKUP', 'LOAD', 'DETAIL', 'DETAILS', 'COUNT', 'SUMMARY', 'FIND', 'QUERY', 'CONTEXT'])

const WRITE_TOKENS = new Set([
  'CREATE', 'INSERT', 'ADD', 'UPDATE', 'MODIFY', 'EDIT', 'DELETE', 'REMOVE', 'APPROVE', 'REJECT',
  'IMPORT', 'EXPORT', 'SEND', 'CHANGE', 'RESET', 'SUBMIT', 'CANCEL', 'LOCK', 'UNLOCK', 'ACTIVATE',
  'DEACTIVATE', 'SAVE', 'UPLOAD', 'LOGIN', 'LOGOUT', 'EXECUTE', 'SYNC', 'GENERATE', 'ASSIGN',
  'UNASSIGN', 'PAY', 'POST', 'PUBLISH', 'UNPUBLISH', 'CLOSE', 'OPEN', 'CONFIRM', 'VERIFY', 'SET',
  'REGISTER', 'BOOK', 'MARK', 'READ', 'TRANSFER', 'RESTORE', 'ARCHIVE', 'ENABLE', 'DISABLE', 'NOTIFY'
])

/** True only for workflow ids that clearly describe a read and never a write. */
export const isReadOnlyWorkflowId = (workflowId: unknown): boolean => {
  if (typeof workflowId !== 'string' || !workflowId.trim()) return false

  const tokens = workflowId.trim().toUpperCase().split(/[^A-Z0-9]+/).filter(Boolean)

  if (tokens.some(token => WRITE_TOKENS.has(token))) return false

  return tokens.some(token => READ_TOKENS.has(token))
}

/** Workflow id of a `{ workflowid, fields }` body (runFODynamic shape), otherwise null. */
export const getDynamicWorkflowId = (body: unknown): string | null => {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return null

  const record = body as Record<string, unknown>

  if (typeof record.workflowid !== 'string') return null
  if (!record.fields || typeof record.fields !== 'object') return null

  return record.workflowid
}

type InflightEntry = { promise: Promise<unknown>; joins: number }

const inflight = new Map<string, InflightEntry>()

const cloneResult = <T>(value: T): T => {
  try {
    return structuredClone(value)
  } catch {
    return value
  }
}

/**
 * Runs `factory` unless an identical request (same `key`) is already in flight, in which case
 * the caller joins it. `onJoin` lets the caller record the join for tracing.
 */
export const dedupeInflight = <T>(key: string, factory: () => Promise<T>, onJoin?: () => void): Promise<T> => {
  const existing = inflight.get(key)

  if (existing) {
    existing.joins++
    onJoin?.()

    return (existing.promise as Promise<T>).then(cloneResult)
  }

  const promise = factory()
  const entry: InflightEntry = { promise, joins: 0 }

  inflight.set(key, entry)

  const release = () => {
    if (inflight.get(key) === entry) inflight.delete(key)
  }

  // Registered before the caller's own continuation, so no one can join after settlement.
  promise.then(release, release)

  // The original object is handed out untouched only when nobody joined; otherwise the first
  // caller also gets a clone so every consumer owns an independent copy.
  return promise.then(value => (entry.joins > 0 ? cloneResult(value) : value))
}

/** Drop every in-flight entry (called when a mutation starts, or on logout). */
export const clearInflightRequests = () => {
  inflight.clear()
}

export const getInflightRequestCount = () => inflight.size
