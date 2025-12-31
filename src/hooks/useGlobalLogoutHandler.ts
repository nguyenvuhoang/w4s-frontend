'use client'

import { useEffect, useRef } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { initializeSessionManager, getSessionManager } from '@/utils/sessionManager';

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
      sessionManagerRef.current = initializeSessionManager({
        autoLogoutOnBrowserClose: false, // Disabled to prevent F5 logout issues
        sessionTimeoutMinutes: 30,
        checkIntervalSeconds: 60,
        browserCloseThresholdMs: 60000 // Increase threshold to 60 seconds
      });

      console.log('[GlobalLogoutHandler] Session manager initialized');
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
        console.log('[GlobalLogoutHandler] No session found, redirecting to login...');
        
        // Extract locale from current path or default to 'en'
        const localeMatch = currentPath.match(/^\/([a-z]{2})/);
        const locale = localeMatch ? localeMatch[1] : 'en';
        
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
        console.log('[GlobalLogoutHandler] Session became unauthenticated, redirecting...');
        
        // Extract locale from current path or default to 'en'
        const localeMatch = currentPath.match(/^\/([a-z]{2})/);
        const locale = localeMatch ? localeMatch[1] : 'en';
        
        window.location.href = `/${locale}/login`;
      }
    }
  }, [status]);

  // Provide a manual logout function
  const manualLogout = async (reason: string = 'manual') => {
    try {
      console.log(`[GlobalLogoutHandler] Manual logout triggered: ${reason}`);
      
      // Use session manager for logout if available
      const sessionManager = getSessionManager();
      if (sessionManager) {
        await sessionManager.triggerLogout(reason);
      } else {
        // Fallback logout
        await signOut({ redirect: false });
        
        // Extract locale from current path or default to 'en'
        const currentPath = window.location.pathname;
        const localeMatch = currentPath.match(/^\/([a-z]{2})/);
        const locale = localeMatch ? localeMatch[1] : 'en';
        
        window.location.href = `/${locale}/login`;
      }
    } catch (error) {
      console.error('[GlobalLogoutHandler] Manual logout failed:', error);
      
      // Extract locale for error fallback
      const currentPath = window.location.pathname;
      const localeMatch = currentPath.match(/^\/([a-z]{2})/);
      const locale = localeMatch ? localeMatch[1] : 'en';
      
      window.location.href = `/${locale}/login`;
    }
  };

  return { manualLogout };
};

export default useGlobalLogoutHandler;
