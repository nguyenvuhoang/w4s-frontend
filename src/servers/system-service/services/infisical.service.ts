import http from "../../lib/http";
import {
    InfisicalEnvironmentsResponse,
    InfisicalLoginResponse,
    InfisicalSecretsResponse,
    InfisicalWorkspacesResponse
} from "@/shared/types/infisicalTypes";

export const infisicalService = {
    loginProxy: () =>
        http.post<InfisicalLoginResponse>('/api/infisical-auth', {}, {
            baseUrl: '',
        }),

    getWorkspacesProxy: (token: string) =>
        http.get<InfisicalWorkspacesResponse>('/api/infisical/workspaces', {
            baseUrl: '',
            headers: { Authorization: `Bearer ${token}` }
        }),

    getEnvironmentsProxy: (token: string, workspaceId: string) =>
        http.get<InfisicalEnvironmentsResponse>(`/api/infisical/environments?workspaceId=${workspaceId}`, {
            baseUrl: '',
            headers: { Authorization: `Bearer ${token}` }
        }),

    getSecretsProxy: (token: string, workspaceId: string, environment: string) =>
        http.get<InfisicalSecretsResponse>(`/api/infisical/secrets?workspaceId=${workspaceId}&environment=${environment}`, {
            baseUrl: '',
            headers: { Authorization: `Bearer ${token}` }
        }),
};
