import { auth } from '@/auth';
import { Locale } from '@/configs/i18n';
import { systemServiceApi } from '@/servers/system-service';
import { getAccessibleRoutes, hasRouteAccess } from '@/utils/authorization';
import { getDictionary } from '@/utils/getDictionary';
import { getLocalizedUrl } from '@/utils/i18n';
import { isValidResponse } from '@/utils/isValidResponse';
import { getServerMode } from '@/utils/serverHelpers';
import ErrorPage from '@/views/Error';
import type { Mode } from '@core/types';
import { Metadata } from 'next';
import { Session } from 'next-auth';
import { notFound, redirect } from 'next/navigation';
import { JSX } from 'react';

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
    }) => JSX.Element;

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
    unauthorizedBehavior = 'redirect'
}: AuthorizedLayoutProps) => {
    const resolvedParams = params;
    const mode = await getServerMode();

    // Get session and dictionary
    const [dictionary, session] = await Promise.all([
        getDictionary(resolvedParams.locale),
        auth(),
    ]);

    // Require authentication
    if (!session || !session.user) {
        redirect(getLocalizedUrl('/logout', resolvedParams.locale));
    }

    // Fetch user's authorized commands/menu structure
    const systemData = await systemServiceApi.getSystemInfo({
        sessiontoken: session.user.token as string,
        language: resolvedParams.locale
    });

    // Validate API response
    if (
        !isValidResponse(systemData) ||
        (systemData.payload.dataresponse.errors && systemData.payload.dataresponse.errors.length > 0)
    ) {
        const errorinfo = systemData.payload.dataresponse.errors
            ? systemData.payload.dataresponse.errors[0].info
            : 'Failed to fetch authorization data';
        const errorexecid = systemData.payload.dataresponse.errors
            ? systemData.payload.dataresponse.errors[0].execute_id
            : 'N/A';
        const errorString = `ExecutionID:${errorexecid} - ${errorinfo}`;
        return <ErrorPage error={errorString} side="server" />;
    }

    const datainput = systemData.payload.dataresponse.data
    const userCommand = datainput?.user_command;

    // **AUTHORIZATION CHECK**
    const hasAccess = hasRouteAccess(userCommand, requiredPath);

    // Debug logging (remove in production)
    if (process.env.NODE_ENV === 'development') {
        console.log('[AuthorizedLayout] Authorization check:', {
            requiredPath,
            hasAccess,
            accessibleRoutes: getAccessibleRoutes(userCommand),
            username: datainput?.name
        });
    }

    // Handle unauthorized access
    if (!hasAccess) {
        console.warn(`[AuthorizedLayout] Unauthorized access attempt to ${requiredPath} by ${datainput?.name || 'unknown'}`);
        
        switch (unauthorizedBehavior) {
            case 'notfound':
                notFound(); // Shows 404 page
                break;
            case 'forbidden':
                return <ErrorPage error="403 - Forbidden: You don't have permission to access this resource" side="server" />;
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
            const dataviewAPI = await systemServiceApi.viewData({
                sessiontoken: session.user.token as string,
                learnapi: 'cbs_workflow_execute',
                workflowid: 'SYS_EXECUTE_SQL',
                commandname: storename,
                issearch: false,
                parameters: { id: id },
            });

            if (
                !isValidResponse(dataviewAPI) ||
                (dataviewAPI.payload.dataresponse.error && dataviewAPI.payload.dataresponse.error.length > 0)
            ) {
                const errorinfo = dataviewAPI.payload.dataresponse.error
                    ? dataviewAPI.payload.dataresponse.error[0].info
                    : 'Unknown error occurred while fetching data.';
                const errorexecid = dataviewAPI.payload.dataresponse.error
                    ? dataviewAPI.payload.dataresponse.error[0].execute_id
                    : 'N/A';
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
