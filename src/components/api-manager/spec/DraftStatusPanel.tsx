'use client';
import { Box, Alert, CircularProgress, Typography } from '@mui/material';
import { useDictionary } from '@/lib/i18n';

interface DraftStatusPanelProps {
    status: 'PENDING' | 'PROCESSING' | 'DONE' | 'FAILED';
    fileName: string;
}

export function DraftStatusPanel({ status, fileName }: DraftStatusPanelProps) {
    const { t } = useDictionary();

    if (status === 'PROCESSING') {
        return (
            <Box sx={{ display: 'flex', alignItems: 'center', p: 2, gap: 2 }}>
                <CircularProgress size={20} />
                <Typography variant="body2">{t('api.spec.extracting')}</Typography>
            </Box>
        );
    }

    if (status === 'DONE') {
        return (
            <Alert severity="success" sx={{ mt: 2 }}>
                Successfully processing <strong>{fileName}</strong>
            </Alert>
        );
    }

    if (status === 'FAILED') {
        return (
            <Alert severity="error" sx={{ mt: 2 }}>
                Failed to process <strong>{fileName}</strong>
            </Alert>
        );
    }

    return null; // Pending or initial state
}
