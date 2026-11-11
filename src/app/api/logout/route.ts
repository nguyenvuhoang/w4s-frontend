import { NextRequest, NextResponse } from 'next/server';
import { jwtDecode } from 'jwt-decode';
import { signOut } from '@/auth';
import { getBackendToken } from '@/server/auth/getBackendToken';
import { WORKFLOWCODE } from '@/data/WorkflowCode';
import { workflowService } from '@/servers/system-service';
import { WORKING_PROJECT_SCOPE_COOKIE } from '@/shared/constants/projectContext';
import logger from '@lib/logger'

const authCookieNames = [
  WORKING_PROJECT_SCOPE_COOKIE,
  'app',
  'authjs.callback-url',
  'authjs.csrf-token',
  'authjs.session-token',
  '__Host-authjs.csrf-token',
  '__Secure-authjs.callback-url',
  '__Secure-authjs.session-token',
  'next-auth.callback-url',
  'next-auth.csrf-token',
  'next-auth.session-token',
  '__Host-next-auth.csrf-token',
  '__Secure-next-auth.callback-url',
  '__Secure-next-auth.session-token'
]

const expireCookie = (response: NextResponse, name: string) => {
  response.cookies.set(name, '', {
    path: '/',
    expires: new Date(0),
    maxAge: 0,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax'
  })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { force = false, reason = 'manual' } = body;

    logger.log(`[LOGOUT API] Logout request received - Force: ${force}, Reason: ${reason}`);

    // Handle different logout scenarios
    if (reason === 'browser_close') {
      logger.log('[LOGOUT API] Browser close logout detected');
    } else if (reason === 'session_timeout') {
      logger.log('[LOGOUT API] Session timeout logout detected');
    }

    // Invalidate the session on the backend BEFORE clearing the NextAuth cookie below —
    // once signOut() runs, the encrypted cookie holding the real backend token is gone.
    // Resolved strictly server-side; the browser never has (and never needs to send) the
    // real token for this. Best-effort: a failed/timed-out backend logout must not block
    // the frontend session from being cleared.
    try {
      const backendCredential = await getBackendToken(req);

      if (backendCredential) {
        const claims = jwtDecode<Record<string, unknown>>(backendCredential.accessToken);
        const loginName = (claims.login_name as string | undefined) ?? (claims.username as string | undefined);

        if (loginName) {
          const result = await workflowService.runFODynamic({
            sessiontoken: backendCredential.accessToken,
            workflowid: WORKFLOWCODE.WF_BO_LOGOUT,
            input: { login_name: loginName }
          });

          const payload = result?.payload as any;
          if (!(payload?.success === true && payload?.data?.data === true)) {
            logger.warn('[LOGOUT API] Backend logout was not successful', payload);
          }
        }
      }
    } catch (error) {
      logger.error('[LOGOUT API] Failed to invalidate backend session:', error);
    }

    // Perform NextAuth signout
    await signOut({ redirect: false });

    const response = NextResponse.json({
      success: true,
      message: 'Logout successful',
      timestamp: new Date().toISOString()
    }, { status: 200 });

    const requestCookieNames = req.cookies.getAll().map(cookie => cookie.name)

    Array.from(new Set([...authCookieNames, ...requestCookieNames])).forEach(name => {
      expireCookie(response, name)
    })

    return response;

  } catch (error) {
    logger.error('[LOGOUT API] Error during logout:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Logout failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Handle GET requests (for manual logout via URL)
export async function GET(req: NextRequest) {
  logger.log('[LOGOUT API] GET logout request received');
  
  return POST(req);
}
