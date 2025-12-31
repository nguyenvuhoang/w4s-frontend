import { NextRequest, NextResponse } from 'next/server';
import { signOut } from '@/auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { force = false, reason = 'manual' } = body;

    console.log(`[LOGOUT API] Logout request received - Force: ${force}, Reason: ${reason}`);

    // Handle different logout scenarios
    if (reason === 'browser_close') {
      console.log('[LOGOUT API] Browser close logout detected');
    } else if (reason === 'session_timeout') {
      console.log('[LOGOUT API] Session timeout logout detected');
    }

    // Perform NextAuth signout
    await signOut({ redirect: false });

    // Clear any additional server-side sessions or tokens here if needed
    // You can add calls to your backend services to invalidate tokens

    const response = NextResponse.json({
      success: true,
      message: 'Logout successful',
      timestamp: new Date().toISOString()
    }, { status: 200 });

    // Clear cookies
    response.cookies.set('next-auth.session-token', '', {
      path: '/',
      expires: new Date(0),
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    });

    response.cookies.set('next-auth.csrf-token', '', {
      path: '/',
      expires: new Date(0),
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    });

    return response;

  } catch (error) {
    console.error('[LOGOUT API] Error during logout:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Logout failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Handle GET requests (for manual logout via URL)
export async function GET(req: NextRequest) {
  console.log('[LOGOUT API] GET logout request received');
  
  return POST(req);
}
