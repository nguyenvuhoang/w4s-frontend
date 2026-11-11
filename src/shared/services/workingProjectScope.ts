'use client'

const PROJECT_CONTEXT_API = '/api/project-context'

/** Same-origin cookie update — anything slower than this is treated as a failure, never a hang. */
export const PROJECT_SCOPE_SYNC_TIMEOUT_MS = 20_000

/**
 * Failure of the /api/project-context scope-cookie sync. `httpStatus` is set only when the route
 * actually answered; `responseReceived` is false for network errors / timeouts.
 */
export class ProjectScopeSyncError extends Error {
  httpStatus?: number
  responseReceived: boolean
  timedOut: boolean

  constructor({
    message,
    httpStatus,
    responseReceived,
    timedOut = false
  }: {
    message: string
    httpStatus?: number
    responseReceived: boolean
    timedOut?: boolean
  }) {
    super(message)

    this.name = 'ProjectScopeSyncError'
    this.httpStatus = httpStatus
    this.responseReceived = responseReceived
    this.timedOut = timedOut
  }
}

const createTimeoutSignal = (): AbortSignal | undefined =>
  typeof AbortSignal !== 'undefined' && typeof AbortSignal.timeout === 'function'
    ? AbortSignal.timeout(PROJECT_SCOPE_SYNC_TIMEOUT_MS)
    : undefined

const requestScopeUpdate = async (method: 'POST' | 'DELETE', projectCode?: string) => {
  let response: Response

  try {
    response = await fetch(PROJECT_CONTEXT_API, {
      method,
      headers: projectCode ? { 'Content-Type': 'application/json' } : undefined,
      body: projectCode ? JSON.stringify({ project_code: projectCode }) : undefined,
      credentials: 'include',
      signal: createTimeoutSignal()
    })
  } catch (error) {
    const name = (error as { name?: string })?.name
    const timedOut = name === 'TimeoutError' || name === 'AbortError'

    throw new ProjectScopeSyncError({
      message: timedOut
        ? `${method} ${PROJECT_CONTEXT_API} timed out after ${PROJECT_SCOPE_SYNC_TIMEOUT_MS}ms.`
        : `${method} ${PROJECT_CONTEXT_API} failed before a response was received.`,
      responseReceived: false,
      timedOut
    })
  }

  if (!response.ok) {
    throw new ProjectScopeSyncError({
      message: `${method} ${PROJECT_CONTEXT_API} returned HTTP ${response.status}.`,
      httpStatus: response.status,
      responseReceived: true
    })
  }
}

export const synchronizeWorkingProjectScope = (projectCode: string) =>
  requestScopeUpdate('POST', projectCode)

export const clearWorkingProjectScope = () => requestScopeUpdate('DELETE')
