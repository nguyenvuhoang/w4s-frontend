// stores/useWorkingProjectStore.ts
import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

import type { Locale } from '@/configs/i18n'
import { BoContextError, boContextService, type BoContextResult } from '@/shared/services/boContextService'
import {
  clearWorkingProjectScope,
  ProjectScopeSyncError,
  synchronizeWorkingProjectScope
} from '@/shared/services/workingProjectScope'
import {
  createBootDiagnostic,
  logBootStage,
  type WorkspaceBootDiagnostic
} from '@/shared/services/workspaceBootDiagnostics'

export type WorkingProjectOption = {
  id: number
  code: string
  name: string
}

/**
 * LOADING            — WF_BO_GET_BO_CONTEXT is in flight (or hasn't started yet); nothing may
 *                       render behind this except a loading screen.
 * NO_PROJECT_ACCESS   — the user has zero authorized projects; dead end, no project-dependent
 *                       screen or API call is allowed.
 * REQUIRE_SELECTION   — projects exist but there is no valid saved selection for this user yet;
 *                       a mandatory, non-dismissible full-page picker must be shown.
 * READY               — selectedProject is a project that is actually in the authorized list;
 *                       the dashboard and scope-dependent requests may proceed. For a super admin
 *                       (is_super_admin === true from a FRESH WF_BO_GET_BO_CONTEXT response, never
 *                       cache) READY may also have `project: null` — "no project selected / all
 *                       projects"; RequireWorkingProject still gates project-specific screens.
 * SERVICE_UNAVAILABLE — WF_BO_GET_BO_CONTEXT hit a timeout / 502 / 503 / 504 / network failure.
 *                       The session is still valid — this is an availability problem, never a
 *                       logout trigger. Shows a full-page "temporarily unavailable" state and only
 *                       retries when the user asks (no auto-retry, no reload).
 * ERROR               — WF_BO_GET_BO_CONTEXT failed for any other reason (business/workflow
 *                       error, missing user_code, ...); blocks like LOADING, with retry.
 *
 * A genuinely invalid session (401 / requireLogout) never lands in any of these: http.ts runs the
 * existing logoutClientSession() flow before the call even resolves.
 */
export type ProjectContextStatus =
  | 'LOADING'
  | 'REQUIRE_SELECTION'
  | 'READY'
  | 'NO_PROJECT_ACCESS'
  | 'SERVICE_UNAVAILABLE'
  | 'ERROR'

export const SELECTED_PROJECT_KEY_PREFIX = 'ips:selected-project:'

/**
 * Legacy keys from earlier (buggy) implementations that stored the selected project under a
 * single shared key. A value left behind under any of these keys would leak the previous
 * user's project/scope to the next user who logs in on the same browser, so they must be
 * wiped — never read — going forward.
 */
const LEGACY_SHARED_KEYS = ['ips-working-project', 'selected_project', 'selectedProject', 'currentProject']

const isBrowser = () => typeof window !== 'undefined'

const buildStorageKey = (userCode: string) => `${SELECTED_PROJECT_KEY_PREFIX}${userCode}`

const migrateLegacySharedKeys = () => {
  if (!isBrowser()) return

  LEGACY_SHARED_KEYS.forEach(key => {
    try {
      window.localStorage.removeItem(key)
    } catch {
      // ignore storage access errors (private mode, disabled storage, ...)
    }
  })
}

// Persisted shape mirrors the backend field names (project_id/project_code/project_name) per
// the WF_BO_GET_BO_CONTEXT contract; the in-memory shape stays {id, code, name} so the ~20
// existing feature hooks reading useWorkingProject()/useWorkingProjectId() keep working.
type PersistedProject = {
  project_id: number
  project_code: string
  project_name: string
}

const toPersisted = (project: WorkingProjectOption): PersistedProject => ({
  project_id: project.id,
  project_code: project.code,
  project_name: project.name
})

const fromPersisted = (raw: any): WorkingProjectOption | null => {
  if (!raw || typeof raw !== 'object') return null
  if (typeof raw.project_id !== 'number' || typeof raw.project_code !== 'string' || typeof raw.project_name !== 'string') {
    return null
  }

  return { id: raw.project_id, code: raw.project_code, name: raw.project_name }
}

const readSavedProject = (userCode: string): WorkingProjectOption | null => {
  if (!isBrowser() || !userCode) return null

  try {
    const raw = window.localStorage.getItem(buildStorageKey(userCode))

    if (!raw) return null

    return fromPersisted(JSON.parse(raw))
  } catch {
    return null
  }
}

const writeSavedProject = (userCode: string, project: WorkingProjectOption) => {
  if (!isBrowser() || !userCode) return

  try {
    window.localStorage.setItem(buildStorageKey(userCode), JSON.stringify(toPersisted(project)))
  } catch {
    // ignore storage access errors
  }
}

const removeSavedProject = (userCode: string) => {
  if (!isBrowser() || !userCode) return

  try {
    window.localStorage.removeItem(buildStorageKey(userCode))
  } catch {
    // ignore storage access errors
  }
}

/**
 * Snapshot every per-user saved-project entry so callers that need to wipe localStorage for
 * other reasons (e.g. a full security clear on forced logout) can restore them afterwards —
 * logging out must never delete a user's saved project, only the in-memory selection.
 */
export const snapshotSavedProjects = (): Array<[string, string]> => {
  if (!isBrowser()) return []

  const entries: Array<[string, string]> = []

  try {
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i)

      if (key && key.startsWith(SELECTED_PROJECT_KEY_PREFIX)) {
        const value = window.localStorage.getItem(key)

        if (value !== null) entries.push([key, value])
      }
    }
  } catch {
    return []
  }

  return entries
}

export const restoreSavedProjects = (entries: Array<[string, string]>) => {
  if (!isBrowser()) return

  entries.forEach(([key, value]) => {
    try {
      window.localStorage.setItem(key, value)
    } catch {
      // ignore storage access errors
    }
  })
}

type WorkingProjectStore = {
  status: ProjectContextStatus
  userCode: string | null
  isSuperAdmin: boolean
  projects: WorkingProjectOption[]
  project: WorkingProjectOption | null
  /** Technical detail, for console/debug only — never render this directly in the UI. */
  error: string | null
  /** WF_BO_GET_BO_CONTEXT execution_id of the last failure, safe to show as a user-facing reference tag. */
  errorReference: string | null
  /** Backend workflow error code (e.g. "system.error") of the last failure, for debug/telemetry. */
  errorCode: string | null
  /** Structured, sanitized diagnostic of the last bootstrap failure (stage, codes, ids). */
  diagnostic: WorkspaceBootDiagnostic | null
  /** Number of initialize() attempts in this session (shown in diagnostics). */
  attempt: number
  /** True only when a project was previously saved for this user but is no longer in the authorized list. */
  wasProjectInvalidated: boolean
  /**
   * True while a retry started from SERVICE_UNAVAILABLE is in flight. Status deliberately stays
   * SERVICE_UNAVAILABLE meanwhile, so the unavailable page stays put with its retry button in a
   * loading/disabled state instead of flashing to the boot loader and back.
   */
  retrying: boolean

  /**
   * Boot sequence for the project context:
   * restore session -> call WF_BO_GET_BO_CONTEXT with an empty scope -> resolve user_code and
   * authorized projects -> check the project saved for THIS user_code -> only keep it if it is
   * still present in the authorized list -> set the context. Concurrent/duplicate calls while
   * one is already in flight reuse the same pending promise instead of firing twice.
   */
  initialize: (params: { sessiontoken?: string; language?: Locale | string }) => Promise<void>
  setProject: (project: WorkingProjectOption) => Promise<void>
  clearProject: () => void
  /** Wipes runtime state (not storage) — call on logout / session change so the next user never inherits this user's in-memory project. */
  reset: () => void
}

const idleState = {
  status: 'LOADING' as ProjectContextStatus,
  userCode: null as string | null,
  isSuperAdmin: false,
  projects: [] as WorkingProjectOption[],
  project: null as WorkingProjectOption | null,
  error: null as string | null,
  errorReference: null as string | null,
  errorCode: null as string | null,
  diagnostic: null as WorkspaceBootDiagnostic | null,
  attempt: 0,
  wasProjectInvalidated: false,
  retrying: false
}

// Dedupes concurrent initialize() calls (multiple mounted consumers effectively boot at the
// same time) without relying on `status` — which now starts at 'LOADING' by default, so it
// cannot double as an "already fetching" marker the way a separate 'idle' state could.
let inFlightInitialize: Promise<void> | null = null

/**
 * A BO context that WAS fetched successfully, kept only while the following PROJECT_CONTEXT step
 * (scope-cookie sync) is failing - so "Retry" repeats just that step instead of re-calling
 * WF_BO_GET_BO_CONTEXT. Never survives a success, a different failure, or reset().
 */
let contextAwaitingScopeSync: BoContextResult | null = null

const toDiagnostic = (err: unknown): WorkspaceBootDiagnostic => {
  if (err instanceof BoContextError) {
    return createBootDiagnostic({
      stage: err.stage,
      errorCode: err.errorCode,
      message: err.message,
      httpStatus: err.httpStatus,
      executionId: err.executionId,
      requestId: err.requestId,
      workflowErrorCode: err.workflowErrorCode,
      timestamp: err.timestamp,
      retryable: err.retryable,
      requestSent: err.requestSent,
      responseReceived: err.responseReceived
    })
  }

  if (err instanceof ProjectScopeSyncError) {
    return createBootDiagnostic({
      stage: 'PROJECT_CONTEXT',
      errorCode: err.timedOut ? 'TIMEOUT' : 'PROJECT_SCOPE_SYNC_FAILED',
      message: err.message,
      httpStatus: err.httpStatus,
      requestSent: true,
      responseReceived: err.responseReceived
    })
  }

  return createBootDiagnostic({
    stage: 'BO_CONTEXT',
    errorCode: 'UNKNOWN',
    message: err instanceof Error ? err.message : 'Unable to load user context.'
  })
}

const logFailure = (diagnostic: WorkspaceBootDiagnostic) =>
  logBootStage(diagnostic.stage, 'fail', {
    errorCode: diagnostic.errorCode,
    httpStatus: diagnostic.httpStatus,
    executionId: diagnostic.executionId,
    requestId: diagnostic.requestId,
    requestSent: diagnostic.requestSent,
    responseReceived: diagnostic.responseReceived
  })

export const useWorkingProjectStore = create<WorkingProjectStore>()(
  devtools(
    (set, get) => ({
      ...idleState,

      initialize: ({ sessiontoken, language }) => {
        if (inFlightInitialize) {
          return inFlightInitialize
        }

        // SESSION_CHECK: without the client session marker nothing can be requested. This used to
        // return silently and leave the dashboard on the boot loader forever; now it is a visible,
        // non-retryable failure (the fix is to sign in again, not to retry).
        if (!sessiontoken) {
          const diagnostic = createBootDiagnostic({
            stage: 'SESSION_CHECK',
            errorCode: 'SESSION_MISSING',
            message: 'No client session marker was provided to the workspace bootstrap.',
            requestSent: false,
            responseReceived: false
          })

          logFailure(diagnostic)
          contextAwaitingScopeSync = null
          set(
            { ...idleState, status: 'ERROR', error: diagnostic.message, diagnostic, attempt: get().attempt + 1 },
            false,
            'initialize/sessionMissing'
          )

          return Promise.resolve()
        }

        inFlightInitialize = (async () => {
          const attempt = get().attempt + 1

          if (get().status === 'SERVICE_UNAVAILABLE') {
            set({ retrying: true, attempt }, false, 'initialize/retry')
          } else {
            set(
              { status: 'LOADING', error: null, errorReference: null, errorCode: null, diagnostic: null, attempt },
              false,
              'initialize/start'
            )
          }

          logBootStage('SESSION_CHECK', 'ok', { attempt })
          migrateLegacySharedKeys()

          try {
            // Retry after a PROJECT_CONTEXT failure repeats only the scope sync; any other failure
            // (or a first attempt) always asks the backend afresh.
            let context = contextAwaitingScopeSync

            if (context) {
              logBootStage('BO_CONTEXT', 'ok', { reused: true })
            } else {
              logBootStage('BFF_REQUEST', 'start', { attempt })
              context = await boContextService.getContext({ sessiontoken, language })
              logBootStage('BO_CONTEXT', 'ok', { projects: context.projects.length, superAdmin: context.isSuperAdmin })
            }

            contextAwaitingScopeSync = null

            if (!context.userCode) {
              const diagnostic = createBootDiagnostic({
                stage: 'BO_CONTEXT',
                errorCode: 'MISSING_USER_CODE',
                message: 'WF_BO_GET_BO_CONTEXT did not return user_code.',
                requestSent: true,
                responseReceived: true
              })

              logFailure(diagnostic)
              set(
                { ...idleState, status: 'ERROR', error: diagnostic.message, diagnostic, attempt },
                false,
                'initialize/missingUserCode'
              )

              return
            }

            // Super admin: backend-confirmed is_super_admin from THIS response may work without any
            // project (fresh go-live DB) - never a fake project id. Everyone else keeps the dead end.
            if (context.projects.length === 0 && !context.isSuperAdmin) {
              set(
                {
                  status: 'NO_PROJECT_ACCESS',
                  userCode: context.userCode,
                  isSuperAdmin: context.isSuperAdmin,
                  projects: [],
                  project: null,
                  error: null,
                  errorReference: null,
                  errorCode: null,
                  diagnostic: null,
                  wasProjectInvalidated: false
                },
                false,
                'initialize/noProjectAccess'
              )

              return
            }

            const savedProject = readSavedProject(context.userCode)
            const authorizedProject = context.projects.find(
              project => project.id === savedProject?.id && project.code === savedProject?.code
            ) ?? null

            // A saved project that is no longer authorized must never reach the backend - drop
            // it from storage immediately, keep only the in-memory flag that lets the UI offer
            // the picker straight away.
            const wasProjectInvalidated = Boolean(savedProject) && !authorizedProject

            if (wasProjectInvalidated) {
              removeSavedProject(context.userCode)
            }

            try {
              logBootStage('PROJECT_CONTEXT', 'start', { hasProject: Boolean(authorizedProject) })

              if (authorizedProject) {
                await synchronizeWorkingProjectScope(authorizedProject.code)
              } else {
                await clearWorkingProjectScope()
              }

              logBootStage('PROJECT_CONTEXT', 'ok')
            } catch (scopeError) {
              // BO context itself is fine - keep it so Retry only redoes this step.
              contextAwaitingScopeSync = context
              throw scopeError
            }

            // No fallback to projects[0] and no auto-select, even with a single project. A regular
            // user without a valid saved project must pick one (REQUIRE_SELECTION); a super admin
            // may continue with no project selected.
            const status: ProjectContextStatus = authorizedProject || context.isSuperAdmin ? 'READY' : 'REQUIRE_SELECTION'

            set(
              {
                status,
                userCode: context.userCode,
                isSuperAdmin: context.isSuperAdmin,
                projects: context.projects,
                project: authorizedProject,
                error: null,
                errorReference: null,
                errorCode: null,
                diagnostic: null,
                wasProjectInvalidated,
                retrying: false
              },
              false,
              'initialize/success'
            )

            if (status === 'READY') {
              logBootStage('DASHBOARD_READY', 'ok', { hasProject: Boolean(authorizedProject), superAdmin: context.isSuperAdmin })
            }
          } catch (err) {
            // err.message is still raw backend/technical text - the UI never renders `error`
            // directly; it shows a fixed, localized message plus the sanitized `diagnostic`
            // (execution_id / client request id as references).
            const contextError = err instanceof BoContextError ? err : null
            const diagnostic = toDiagnostic(err)

            if (!(err instanceof ProjectScopeSyncError)) {
              contextAwaitingScopeSync = null
            }

            logFailure(diagnostic)

            // Only the typed flag from boContextService decides SERVICE_UNAVAILABLE - a business/
            // workflow error, missing user_code or a scope-cookie sync failure stays a plain ERROR.
            // isSuperAdmin is cleared: a failed bootstrap must never keep a previous admin flag.
            set(
              {
                status: contextError?.serviceUnavailable ? 'SERVICE_UNAVAILABLE' : 'ERROR',
                isSuperAdmin: false,
                error: err instanceof Error ? err.message : 'Unable to load user context.',
                errorReference: contextError?.executionId ?? null,
                errorCode: contextError?.workflowErrorCode ?? null,
                diagnostic
              },
              false,
              'initialize/error'
            )
          } finally {
            inFlightInitialize = null

            if (get().retrying) {
              set({ retrying: false }, false, 'initialize/retryDone')
            }
          }
        })()

        return inFlightInitialize
      },

      setProject: async (project) => {
        await synchronizeWorkingProjectScope(project.code)

        const userCode = get().userCode

        if (userCode) {
          writeSavedProject(userCode, project)
        }

        set({ project, status: 'READY', wasProjectInvalidated: false }, false, 'setProject')
      },

      clearProject: () => {
        const { userCode, projects, isSuperAdmin } = get()

        if (userCode) {
          removeSavedProject(userCode)
        }

        void clearWorkingProjectScope().catch(() => {
          // best-effort cookie clear; UI state below still resets regardless of outcome
        })

        set(
          {
            project: null,
            // A super admin stays READY with no project selected; regular users keep the old rule.
            status: isSuperAdmin ? 'READY' : projects.length > 0 ? 'REQUIRE_SELECTION' : 'NO_PROJECT_ACCESS'
          },
          false,
          'clearProject'
        )
      },

      reset: () => {
        inFlightInitialize = null
        contextAwaitingScopeSync = null
        set({ ...idleState }, false, 'reset')
      }
    }),
    { name: 'WorkingProjectStore' }
  )
)

// Optimized selectors for better performance
export const useWorkingProject = () => useWorkingProjectStore((state) => state.project)
export const useWorkingProjectId = () => useWorkingProjectStore((state) => state.project?.id ?? null)
export const useWorkingProjectStatus = () => useWorkingProjectStore((state) => state.status)
export const useWorkingProjectList = () => useWorkingProjectStore((state) => state.projects)
export const useWorkingProjectIsSuperAdmin = () => useWorkingProjectStore((state) => state.isSuperAdmin)
export const useWorkingProjectWasInvalidated = () => useWorkingProjectStore((state) => state.wasProjectInvalidated)
export const useWorkingProjectErrorReference = () => useWorkingProjectStore((state) => state.errorReference)
export const useWorkingProjectRetrying = () => useWorkingProjectStore((state) => state.retrying)
export const useWorkingProjectDiagnostic = () => useWorkingProjectStore((state) => state.diagnostic)
export const useWorkingProjectAttempt = () => useWorkingProjectStore((state) => state.attempt)

/**
 * The identity that WF_BO_LOAD_MENU's menu tree is actually scoped by: `null` while the project
 * context isn't resolved yet (nothing should fetch/show a menu), otherwise the exact project code
 * that ends up in the `scope` request header (see src/servers/lib/http.ts's `baseHeaders.scope`
 * and src/shared/services/menuService.ts's cache key, which both use this same formula) — an
 * empty string is a valid, distinct scope, not "not ready".
 *
 * A plain string/null primitive on purpose: useDashboardMenu/PermissionProvider key an effect's
 * dependency array on it, and switching project (setProject sets `project` + `status: 'READY'`
 * atomically, no intermediate LOADING) changes this value in exactly one render, giving them a
 * single, unambiguous "the menu must reload now" signal instead of each re-deriving it themselves.
 */
export const useMenuScope = (): string | null =>
  useWorkingProjectStore((state) => (state.status === 'READY' ? state.project?.code ?? '' : null))
