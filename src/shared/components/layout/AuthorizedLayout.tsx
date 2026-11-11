import { auth } from '@/auth';
import { getStaticRouteAccessPolicy, hasStaticRouteAccess } from '@/configs/staticRouteAccess';
import { Locale } from '@/configs/i18n';
import { dataService, formService } from '@/servers/system-service';
import { boContextService } from '@/shared/services/boContextService';
import SystemUnavailableState from '@/shared/components/project-context/SystemUnavailableState';
import { hasEffectiveScreenActionAccess } from '@utils/authorization';
import { getDictionary } from '@utils/getDictionary';
import { getLocalizedUrl } from '@utils/i18n';
import { isValidResponse } from '@utils/isValidResponse';
import { getServerMode } from '@utils/serverHelpers';
import ErrorPage from '@/views/Error';
import type { Mode } from '@core/types';
import type { PermissionAction } from '@shared/permissions/permissionTypes';
import { Metadata } from 'next';
import { Session } from 'next-auth';
import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import { JSX } from 'react';
import { WORKFLOWCODE } from '@/data/WorkflowCode';
import ForbiddenPage from '@/views/ForbiddenPage';
import { getServerBackendToken } from '@/server/auth/getServerBackendToken';
import { recordSuperAdminHint, shouldStartMenuInParallel } from '@/server/auth/authorizationSchedulingHint';
import { resolveRouteAccess } from './resolveRouteAccess';

export const generateAuthMetadata = (pageName: string): Metadata => ({
    title: `${pageName}`,
    description: `Portal system`,
});

interface AuthorizedLayoutProps {
    /**
     * Required route path for authorization check
     * Example: '/contract-management/lock'
     */
    requiredPath: string;

    /**
     * Action to require on the resolved permission screen. Defaults to 'VIEW' (existing behavior).
     * Use 'ADD' for /create routes, 'MODIFY' for /edit routes, etc. — see PermissionAction.
     */
    requiredAction?: PermissionAction;

    /**
     * Explicit override for which menu screen's permission to check, when the page's own route
     * does not share a path prefix with the screen that actually owns the action.
     *
     * Longest-prefix matching (see resolveScreenRoute in permissionUtils.ts) only resolves child
     * routes correctly, e.g. `/properties/project/5/edit` -> `/properties/project`. It cannot
     * resolve a *sibling* route: `/resident/import` has no path relationship to `/resident/list`,
     * where the IMPORT command actually lives, so permission resolution needs the explicit href:
     *
     *   <AuthorizedLayout requiredPath="/resident/import" permissionHref="/resident/list" requiredAction="IMPORT">
     *
     * Falls back to `requiredPath` when omitted (existing behavior, unchanged for every route that
     * doesn't pass this prop).
     */
    permissionHref?: string;

    /**
     * Children render function that receives context props
     */
    children: (props: {
        mode: Mode;
        dictionary: any;
        locale: Locale;
        session: Session | null;
        storename?: string;
        id?: string;
        dataview?: any;
    }) => JSX.Element | Promise<JSX.Element>;

    /**
     * Route parameters
     */
    params: { locale: Locale; slug?: string[]; details?: string[] };

    /**
     * Optional: Custom unauthorized behavior
     * - 'redirect': Redirect to dashboard (default)
     * - 'notfound': Show 404 page
     * - 'forbidden': Show 403 forbidden error
     */
    unauthorizedBehavior?: 'redirect' | 'notfound' | 'forbidden';
}

/**
 * AuthorizedLayout - Server component for route-level authorization
 * 
 * This component enforces server-side access control by:
 * 1. Fetching user's authorized menu structure (user_command) from API
 * 2. Checking if the requested route exists in user's accessible routes
 * 3. Blocking access if unauthorized (404/403 or redirect)
 * 
 * Usage:
 * ```tsx
 * <AuthorizedLayout 
 *   requiredPath="/contract-management/lock"
 *   params={params}
 * >
 *   {({ session, dictionary, locale }) => (
 *     <YourPageContent />
 *   )}
 * </AuthorizedLayout>
 * ```
 * 
 * Security Benefits:
 * - Prevents direct URL access to unauthorized pages
 * - Server-side check cannot be bypassed by client manipulation
 * - Works even if menu is hidden on client side
 */
const AuthorizedLayout = async ({
    children,
    params,
    requiredPath,
    requiredAction = 'VIEW',
    permissionHref,
    unauthorizedBehavior = 'forbidden'
}: AuthorizedLayoutProps) => {
    const resolvedParams = params;

    // Independent, local-only lookups (cookies / session cookie decode / dictionary file) run in
    // parallel instead of one after another — this render blocks every route transition.
    // The real backend token is server-only — used below purely for server-to-backend
    // authorization calls, never forwarded into `children()`'s session prop (that one stays the
    // safe, browser-shape session from auth() — see src/auth.ts).
    const [mode, dictionary, session, rawBackendToken] = await Promise.all([
        getServerMode(),
        getDictionary(resolvedParams.locale),
        auth(),
        getServerBackendToken(),
    ]);

    // Require authentication
    if (!session || !session.user) {
        redirect(getLocalizedUrl('/logout', resolvedParams.locale));
    }

    const backendToken = rawBackendToken as string;

    const accessHref = permissionHref ?? requiredPath;
    const staticPolicy = getStaticRouteAccessPolicy(accessHref)

    // Decision logic lives in resolveRouteAccess (behaviorally tested, fail-closed). Every render
    // calls WF_BO_GET_BO_CONTEXT fresh — nothing about authorization is cached across navigations.
    // WF_BO_LOAD_MENU is only needed for non-static routes of non-super-admin users; it is started
    // together with the context call unless the scheduling hint says this session is a super admin
    // (see authorizationSchedulingHint — latency only, never an access input).
    const access = await resolveRouteAccess({
        hasStaticPolicy: Boolean(staticPolicy),
        startMenuInParallel: shouldStartMenuInParallel(backendToken, Boolean(staticPolicy)),
        getContext: () => boContextService.getContext({
            sessiontoken: backendToken,
            language: resolvedParams.locale
        }),
        getMenu: async () => {
            const cookieStore = await cookies()

            return formService.getMenuInfo({
                sessiontoken: backendToken,
                language: resolvedParams.locale,
                application: cookieStore.get('app')?.value as string | undefined
            })
        },
        hasStaticAccess: boContext => hasStaticRouteAccess({
            route: accessHref,
            action: requiredAction,
            isSuperAdmin: boContext.isSuperAdmin
        }),
        hasMenuAccess: (userCommand, boContext) => hasEffectiveScreenActionAccess({
            userCommand: (userCommand as any) || [],
            route: accessHref,
            action: requiredAction,
            isSuperAdmin: boContext.isSuperAdmin
        }),
        onContext: boContext => recordSuperAdminHint(backendToken, boContext.isSuperAdmin)
    })

    // WF_BO_GET_BO_CONTEXT timeout / 502 / 503 / 504: availability problem, session still valid —
    // show the unavailable state (retry = router.refresh(), re-running this server render) instead
    // of ErrorPage, and never route it through any logout path.
    if (access.kind === 'unavailable') {
        return (
            <SystemUnavailableState
                variant="content"
                dictionary={{ systemUnavailable: dictionary?.systemUnavailable }}
                errorReference={access.executionId}
            />
        )
    }

    // A 401 from WF_BO_LOAD_MENU goes through ErrorPage's "session expired" flow.
    if (access.kind === 'unauthorized') {
        return <ErrorPage error="UNAUTHORIZED" side="server" />
    }

    if (access.kind === 'error') {
        return <ErrorPage error={access.message} side="server" />
    }

    const hasAccess = access.kind === 'allowed'

    // Handle unauthorized access
    if (!hasAccess) {

        switch (unauthorizedBehavior) {
            case 'notfound':
                notFound(); // Shows 404 page
                break;
            case 'forbidden':
                return (
                    <ForbiddenPage
                        locale={resolvedParams.locale}
                        dictionary={dictionary}
                    />
                )
            case 'redirect':
            default:
                // Redirect to dashboard
                redirect(getLocalizedUrl('/', resolvedParams.locale));
        }
    }

    // Handle optional data fetching (for detail pages)
    let storename: string | undefined;
    let id: string | undefined;
    let viewdata: any;

    const routeParams = resolvedParams.slug || resolvedParams.details;
    if (routeParams && Array.isArray(routeParams)) {
        storename = routeParams[routeParams.length - 2];
        id = routeParams[routeParams.length - 1];

        if (storename && id) {
            const dataviewAPI = await dataService.viewData({
                sessiontoken: backendToken,
                learnapi: 'cbs_workflow_execute',
                workflowid: WORKFLOWCODE.SYS_EXECUTE_SQL,
                commandname: storename,
                issearch: false,
                parameters: { id: id },
            });

            const dataViewErrors = dataviewAPI?.payload?.dataresponse?.error;
            const timeoutMessage = dataviewAPI?.payload?.message?.[0];

            if (
                !isValidResponse(dataviewAPI) ||
                (Array.isArray(dataViewErrors) && dataViewErrors.length > 0)
            ) {
                const errorinfo = dataViewErrors?.[0]?.info || timeoutMessage || 'Unknown error occurred while fetching data.';
                const errorexecid = dataViewErrors?.[0]?.execute_id || 'N/A';
                const errorString = `ExecutionID:${errorexecid} - ${errorinfo}`;
                return <ErrorPage error={errorString} side="server" />;
            }

            viewdata = dataviewAPI.payload.dataresponse.data.input.data[0];
        }
    }

    // Render authorized content
    return children({
        mode,
        dictionary,
        locale: resolvedParams.locale,
        session,
        storename,
        id,
        dataview: viewdata,
    });
};

export default AuthorizedLayout;

