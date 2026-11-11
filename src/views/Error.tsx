'use client';

import { useEffect } from 'react';
import { Box, CircularProgress, Stack, Typography, Button, Paper } from '@mui/material';
import Image from 'next/image';
// Deliberately next/navigation's stock useRouter, not the app's custom progress-bar-driven one:
// this component is a generic error fallback that (dashboard)/layout.tsx renders directly for
// several server-side error branches (missing/invalid systemData) that occur BEFORE <Providers>
// (and therefore ProgressProvider) ever mounts — calling the custom hook there throws
// "useProgress must be used within a ProgressProvider" and crashes the error page itself. An
// error boundary/fallback must never depend on a provider that only exists on the happy path.
import { useRouter } from 'next/navigation';

import { isSessionInvalidMessage } from '@/shared/utils/isTokenError';
import { triggerSessionLogoutRedirect } from '@/shared/utils/triggerSessionLogout';

export default function ErrorPage({
    error,
    side
}: {
    error: string;
    side: string;
}) {
    // Pure derivation from props — computed identically on server and client render, so
    // hydration matches. The actual redirect (which needs `window`) happens in the effect below.
    const redirectingToLogout = isSessionInvalidMessage(error);

    const { replace, refresh } = useRouter();

    useEffect(() => {
    }, [error]);

    useEffect(() => {
        if (!redirectingToLogout) return;

        triggerSessionLogoutRedirect(replace);
    }, [redirectingToLogout, replace]);

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
                <Image src="/images/illustrations/error.svg" width={400} height={300} alt="Error" priority />

                <Typography variant="h5" sx={{ fontWeight: 'bold', mt: 2, color: '#d32f2f' }}>
                    Oops! Something went wrong.
                </Typography>

                <Typography fontFamily="Quicksand" variant="body1" color="textSecondary" sx={{ mt: 1 }}>
                    We encountered an unexpected issue. Please try again or contact support if the problem persists.
                </Typography>

                {error && (
                    <Typography
                        variant="body2"
                        fontFamily="Quicksand"
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
                        [{side}]   🔍 Error Details: {error}
                    </Typography>
                )}

                <Button
                    variant="contained"
                    color="primary"
                    sx={{ mt: 3, borderRadius: 2, paddingX: 3 }}
                    onClick={() => refresh()}
                >
                    Try Again
                </Button>
            </Paper>
        </Box>
    );
}
