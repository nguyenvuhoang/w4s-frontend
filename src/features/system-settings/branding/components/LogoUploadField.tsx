'use client'

import React from 'react'
import { Alert, Box, Button, Stack, Typography } from '@mui/material'
import type { LogoFieldDef } from '../logoFieldDefs'

export type LogoFieldValue = {
    url: string
    error: string | null
    warning: string | null
}

type LogoUploadFieldProps = {
    def: LogoFieldDef
    value: LogoFieldValue
    t: (key: string) => string
    onFileSelect: (file: File) => void
    onRemove: () => void
}

const LogoUploadField = ({ def, value, t, onFileSelect, onRemove }: LogoUploadFieldProps) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]

        e.target.value = ''
        if (file) onFileSelect(file)
    }

    return (
        <Stack spacing={2} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
            <Typography variant='subtitle2' sx={{ fontWeight: 600 }}>
                {t(def.labelKey)}
            </Typography>

            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                <Button variant='outlined' component='label' size='small' sx={{ whiteSpace: 'nowrap' }}>
                    {t('upload_file_button')}
                    <input
                        type='file'
                        hidden
                        accept='image/png,image/jpeg,image/webp,image/svg+xml'
                        onChange={handleChange}
                    />
                </Button>
                {value.url && (
                    <Button size='small' color='error' variant='text' onClick={onRemove}>
                        {t('remove_logo_button')}
                    </Button>
                )}
            </Box>

            <Stack spacing={0.5}>
                <Typography variant='caption' color='text.secondary'>{t(def.sizeKey)}</Typography>
                <Typography variant='caption' color='text.secondary'>{t(def.ratioKey)}</Typography>
                <Typography variant='caption' color='text.secondary'>{t('branding_logo_max_size')}</Typography>
                <Typography variant='caption' color='text.secondary'>{t('branding_logo_allowed_formats')}</Typography>
            </Stack>

            {value.error && <Alert severity='error'>{value.error}</Alert>}
            {value.warning && <Alert severity='warning'>{value.warning}</Alert>}

            {value.url && (
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: 96,
                        border: '1px dashed',
                        borderColor: 'divider',
                        borderRadius: 1,
                        p: 2,
                        bgcolor: 'action.hover'
                    }}
                >
                    <img
                        src={value.url}
                        alt={t(def.labelKey)}
                        style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                    />
                </Box>
            )}
        </Stack>
    )
}

export default LogoUploadField
