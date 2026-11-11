import { isValidResponse } from '@/shared/utils/isValidResponse'

/**
 * Authorization decision behind AuthorizedLayout, extracted as a dependency-injected function so
 * it can be tested behaviorally (the layout itself is an async Server Component). It decides
 * exactly what the layout decided before:
 *
 *   static policy  -> hasStaticAccess(context)
 *   super admin    -> allowed
 *   otherwise      -> WF_BO_LOAD_MENU user_command -> hasMenuAccess(userCommand, context)
 *
 * Fail-closed: any failure of a call required for the decision ends in 'unavailable', 'error' or
 * 'unauthorized' — never 'allowed'.
 *
 * Scheduling only (no effect on the decision): when `startMenuInParallel` is true the menu call is
 * started together with the context call; otherwise it is started only if the context says it is
 * needed. A menu call that ends up unused never produces an unhandled rejection.
 */

export type MenuInfoResponse = {
  status: number
  payload?: {
    dataresponse?: {
      success?: boolean
      data?: { data?: unknown } | null
      errors?: Array<{ info?: string; execute_id?: string }> | null
    } | null
  } | null
}

export type RouteAccessContext = { userCode?: string | null; isSuperAdmin: boolean }

export type RouteAccessResult =
  | { kind: 'allowed'; identity: string | null }
  | { kind: 'denied'; identity: string | null }
  | { kind: 'unavailable'; executionId: string | null }
  | { kind: 'unauthorized' }
  | { kind: 'error'; message: string }

type Deps<TContext extends RouteAccessContext> = {
  hasStaticPolicy: boolean
  startMenuInParallel: boolean
  getContext: () => Promise<TContext>
  getMenu: () => Promise<MenuInfoResponse>
  hasStaticAccess: (context: TContext) => boolean
  hasMenuAccess: (userCommand: unknown, context: TContext) => boolean
  /** Called with every successfully resolved context (e.g. to refresh the scheduling hint). */
  onContext?: (context: TContext) => void
}

const isServiceUnavailableError = (error: unknown): error is { serviceUnavailable: true; executionId?: string } =>
  typeof error === 'object' && error !== null && (error as { serviceUnavailable?: unknown }).serviceUnavailable === true

/** Same rule AuthorizedLayout always used: isValidResponse() and no workflow errors. */
export const isValidMenuResponse = (response: MenuInfoResponse | null | undefined): boolean =>
  Boolean(response?.payload?.dataresponse) &&
  Boolean(isValidResponse(response)) &&
  (response!.payload!.dataresponse!.errors?.length ?? 0) === 0

export async function resolveRouteAccess<TContext extends RouteAccessContext>({
  hasStaticPolicy,
  startMenuInParallel,
  getContext,
  getMenu,
  hasStaticAccess,
  hasMenuAccess,
  onContext
}: Deps<TContext>): Promise<RouteAccessResult> {
  const parallelMenu = !hasStaticPolicy && startMenuInParallel ? getMenu() : null

  parallelMenu?.catch(() => undefined)

  try {
    const context = await getContext()
    const identity = context.userCode || null

    onContext?.(context)

    if (hasStaticPolicy) {
      return hasStaticAccess(context) ? { kind: 'allowed', identity } : { kind: 'denied', identity }
    }

    if (context.isSuperAdmin) return { kind: 'allowed', identity }

    const menu = await (parallelMenu ?? getMenu())

    if (!isValidMenuResponse(menu)) {
      // A 401 maps to the common session-expired flow, never to a generic error message.
      if (menu?.status === 401) return { kind: 'unauthorized' }

      const firstError = menu?.payload?.dataresponse?.errors?.[0]
      const errorinfo = firstError?.info ?? 'Failed to fetch authorization data'
      const errorexecid = firstError?.execute_id ?? 'N/A'

      return { kind: 'error', message: `ExecutionID:${errorexecid} - ${errorinfo}` }
    }

    const userCommand = menu.payload?.dataresponse?.data?.data ?? []

    return hasMenuAccess(userCommand || [], context) ? { kind: 'allowed', identity } : { kind: 'denied', identity }
  } catch (error) {
    // Timeout / 502 / 503 / 504: availability problem, session still valid.
    if (isServiceUnavailableError(error)) {
      return { kind: 'unavailable', executionId: error.executionId || null }
    }

    return { kind: 'error', message: error instanceof Error ? error.message : 'Failed to fetch authorization context' }
  }
}
