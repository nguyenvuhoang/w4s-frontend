'use client';

import { Box, Typography, Button, Paper } from '@mui/material';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

export type PageErrorProps = {
    title?: string;
    message?: string;
    errorDetails?: string;
    executionId?: string;
    showRetry?: boolean;
    showGoBack?: boolean;
    onRetry?: () => void;
};

export default function PageError({
    title = 'Oops! Something went wrong.',
    message = 'We encountered an unexpected issue. Please try again or contact support if the problem persists.',
    errorDetails,
    executionId,
    showRetry = true,
    showGoBack = true,
    onRetry,
}: PageErrorProps) {
    const router = useRouter();

    const handleRetry = () => {
        if (onRetry) {
            onRetry();
        } else {
            router.refresh();
        }
    };

    const handleGoBack = () => {
        router.back();
    };

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
                <Image 
                    src="/images/illustrations/error.svg" 
                    width={400} 
                    height={300} 
                    alt="Error" 
                    priority 
                />

                <Typography variant="h5" sx={{ fontWeight: 'bold', mt: 2, color: '#d32f2f' }}>
                    {title}
                </Typography>

                <Typography variant="body1" color="textSecondary" sx={{ mt: 1 }}>
                    {message}
                </Typography>

                {/* Display error details if provided */}
                {errorDetails && (
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
                        🔍 Error Details: {errorDetails}
                    </Typography>
                )}

                {/* Display execution ID if provided */}
                {executionId && (
                    <Typography
                        variant="body2"
                        sx={{
                            mt: 1,
                            fontSize: '12px',
                            color: '#757575',
                            fontStyle: 'italic',
                        }}
                    >
                        Execution ID: {executionId}
                    </Typography>
                )}

                <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center', gap: 2 }}>
                    {showGoBack && (
                        <Button
                            variant="outlined"
                            color="primary"
                            sx={{ borderRadius: 2, paddingX: 3 }}
                            onClick={handleGoBack}
                        >
                            Go Back
                        </Button>
                    )}
                    {showRetry && (
                        <Button
                            variant="contained"
                            color="primary"
                            sx={{ borderRadius: 2, paddingX: 3 }}
                            onClick={handleRetry}
                        >
                            Try Again
                        </Button>
                    )}
                </Box>
            </Paper>
        </Box>
    );
}
