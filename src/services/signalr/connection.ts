'use client';

import * as signalR from '@microsoft/signalr';

let connection: signalR.HubConnection | null = null;
let connectionPromise: Promise<signalR.HubConnection> | null = null;
let isInitialized = false;

const isServer = () => typeof window === 'undefined';

/**
 * Get or create SignalR connection (without token)
 */
export const getSignalRConnection = async (hubUrl: string): Promise<signalR.HubConnection> => {
    if (isServer()) {
        throw new Error('SignalR connection cannot be created on server side');
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
            console.log("SignalR: Starting connection to " + hubUrl);
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
                console.warn('SignalR connection closed:', error?.message || 'No error');
                connection = null;
                connectionPromise = null;
                isInitialized = false;
            });

            connection.onreconnecting((error) => {
                console.warn('SignalR reconnecting:', error?.message || 'No error');
            });

            connection.onreconnected((connectionId) => {
                console.log('SignalR reconnected with ID:', connectionId);
                // Re-init after reconnect if we have stored token
                isInitialized = false;
            });

            await connection.start();
            console.log('SignalR connected successfully');

            return connection;
        } catch (error) {
            console.error('SignalR connection failed:', error);
            connection = null;
            connectionPromise = null;
            throw error;
        }
    })();

    return connectionPromise;
};

/**
 * Initialize SignalR with token - call Init method on server
 */
export const initSignalRWithToken = async (token: string): Promise<void> => {
    if (!connection || connection.state !== signalR.HubConnectionState.Connected) {
        throw new Error('SignalR connection not established. Call getSignalRConnection first.');
    }

    if (isInitialized) {
        console.log('SignalR: Already initialized with token');
        return;
    }

    try {
        console.log('SignalR: Calling Init with token...', token?.substring(0, 20) + '...');
        const result = await connection.invoke('Init', token);
        console.log('SignalR: Init response:', result);
        isInitialized = true;
        console.log('SignalR: Init successful - now listening for events');
    } catch (error) {
        console.error('SignalR: Init failed:', error);
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
        console.log('SignalR stopped');
        connection = null;
        connectionPromise = null;
        isInitialized = false;
    }
};
