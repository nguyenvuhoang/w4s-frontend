'use client';

import * as signalR from '@microsoft/signalr';
import { redirectToMaintenance } from '@utils/maintenance';

let connection: signalR.HubConnection | null = null;
let connectionPromise: Promise<signalR.HubConnection> | null = null;
let isInitialized = false;
let maintenanceDetected = false;

const isServer = () => typeof window === 'undefined';

/**
 * Negotiate/start failures caused by a 502 (Cloudflare Bad Gateway) surface from
 * @microsoft/signalr as nested "Failed to complete negotiation..." / "Failed to
 * start the connection..." errors whose message still carries the status code.
 */
const isBadGatewaySignalRError = (error: unknown): boolean => {
  const message = error instanceof Error ? error.message : String(error ?? '');

  return /\b502\b/.test(message) || /bad gateway/i.test(message);
};

const handleMaintenanceDetected = () => {
  maintenanceDetected = true;
  redirectToMaintenance();
};

/**
 * Get or create SignalR connection (without token)
 */
export const getSignalRConnection = async (hubUrl: string): Promise<signalR.HubConnection> => {
    if (isServer()) {
        throw new Error('SignalR connection cannot be created on server side');
    }

    // System is under maintenance (502 already detected): stop retrying/negotiating.
    if (maintenanceDetected) {
        throw new Error('SYSTEM_MAINTENANCE');
    }

    // If already connecting, wait for that promise
    if (connectionPromise) {
        return connectionPromise;
    }

    // If already connected and in Connected state, return it
    if (connection && connection.state === signalR.HubConnectionState.Connected) {
        return connection;
    }

    // Reset if disconnected
    if (connection && connection.state === signalR.HubConnectionState.Disconnected) {
        connection = null;
        isInitialized = false;
    }

    connectionPromise = (async () => {
        try {
            connection = new signalR.HubConnectionBuilder()
                .withUrl(hubUrl, {
                    skipNegotiation: false,
                    withCredentials: false,
                    transport:
                        signalR.HttpTransportType.WebSockets |
                        signalR.HttpTransportType.ServerSentEvents |
                        signalR.HttpTransportType.LongPolling
                })

                .configureLogging(signalR.LogLevel.Warning)
                .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
                .build();

            // Handle connection state changes
            connection.onclose((error) => {
                connection = null;
                connectionPromise = null;
                isInitialized = false;

                if (isBadGatewaySignalRError(error)) {
                    handleMaintenanceDetected();
                }
            });

            connection.onreconnecting((error) => {
            });

            connection.onreconnected((connectionId) => {
                // Re-init after reconnect if we have stored token
                isInitialized = false;
            });

            await connection.start();

            return connection;
        } catch (error) {
            connection = null;
            connectionPromise = null;

            if (isBadGatewaySignalRError(error)) {
                handleMaintenanceDetected();
                throw new Error('SYSTEM_MAINTENANCE');
            }

            throw error;
        }
    })();

    return connectionPromise;
};

/**
 * Register the live connection with the hub via its `Init` RPC. `identifier` is a non-secret,
 * stable per-user value (session.user.usercode) — the hub's own UserLogOut push already keys off
 * the same usercode (src/services/signalr/events/logout.ts), and this connection is otherwise
 * fully unauthenticated (no accessTokenFactory/Authorization header, see getSignalRConnection
 * above), so `Init` was never a place to put the real backend JWT. Kept the exported name
 * (`initSignalRWithToken`) to avoid a wider rename; only what gets passed to it changed.
 */
export const initSignalRWithToken = async (identifier: string): Promise<void> => {
    if (!connection || connection.state !== signalR.HubConnectionState.Connected) {
        throw new Error('SignalR connection not established. Call getSignalRConnection first.');
    }

    if (isInitialized) {
        return;
    }

    try {
        const result = await connection.invoke('Init', identifier);
        isInitialized = true;
    } catch (error) {
        throw error;
    }
};

/**
 * Check if SignalR is initialized with token
 */
export const isSignalRInitialized = () => isInitialized;

export const stopSignalRConnection = async () => {
    if (connection) {
        await connection.stop();
        connection = null;
        connectionPromise = null;
        isInitialized = false;
    }
};
