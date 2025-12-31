import type { HubConnection } from '@microsoft/signalr';

type LoginHandlerOptions = {
    onInit?: (arg: any) => void;
    onLoginResult?: (data: { token: string; status: string }) => void;
};

export const registerLoginEvents = (connection: HubConnection, opts: LoginHandlerOptions) => {
    const { onInit, onLoginResult } = opts;

    if (onInit) {
        connection.on('init', (...args) => {
            onInit(args[0]);
        });
    }

    if (onLoginResult) {
        connection.on('IB_LOGIN', (data) => {
            onLoginResult(data);
        });
    }

    return () => {
        if (onInit) connection.off('init');
        if (onLoginResult) connection.off('IB_LOGIN');
    };
};

export const sendInitToken = async (connection: HubConnection, token: string) => {
    await connection.invoke('init', token);
    console.log(`Token ${token} registered successfully`);
};
