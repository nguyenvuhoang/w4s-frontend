'use client';
import { Box, Button, TextField, Typography } from '@mui/material';
import { useDictionary } from '@/lib/i18n';
import React, { useState } from 'react';

interface OpenApiEditorProps {
    value: string;
    onChange: (val: string) => void;
    onValidate: () => void;
}

export function OpenApiEditor({ value, onChange, onValidate }: OpenApiEditorProps) {
    const { t } = useDictionary();

    return (
        <Box sx={{ mt: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="subtitle2">OpenAPI 3.0 (YAML/JSON)</Typography>
                <Button size="small" onClick={onValidate}>
                    {t('api.spec.validate')}
                </Button>
            </Box>
            <TextField
                multiline
                rows={15}
                fullWidth
                value={value}
                onChange={(e) => onChange(e.target.value)}
                variant="outlined"
                inputProps={{
                    style: { fontFamily: 'monospace', fontSize: 12 }
                }}
            />
        </Box>
    );
}
