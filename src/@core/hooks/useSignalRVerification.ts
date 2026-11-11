'use client';

import { useEffect, useState, useRef } from 'react';
import type { HubConnection } from '@microsoft/signalr';
import { getSignalRConnection, initSignalRWithToken } from '@/services/signalr/connection';

/**
 * Hook to get SignalR connection and register it against a user via the hub's `Init` RPC.
 * @param hubUrl - SignalR hub URL
 * @param identifier - Non-secret, stable user identifier (session.user.usercode) used only so the
 * hub can target push events (e.g. UserLogOut) at this connection — the hub's own UserLogOut
 * payload already keys off the same usercode (see src/services/signalr/events/logout.ts), so this
 * was never meant to be a credential. The real backend JWT must never reach the browser (see
 * src/auth.ts) and is intentionally not used here even though this param used to be called `token`.
 */
export const useSignalRConnection = (hubUrl: string, identifier?: string) => {
  const [connection, setConnection] = useState<HubConnection | null>(null);
  const [isReady, setIsReady] = useState(false);
  const initCalledRef = useRef(false);

  // Step 1: Connect to SignalR first
  useEffect(() => {
    let isMounted = true;

    const connect = async () => {
      try {
        const conn = await getSignalRConnection(hubUrl);
        
        if (isMounted) {
          setConnection(conn);
        }
      } catch {}
    };

    connect();

    return () => {
      isMounted = false;
    };
  }, [hubUrl]);

  // Step 2: Call Init AFTER connection is set and handlers can be registered
  useEffect(() => {
    if (!connection || !identifier || initCalledRef.current) return;

    const doInit = async () => {
      try {
        await initSignalRWithToken(identifier);
        initCalledRef.current = true;
        setIsReady(true);
      } catch {}
    };

    // Small delay to ensure handlers are registered first
    const timer = setTimeout(doInit, 100);
    return () => clearTimeout(timer);
  }, [connection, identifier]);

  return { connection, isReady };
};
