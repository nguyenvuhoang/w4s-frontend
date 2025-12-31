'use client';

import { useEffect, useState, useRef } from 'react';
import type { HubConnection } from '@microsoft/signalr';
import { getSignalRConnection, initSignalRWithToken } from '@/services/signalr/connection';

/**
 * Hook to get SignalR connection and initialize with token
 * @param hubUrl - SignalR hub URL
 * @param token - Optional token to call Init method after connection
 */
export const useSignalRConnection = (hubUrl: string, token?: string) => {
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
          console.log('SignalR: Connection established, ready to register handlers');
        }
      } catch (err) {
        console.error('Error connecting to SignalR:', err);
      }
    };

    connect();

    return () => {
      isMounted = false;
    };
  }, [hubUrl]);

  // Step 2: Call Init AFTER connection is set and handlers can be registered
  useEffect(() => {
    if (!connection || !token || initCalledRef.current) return;

    const doInit = async () => {
      try {
        console.log('SignalR: Calling Init after handlers are ready...');
        await initSignalRWithToken(token);
        initCalledRef.current = true;
        setIsReady(true);
      } catch (err) {
        console.error('Error initializing SignalR:', err);
      }
    };

    // Small delay to ensure handlers are registered first
    const timer = setTimeout(doInit, 100);
    return () => clearTimeout(timer);
  }, [connection, token]);

  return { connection, isReady };
};
