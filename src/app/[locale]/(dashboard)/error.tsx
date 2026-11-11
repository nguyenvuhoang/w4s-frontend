'use client';

import { useEffect } from 'react';
import { Box, CircularProgress, Stack, Typography, Button, Paper } from '@mui/material';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

import { isSessionInvalidMessage } from '@/shared/utils/isTokenError';
import { triggerSessionLogoutRedirect } from '@/shared/utils/triggerSessionLogout';
import { navigationLifecycle } from '@/shared/components/progressbar/navigationLifecycle';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    // A committed route error is a terminal navigation signal, including ordinary Next links.
    useEffect(() => { navigationLifecycle.dispose(); }, [error]);

    // Any Server Component under this (dashboard) route group that throws an uncaught error
    // (e.g. staffService/userRoleService's assertWorkflowSuccess on a session-invalid workflow
    // response) lands here — this is Next.js's route-segment error boundary, a completely
    // different rendering path from <ErrorPage>/<PageError>, which is why it needs the exact same
    // session-invalid check as those: without it, a session-expired error just shows a generic
    // "Try Again" screen and never redirects to /logout (see isTokenError.ts's shared detector).
    const redirectingToLogout = isSessionInvalidMessage(error.message);

    const router = useRouter();

    useEffect(() => {
    }, [error]);

    useEffect(() => {
        if (!redirectingToLogout) return;

        triggerSessionLogoutRedirect(router.replace);
    }, [redirectingToLogout, router.replace]);

    if (redirectingToLogout) {
        return (
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '100vh',
                    backgroundColor: '#f5f5f5',
                    padding: 2
                }}
            >
                <Stack spacing={2} alignItems="center">
                    <CircularProgress size={32} />
                    <Typography variant="body2" color="textSecondary">
                        Your session has expired. Redirecting to login...
                    </Typography>
                </Stack>
            </Box>
        );
    }

    return (
        <Box
            sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh',
                backgroundColor: '#f5f5f5',
                padding: 2,
            }}
        >
            <Paper
                elevation={3}
                sx={{
                    padding: 4,
                    textAlign: 'center',
                    borderRadius: 3,
                    maxWidth: 800,
                    backgroundColor: '#fff',
                }}
            >
                <Image src="/images/illustrations/error.svg" width={400} height={300} alt="Error"  priority/>

                <Typography variant="h5" sx={{ fontWeight: 'bold', mt: 2, color: '#d32f2f' }}>
                    Oops! Something went wrong.
                </Typography>

                <Typography variant="body1" color="textSecondary" sx={{ mt: 1 }}>
                    We encountered an unexpected issue. Please try again or contact support if the problem persists.
                </Typography>

                {/* Hiển thị nội dung chi tiết của lỗi */}
                {error.message && (
                    <Typography
                        variant="body2"
                        sx={{
                            mt: 2,
                            p: 2,
                            backgroundColor: '#ffebee',
                            color: '#d32f2f',
                            borderRadius: 2,
                            fontSize: '14px',
                            fontFamily: 'monospace',
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-word',
                        }}
                    >
                        🔍 Error Details: {error.message}
                    </Typography>
                )}

                {/* Hiển thị digest nếu có */}
                {error.digest && (
                    <Typography
                        variant="body2"
                        sx={{
                            mt: 1,
                            fontSize: '12px',
                            color: '#757575',
                            fontStyle: 'italic',
                        }}
                    >
                        Digest: {error.digest}
                    </Typography>
                )}

                <Button
                    variant="contained"
                    color="primary"
                    sx={{ mt: 3, borderRadius: 2, paddingX: 3 }}
                    onClick={() => reset()}
                >
                    Try Again
                </Button>
            </Paper>
        </Box>
    );
}
