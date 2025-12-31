'use client';

import { useEffect } from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

export default function ErrorPage({
    error,
    side
}: {
    error: string;
    side: string;
}) {
    useEffect(() => {
        console.error('Error Details:', error);
    }, [error]);

    const { refresh } = useRouter();

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
