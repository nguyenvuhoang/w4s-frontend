'use client';
import { Box, Paper, Typography, Button, LinearProgress } from '@mui/material';
import { CloudUpload as CloudUploadIcon } from '@mui/icons-material';
import { useDictionary } from '@/lib/i18n';
import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';

interface ApiSpecUploadCardProps {
    onUploadComplete: (draft: any) => void;
}

export function ApiSpecUploadCard({ onUploadComplete }: ApiSpecUploadCardProps) {
    const { t } = useDictionary();
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        const file = acceptedFiles[0];
        if (!file) return;

        setUploading(true);
        setError(null);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch('/api/api-manager/spec/upload', {
                method: 'POST',
                body: formData,
            });

            if (!res.ok) throw new Error('Upload failed');

            const draft = await res.json();

            // Trigger extraction immediately for demo
            const extractRes = await fetch(`/api/api-manager/spec/drafts/${draft.id}/extract`, { method: 'POST' });
            if (!extractRes.ok) throw new Error('Extraction failed');

            const processedDraft = await extractRes.json();
            onUploadComplete(processedDraft);

        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
        } finally {
            setUploading(false);
        }
    }, [onUploadComplete]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'application/pdf': ['.pdf'] },
        multiple: false
    });

    return (
        <Paper
            variant="outlined"
            sx={{
                p: 4,
                textAlign: 'center',
                cursor: 'pointer',
                bgcolor: isDragActive ? 'action.hover' : 'background.paper',
                borderStyle: 'dashed'
            }}
            {...getRootProps()}
        >
            <input {...getInputProps()} />
            <CloudUploadIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
                {t('api.spec.upload_pdf')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
                {t('api.spec.upload_drag')}
            </Typography>
            {uploading && <LinearProgress sx={{ mt: 2 }} />}
            {error && <Typography color="error" sx={{ mt: 2 }}>{error}</Typography>}
        </Paper>
    );
}
