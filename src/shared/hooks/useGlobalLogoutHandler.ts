'use client'

import { useEffect, useRef } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from '@shared/hooks/useRouter';
import { initializeSessionManager, getSessionManager } from '@utils/sessionManager';
import { i18n } from '@/configs/i18n';
import { ENABLE_IDLE_TIMEOUT } from '@/configs/sessionConfig';

/**
 * Global logout handler that automatically manages user sessions
 * and handles browser close scenarios using the SessionManager
 */
export const useGlobalLogoutHandler = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const sessionManagerRef = useRef<any>(null);

  // Initialize session manager when user is authenticated
  useEffect(() => {
    if (session && typeof window !== 'undefined') {
      // Initialize session manager with custom config
      // TEMPORARILY DISABLE auto-logout on browser close to fix F5 issue
      // No onBeforeLogout callback needed: SessionManager.triggerLogout() already calls
      // /api/logout below, which now invalidates the backend session itself, server-side
      // (the real backend token is never available in the browser — see src/auth.ts).
      sessionManagerRef.current = initializeSessionManager({
        autoLogoutOnBrowserClose: false, // Disabled to prevent F5 logout issues
        sessionTimeoutMinutes: 30,
        checkIntervalSeconds: 60,
        browserCloseThresholdMs: 60000, // Increase threshold to 60 seconds
        idleTimeoutEnabled: ENABLE_IDLE_TIMEOUT, // NEXT_PUBLIC_ENABLE_IDLE_TIMEOUT, default true
      });

    }

    return () => {
      // Cleanup session manager when component unmounts
      if (sessionManagerRef.current) {
        sessionManagerRef.current.destroy();
        sessionManagerRef.current = null;
      }
    };
  }, [session]);

  // Auto-redirect to login if no session
  useEffect(() => {
    if (status === 'loading') return; // Still loading
    
    if (!session && typeof window !== 'undefined') {
      const currentPath = window.location.pathname;
      const isLoginPage = currentPath.includes('/login');
      const isLogoutPage = currentPath.includes('/logout');
      const isAuthPage = currentPath.includes('/auth');
      
      // Only redirect if not already on auth-related pages
      if (!isLoginPage && !isLogoutPage && !isAuthPage) {
        
        // Extract locale from current path or default to configured locale
        const localeMatch = currentPath.match(/^\/([a-z]{2})/);
        const locale = localeMatch ? localeMatch[1] : i18n.defaultLocale;
        
        // Use window.location for immediate redirect to locale-specific login
        window.location.href = `/${locale}/login`;
      }
    }
  }, [session, status]);

  // Handle session changes (logout)
  useEffect(() => {
    if (status === 'unauthenticated' && typeof window !== 'undefined') {
      const currentPath = window.location.pathname;
      const isLoginPage = currentPath.includes('/login');
      const isLogoutPage = currentPath.includes('/logout');
      
      if (!isLoginPage && !isLogoutPage) {
        
        // Extract locale from current path or default to configured locale
        const localeMatch = currentPath.match(/^\/([a-z]{2})/);
        const locale = localeMatch ? localeMatch[1] : i18n.defaultLocale;
        
        window.location.href = `/${locale}/login`;
      }
    }
  }, [status]);

  // Provide a manual logout function
  const manualLogout = async (reason: string = 'manual') => {
    try {
      
      // Use session manager for logout if available
      const sessionManager = getSessionManager();
      if (sessionManager) {
        await sessionManager.triggerLogout(reason);
      } else {
        // Fallback logout: session manager not initialized yet. /api/logout invalidates the
        // backend session server-side (resolving the token itself from the session cookie)
        // before the NextAuth cookie below is cleared.
        await fetch('/api/logout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reason })
        }).catch(err => {});
        await signOut({ redirect: false });

        // Extract locale from current path or default to configured locale
        const currentPath = window.location.pathname;
        const localeMatch = currentPath.match(/^\/([a-z]{2})/);
        const locale = localeMatch ? localeMatch[1] : i18n.defaultLocale;
        
        window.location.href = `/${locale}/login`;
      }
    } catch {
      
      // Extract locale for error fallback
      const currentPath = window.location.pathname;
      const localeMatch = currentPath.match(/^\/([a-z]{2})/);
      const locale = localeMatch ? localeMatch[1] : i18n.defaultLocale;
      
      window.location.href = `/${locale}/login`;
    }
  };

  return { manualLogout };
};

export default useGlobalLogoutHandler;

