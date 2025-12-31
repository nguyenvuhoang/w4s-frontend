/**
 * Session Management Utilities
 * Handles browser close detection and automatic logout
 */

export interface SessionConfig {
  autoLogoutOnBrowserClose: boolean;
  sessionTimeoutMinutes: number;
  checkIntervalSeconds: number;
  browserCloseThresholdMs: number;
}

export const defaultSessionConfig: SessionConfig = {
  autoLogoutOnBrowserClose: true,
  sessionTimeoutMinutes: 30,
  checkIntervalSeconds: 60,
  browserCloseThresholdMs: 30000, // 30 seconds
};

export class SessionManager {
  private config: SessionConfig;
  private checkInterval: NodeJS.Timeout | null = null;
  private lastActivityTime: number = Date.now();

  constructor(config: Partial<SessionConfig> = {}) {
    this.config = { ...defaultSessionConfig, ...config };
    this.init();
  }

  private init() {
    if (typeof window === 'undefined') return;

    // Set up activity tracking
    this.trackUserActivity();
    
    // Set up periodic session checks
    this.startSessionCheck();
    
    // Handle browser close/refresh
    this.setupBrowserCloseDetection();
  }

  private trackUserActivity() {
    const updateActivity = () => {
      this.lastActivityTime = Date.now();
      localStorage.setItem('lastActivity', this.lastActivityTime.toString());
    };

    // Track various user activities
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    events.forEach(event => {
      document.addEventListener(event, updateActivity, { passive: true });
    });

    // Initial activity
    updateActivity();
  }

  private startSessionCheck() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }

    this.checkInterval = setInterval(() => {
      this.checkSessionValidity();
    }, this.config.checkIntervalSeconds * 1000);
  }

  private setupBrowserCloseDetection() {
    const handleBeforeUnload = () => {
      // For page refresh detection, we'll rely on the rapid reload pattern
      // rather than trying to detect keyboard events in beforeunload
      sessionStorage.setItem('browserClosing', 'true');
      sessionStorage.setItem('closingTimestamp', Date.now().toString());
    };

    const handlePageHide = (event: PageTransitionEvent) => {
      // persisted indicates if the page will be cached (back/forward navigation)
      if (!event.persisted) {
        sessionStorage.setItem('pageHidden', 'true');
        sessionStorage.setItem('hideTimestamp', Date.now().toString());
      }
    };

    const handlePageShow = (event: PageTransitionEvent) => {
      // persisted indicates page was loaded from cache (back/forward navigation)
      if (event.persisted) {
        // This is back/forward navigation, clear any close detection flags
        this.clearCloseDetectionFlags();
      } else {
        // Check if we returned from a browser close scenario
        this.checkForBrowserCloseRecovery();
      }
    };

    // Use visibilitychange for better detection of actual page navigation vs browser close
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Page became visible again - likely a refresh or returning from another tab
        sessionStorage.setItem('pageVisibilityReturned', Date.now().toString());
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('pagehide', handlePageHide);
    window.addEventListener('pageshow', handlePageShow);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Check on initial load
    this.checkForBrowserCloseRecovery();
  }

  private clearCloseDetectionFlags() {
    sessionStorage.removeItem('browserClosing');
    sessionStorage.removeItem('pageHidden');
    sessionStorage.removeItem('closingTimestamp');
    sessionStorage.removeItem('hideTimestamp');
    sessionStorage.removeItem('pageVisibilityReturned');
  }

  private checkForBrowserCloseRecovery() {
    const browserClosing = sessionStorage.getItem('browserClosing');
    const pageHidden = sessionStorage.getItem('pageHidden');
    const closingTimestamp = sessionStorage.getItem('closingTimestamp');
    const hideTimestamp = sessionStorage.getItem('hideTimestamp');
    const pageVisibilityReturned = sessionStorage.getItem('pageVisibilityReturned');

    if (browserClosing === 'true' || pageHidden === 'true') {
      const timestamp = closingTimestamp || hideTimestamp;
      const timeDiff = timestamp ? Date.now() - parseInt(timestamp) : 0;
      const visibilityReturnTime = pageVisibilityReturned ? parseInt(pageVisibilityReturned) : 0;

      // Enhanced browser close detection:
      // 1. Only trigger if auto-logout is enabled
      // 2. Require reasonable threshold (between 5 seconds and configured max)
      // 3. If page visibility returned quickly, it's likely a refresh
      // 4. Very quick returns (< 2 seconds) are definitely refreshes
      const isQuickRefresh = timeDiff < 2000;
      const isVisibilityQuickReturn = visibilityReturnTime > 0 && (visibilityReturnTime - parseInt(timestamp || '0')) < 3000;
      const isWithinLogoutThreshold = timeDiff > 5000 && timeDiff < this.config.browserCloseThresholdMs;
      
      // Don't logout for quick refreshes or quick visibility returns
      if (isQuickRefresh || isVisibilityQuickReturn) {
        console.log('[SessionManager] Quick page refresh detected (F5), maintaining session');
      } else if (this.config.autoLogoutOnBrowserClose && isWithinLogoutThreshold) {
        console.log('[SessionManager] Actual browser close detected after extended time, triggering logout...');
        this.triggerLogout('browser_close_recovery');
      } else {
        console.log('[SessionManager] Page navigation or quick reload detected, maintaining session');
      }

      // Always clean up flags after processing
      this.clearCloseDetectionFlags();
    }
  }

  private checkSessionValidity() {
    const lastActivity = localStorage.getItem('lastActivity');
    if (!lastActivity) return;

    const timeSinceActivity = Date.now() - parseInt(lastActivity);
    const sessionTimeoutMs = this.config.sessionTimeoutMinutes * 60 * 1000;

    if (timeSinceActivity > sessionTimeoutMs) {
      console.log('[SessionManager] Session timeout detected');
      this.triggerLogout('session_timeout');
    }
  }

  private sendLogoutBeacon(reason: string) {
    try {
      const data = JSON.stringify({ 
        force: true, 
        reason,
        timestamp: Date.now()
      });

      // Use sendBeacon for reliable delivery during page unload
      if (navigator.sendBeacon) {
        navigator.sendBeacon('/api/logout', data);
      } else {
        // Fallback for older browsers
        fetch('/api/logout', {
          method: 'POST',
          body: data,
          headers: { 'Content-Type': 'application/json' },
          keepalive: true
        }).catch(console.error);
      }
    } catch (error) {
      console.error('[SessionManager] Failed to send logout beacon:', error);
    }
  }

  public async triggerLogout(reason: string) {
    try {
      // Clear local storage
      localStorage.removeItem('token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('lastActivity');

      // Call logout API
      await fetch('/api/logout', {
        method: 'POST',
        body: JSON.stringify({ force: true, reason }),
        headers: { 'Content-Type': 'application/json' }
      });

      // Extract locale from current path or default to 'en'
      const currentPath = window.location.pathname;
      const localeMatch = currentPath.match(/^\/([a-z]{2})/);
      const locale = localeMatch ? localeMatch[1] : 'en';

      // Redirect to locale-specific login
      window.location.href = `/${locale}/login`;
    } catch (error) {
      console.error('[SessionManager] Logout failed:', error);
      
      // Force redirect even if API call fails
      const currentPath = window.location.pathname;
      const localeMatch = currentPath.match(/^\/([a-z]{2})/);
      const locale = localeMatch ? localeMatch[1] : 'en';
      
      window.location.href = `/${locale}/login`;
    }
  }

  public destroy() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  public updateActivity() {
    this.lastActivityTime = Date.now();
    localStorage.setItem('lastActivity', this.lastActivityTime.toString());
  }
}

// Global session manager instance
let sessionManager: SessionManager | null = null;

export const initializeSessionManager = (config?: Partial<SessionConfig>) => {
  if (typeof window === 'undefined') return null;
  
  if (sessionManager) {
    sessionManager.destroy();
  }
  
  sessionManager = new SessionManager(config);
  return sessionManager;
};

export const getSessionManager = () => sessionManager;

export default SessionManager;
