'use client'

import { useGlobalLogoutHandler } from '@/hooks/useGlobalLogoutHandler';

/**
 * Client-side session handler component that manages:
 * - Browser close auto-logout
 * - Session validation
 * - Auto-redirect to login page
 */
const ClientSessionHandler = () => {
  useGlobalLogoutHandler();
  
  // This component doesn't render anything, it just manages session logic
  return null;
};

export default ClientSessionHandler;
