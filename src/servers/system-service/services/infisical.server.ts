import { env } from '@/env.mjs';
import http from "../../lib/http";
import {
    InfisicalEnvironmentsResponse,
    InfisicalLoginRequest,
    InfisicalLoginResponse,
    InfisicalSecretsResponse,
    InfisicalWorkspacesResponse
} from "@/shared/types/infisicalTypes";

const getBaseUrl = () => env.INFISICAL_URL || 'http://192.168.1.103:8080/api/v1';

export const infisicalServerService = {
    login: (data: InfisicalLoginRequest) =>
        http.post<InfisicalLoginResponse>('/auth/universal-auth/login', data, {
            baseUrl: getBaseUrl(),
        }),

    getWorkspaces: (token: string) =>
        http.get<InfisicalWorkspacesResponse>('/workspace', {
            baseUrl: getBaseUrl(),
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }),

    getEnvironments: (token: string, workspaceId: string) =>
        http.get<InfisicalEnvironmentsResponse>(`/workspace/${workspaceId}/environments`, {
            baseUrl: getBaseUrl(),
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }),

    getSecrets: (token: string, workspaceId: string, environmentSlug: string) =>
        http.get<InfisicalSecretsResponse>(`/secret`, {
            baseUrl: getBaseUrl(),
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }),
};

export const getSecretsWithParams = (token: string, workspaceId: string, environment: string) =>
    http.get<InfisicalSecretsResponse>(`/secret?workspaceId=${workspaceId}&environment=${environment}`, {
        baseUrl: getBaseUrl(),
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
