'use client'

import { useEffect } from 'react';
import { signOut } from 'next-auth/react';

interface UseBeforeUnloadOptions {
  enabled?: boolean;
  onBeforeUnload?: () => void;
  shouldLogout?: boolean;
}

/**
 * Custom hook to handle browser close/refresh events and automatically logout user
 * @param options Configuration options for the hook
 */
export const useBeforeUnload = (options: UseBeforeUnloadOptions = {}) => {
  const { 
    enabled = true, 
    onBeforeUnload, 
    shouldLogout = true 
  } = options;

  useEffect(() => {
    if (!enabled) return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      // Set a flag in sessionStorage to detect browser close
      sessionStorage.setItem('browserClosed', 'true');
      sessionStorage.setItem('closeTimestamp', Date.now().toString());
      
      // Call custom callback if provided
      if (onBeforeUnload) {
        onBeforeUnload();
      }

      // Optional: Show confirmation dialog (uncomment if needed)
      // event.preventDefault();
      // event.returnValue = '';
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        // Page is being hidden (tab closed, browser minimized, etc.)
        sessionStorage.setItem('pageHidden', 'true');
        sessionStorage.setItem('hideTimestamp', Date.now().toString());
      }
    };

    const handlePageLoad = async () => {
      const browserClosed = sessionStorage.getItem('browserClosed');
      const pageHidden = sessionStorage.getItem('pageHidden');
      const closeTimestamp = sessionStorage.getItem('closeTimestamp');
      const hideTimestamp = sessionStorage.getItem('hideTimestamp');
      
      // Check if browser was closed or tab was closed
      if (browserClosed === 'true' || pageHidden === 'true') {
        const timestamp = closeTimestamp || hideTimestamp;
        const timeDiff = timestamp ? Date.now() - parseInt(timestamp) : 0;
        
        // If the time difference is small, it means browser was likely closed and reopened
        // You can adjust this threshold based on your requirements
        if (timeDiff < 10000 && shouldLogout) { // 10 seconds threshold
          try {
            await signOut({ 
              callbackUrl: window.location.origin + '/login',
              redirect: false 
            });
            window.location.href = '/login';
          } catch (error) {
            console.error('Auto-logout failed:', error);
            // Force redirect to login even if signOut fails
            window.location.href = '/login';
          }
        }
        
        // Clean up flags
        sessionStorage.removeItem('browserClosed');
        sessionStorage.removeItem('pageHidden');
        sessionStorage.removeItem('closeTimestamp');
        sessionStorage.removeItem('hideTimestamp');
      }
    };

    // Add event listeners
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Check on component mount
    handlePageLoad();

    // Cleanup
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enabled, onBeforeUnload, shouldLogout]);
};

export default useBeforeUnload;
