import { infisicalServerService } from '@/servers/system-service/services/infisical.server';
import { env } from '@/env.mjs';
import EnvironmentsView from '@/components/api-manager/environments/EnvironmentsView';
import { Alert, Box } from '@mui/material';
import logger from '@lib/logger';

export default async function EnvironmentsPage() {
    let accessToken = '';
    let error = '';

    try {
        const res = await infisicalServerService.login({
            clientId: env.INFISICAL_CLIENT_ID || '',
            clientSecret: env.INFISICAL_CLIENT_SECRET || '',
        });

        if (res.status === 200 && res.payload.accessToken) {
            accessToken = res.payload.accessToken;
        } else {
            logger.error('[api-manager/environments] Infisical login did not return an access token', { status: res.status });
            error = 'Failed to authenticate with Infisical on the server.';
        }
    } catch {
        logger.error('[api-manager/environments] Infisical server-side login failed');
        error = 'An unexpected error occurred during server-side authentication.';
    }

    if (error) {
        return (
            <Box sx={{ p: 3 }}>
                <Alert severity="error">{error}</Alert>
            </Box>
        );
    }

    return <EnvironmentsView initialToken={accessToken} />;
}
