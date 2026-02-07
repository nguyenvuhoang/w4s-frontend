import { infisicalService } from '@/servers/system-service/services/infisical.service';
import {
    InfisicalEnvironment,
    InfisicalSecret,
    InfisicalWorkspace
} from '@/shared/types/infisicalTypes';
import SwalAlert from '@/shared/utils/SwalAlert';
import { useCallback, useEffect, useState } from 'react';

export function useInfisicalHandler(initialToken?: string) {
    const [accessToken, setAccessToken] = useState<string | null>(initialToken || null);
    const [workspaces, setWorkspaces] = useState<InfisicalWorkspace[]>([]);
    const [selectedWorkspace, setSelectedWorkspace] = useState<InfisicalWorkspace | null>(null);
    const [environments, setEnvironments] = useState<InfisicalEnvironment[]>([]);
    const [secrets, setSecrets] = useState<Record<string, InfisicalSecret[]>>({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const login = useCallback(async () => {
        if (accessToken) return accessToken;

        setLoading(true);
        setError(null);
        try {
            const res = await infisicalService.loginProxy();

            console.log('Infisical login response:', res);

            if (res.status === 200 && res.payload.accessToken) {
                setAccessToken(res.payload.accessToken);
                return res.payload.accessToken;
            } else {
                const errMsg = 'Failed to login to Infisical';
                setError(errMsg);
                SwalAlert('error', errMsg, 'center');
                return null;
            }
        } catch (err) {
            console.error('Infisical login error:', err);
            setError('An error occurred during Infisical login');
            return null;
        } finally {
            setLoading(false);
        }
    }, [accessToken]);

    const fetchWorkspaces = useCallback(async (token: string) => {
        try {
            const res = await infisicalService.getWorkspacesProxy(token);
            if (res.status === 200 && res.payload.workspaces) {
                setWorkspaces(res.payload.workspaces);
                if (res.payload.workspaces.length > 0) {
                    setSelectedWorkspace(res.payload.workspaces[0]);
                }
            }
        } catch (err) {
            console.error('Fetch workspaces error:', err);
        }
    }, []);

    const fetchEnvironments = useCallback(async (token: string, workspaceId: string) => {
        try {
            const res = await infisicalService.getEnvironmentsProxy(token, workspaceId);
            if (res.status === 200 && res.payload.environments) {
                setEnvironments(res.payload.environments);
                return res.payload.environments;
            }
        } catch (err) {
            console.error('Fetch environments error:', err);
        }
        return [];
    }, []);

    const fetchSecrets = useCallback(async (token: string, workspaceId: string, envSlug: string) => {
        try {
            const res = await infisicalService.getSecretsProxy(token, workspaceId, envSlug);
            if (res.status === 200 && res.payload.secrets) {
                setSecrets(prev => ({
                    ...prev,
                    [envSlug]: res.payload.secrets
                }));
            }
        } catch (err) {
            console.error(`Fetch secrets error for ${envSlug}:`, err);
        }
    }, []);

    useEffect(() => {
        const init = async () => {
            let token = accessToken;
            if (!token) {
                token = await login();
            }
            if (token) {
                await fetchWorkspaces(token);
            }
        };
        init();
    }, [login, fetchWorkspaces, accessToken]);

    useEffect(() => {
        const fetchEverything = async () => {
            if (accessToken && selectedWorkspace) {
                const envs = await fetchEnvironments(accessToken, selectedWorkspace.id);
                for (const env of envs) {
                    await fetchSecrets(accessToken, selectedWorkspace.id, env.slug);
                }
            }
        };
        fetchEverything();
    }, [accessToken, selectedWorkspace, fetchEnvironments, fetchSecrets]);

    return {
        accessToken,
        workspaces,
        selectedWorkspace,
        setSelectedWorkspace,
        environments,
        secrets,
        loading,
        error,
        refresh: login
    };
}
