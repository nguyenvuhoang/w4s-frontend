import type { HubConnection } from '@microsoft/signalr';

export type UserLogoutPayload = {
    userCode: string;
    userName: string;
    deviceId?: string;
};

export const registerLogoutEvents = (
    connection: HubConnection,
    onUserLogout: (data: UserLogoutPayload) => void
) => {
    const handler = (data: any) => {
        const payload: UserLogoutPayload = {
            userCode: data.userCode ?? data.UserCode ?? '',
            userName: data.userName ?? data.UserName ?? '',
            deviceId: data.deviceId ?? data.DeviceId
        };

        onUserLogout(payload);
    };

    connection.on('UserLogOut', handler);

    return () => {
        connection.off('UserLogOut', handler);
    };
};
