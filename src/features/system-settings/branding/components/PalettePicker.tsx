'use client'

import React from 'react'
import CheckCircleRounded from '@mui/icons-material/CheckCircleRounded'
import { Box, Card, Stack, TextField, Typography } from '@mui/material'
import {
    BRANDING_PALETTE_COLOR_KEYS,
    BRANDING_PALETTE_PRESETS,
    type BrandingPalette,
    type BrandingPaletteColorKey
} from '@shared/constants/branding'

const HEX_COLOR_PATTERN = /^#[0-9A-Fa-f]{6}$/

const PREVIEW_SWATCH_KEYS: BrandingPaletteColorKey[] = ['primary', 'secondary', 'accent', 'background', 'text_primary']

const COLOR_FIELD_LABEL_KEYS: Record<BrandingPaletteColorKey, string> = {
    primary: 'branding_palette_primary_label',
    secondary: 'branding_palette_secondary_label',
    accent: 'branding_palette_accent_label',
    background: 'branding_palette_background_label',
    surface: 'branding_palette_surface_label',
    text_primary: 'branding_palette_text_primary_label',
    text_secondary: 'branding_palette_text_secondary_label'
}

const isSamePalette = (a: BrandingPalette, b: BrandingPalette) => (
    BRANDING_PALETTE_COLOR_KEYS.every(key => a[key].toLowerCase() === b[key].toLowerCase())
)

export type PalettePickerProps = {
    palette: BrandingPalette
    errors: Partial<Record<BrandingPaletteColorKey, string>>
    t: (key: string) => string
    onSelectPreset: (preset: BrandingPalette) => void
    onFieldChange: (key: BrandingPaletteColorKey | 'name', value: string) => void
}

const PalettePicker = ({ palette, errors, t, onSelectPreset, onFieldChange }: PalettePickerProps) => {
    return (
        <Stack spacing={5}>
            <Box>
                <Typography variant='subtitle2' sx={{ mb: 2 }}>
                    {t('branding_palette_presets_label')}
                </Typography>
                <Box
                    sx={{
                        display: 'grid',
                        gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' },
                        gap: 3
                    }}
                >
                    {BRANDING_PALETTE_PRESETS.map(preset => {
                        const isActive = isSamePalette(palette, preset)

                        return (
                            <Card
                                key={preset.name}
                                variant='outlined'
                                onClick={() => onSelectPreset(preset)}
                                sx={{
                                    p: 3,
                                    cursor: 'pointer',
                                    borderWidth: isActive ? 2 : 1,
                                    borderColor: isActive ? preset.primary : 'divider',
                                    position: 'relative',
                                    '&:hover': { boxShadow: 2 }
                                }}
                            >
                                {isActive && (
                                    <CheckCircleRounded
                                        sx={{ position: 'absolute', top: 8, right: 8, color: preset.primary, fontSize: 20 }}
                                    />
                                )}
                                <Typography variant='body2' sx={{ fontWeight: 600, mb: 1.5 }}>
                                    {preset.name}
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 1 }}>
                                    {PREVIEW_SWATCH_KEYS.map(key => (
                                        <Box
                                            key={key}
                                            sx={{
                                                width: 22,
                                                height: 22,
                                                borderRadius: '50%',
                                                bgcolor: preset[key],
                                                border: '1px solid rgba(0,0,0,0.12)'
                                            }}
                                        />
                                    ))}
                                </Box>
                            </Card>
                        )
                    })}
                </Box>
            </Box>

            <Box>
                <Typography variant='subtitle2' sx={{ mb: 0.5 }}>
                    {t('branding_palette_custom_label')}
                </Typography>
                <Typography variant='caption' color='text.secondary' sx={{ display: 'block', mb: 3 }}>
                    {t('branding_palette_custom_helper')}
                </Typography>

                <Stack spacing={3}>
                    <TextField
                        fullWidth
                        label={t('branding_palette_name_label')}
                        value={palette.name}
                        onChange={e => onFieldChange('name', e.target.value)}
                    />

                    <Box
                        sx={{
                            display: 'grid',
                            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
                            gap: 3
                        }}
                    >
                        {BRANDING_PALETTE_COLOR_KEYS.map(key => (
                            <Box key={key} sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                                <Box
                                    component='input'
                                    type='color'
                                    aria-label={t(COLOR_FIELD_LABEL_KEYS[key])}
                                    value={HEX_COLOR_PATTERN.test(palette[key]) ? palette[key] : '#000000'}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => onFieldChange(key, e.target.value)}
                                    sx={{
                                        width: 44,
                                        height: 40,
                                        p: 0,
                                        mt: '2px',
                                        border: '1px solid',
                                        borderColor: 'divider',
                                        borderRadius: 1,
                                        cursor: 'pointer',
                                        flexShrink: 0
                                    }}
                                />
                                <TextField
                                    fullWidth
                                    size='small'
                                    label={t(COLOR_FIELD_LABEL_KEYS[key])}
                                    value={palette[key]}
                                    onChange={e => onFieldChange(key, e.target.value)}
                                    error={!!errors[key]}
                                    helperText={errors[key]}
                                />
                            </Box>
                        ))}
                    </Box>
                </Stack>
            </Box>
        </Stack>
    )
}

export default PalettePicker
