'use client'

import React, { useEffect, useRef, useState } from 'react'
import {
    Box,
    Button,
    Card,
    CardContent,
    CardHeader,
    Divider,
    Grid,
    MenuItem,
    Stack,
    TextField,
    Typography
} from '@mui/material'
import { useSettings } from '@core/hooks/useSettings'
import { env } from '@/env.mjs'
import SwalAlert from '@/shared/utils/SwalAlert'
import {
    BRANDING_LOGO_KEYS,
    BRANDING_PALETTE_COLOR_KEYS,
    DEFAULT_BRANDING_LOGOS,
    DEFAULT_BRANDING_PALETTE,
    DEFAULT_BRANDING_SETTINGS,
    type BrandingLogoKey,
    type BrandingLogos,
    type BrandingPalette,
    type BrandingPaletteColorKey,
    type BrandingSettings
} from '@shared/constants/branding'
import { BrandingApiError, brandingService } from '@/features/system-settings/branding/services/brandingService'
import { LOGO_FIELD_DEFS } from '@/features/system-settings/branding/logoFieldDefs'
import LogoUploadField, { type LogoFieldValue } from '@/features/system-settings/branding/components/LogoUploadField'
import PalettePicker from '@/features/system-settings/branding/components/PalettePicker'
import type { SystemSettingsDictionary } from './systemSettingsModules'

const fontOptions = [
    { label: 'Quicksand', value: 'Quicksand, sans-serif' },
    { label: 'Inter', value: 'Inter, sans-serif' },
    { label: 'Roboto', value: 'Roboto, sans-serif' },
    { label: 'Open Sans', value: '"Open Sans", sans-serif' },
    { label: 'System UI', value: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif' }
]

const ALLOWED_LOGO_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']
const MAX_LOGO_SIZE_BYTES = 2 * 1024 * 1024
const HEX_COLOR_PATTERN = /^#[0-9A-Fa-f]{6}$/

type SystemSettingsClientProps = {
    serverSettings?: Partial<BrandingSettings>
    dictionary: SystemSettingsDictionary
}

type LogosFieldState = Record<BrandingLogoKey, LogoFieldValue>

const settingsClientText = (dictionary: SystemSettingsDictionary, key: string) => (
    dictionary.system_settings_modules?.[key] ?? key
)

const buildLogosFieldState = (logos: BrandingLogos): LogosFieldState => (
    BRANDING_LOGO_KEYS.reduce((acc, key) => {
        acc[key] = { url: logos[key] || '', error: null, warning: null }
        return acc
    }, {} as LogosFieldState)
)

const SystemSettingsClient = ({ serverSettings = {}, dictionary }: SystemSettingsClientProps) => {
    const { settings, updateSettings } = useSettings()
    const t = (key: string) => settingsClientText(dictionary, key)

    // Priority: Backend branding config (serverSettings) -> ENV default -> current context
    // settings (already resolved through the same Backend -> ENV -> themeConfig chain at
    // Provider level).
    const initialLogos = serverSettings.logos || settings.logos || DEFAULT_BRANDING_LOGOS
    const initialPalette = serverSettings.palette || settings.palette || DEFAULT_BRANDING_PALETTE
    const initialBrandingName =
        serverSettings.brandingName ||
        env.NEXT_PUBLIC_APPLICATION_TITLE ||
        settings.brandingName ||
        DEFAULT_BRANDING_SETTINGS.brandingName
    const initialFontFamily = serverSettings.fontFamily || settings.fontFamily || DEFAULT_BRANDING_SETTINGS.fontFamily

    const [brandingName, setBrandingName] = useState(initialBrandingName)
    const [palette, setPalette] = useState<BrandingPalette>(initialPalette)
    const [paletteErrors, setPaletteErrors] = useState<Partial<Record<BrandingPaletteColorKey, string>>>({})
    const [fontFamily, setFontFamily] = useState(initialFontFamily)
    const [logosState, setLogosState] = useState<LogosFieldState>(() => buildLogosFieldState(initialLogos))
    const [isSaving, setIsSaving] = useState(false)

    const pendingLogoFilesRef = useRef<Partial<Record<BrandingLogoKey, File>>>({})
    const pendingObjectUrlsRef = useRef<Partial<Record<BrandingLogoKey, string>>>({})

    useEffect(() => {
        return () => {
            Object.values(pendingObjectUrlsRef.current).forEach(url => {
                if (url) URL.revokeObjectURL(url)
            })
        }
    }, [])

    const clearPendingLogoFile = (key: BrandingLogoKey) => {
        const pendingUrl = pendingObjectUrlsRef.current[key]

        if (pendingUrl) URL.revokeObjectURL(pendingUrl)
        delete pendingObjectUrlsRef.current[key]
        delete pendingLogoFilesRef.current[key]
    }

    const handleLogoFileSelect = (key: BrandingLogoKey, file: File) => {
        if (!ALLOWED_LOGO_TYPES.includes(file.type)) {
            setLogosState(prev => ({ ...prev, [key]: { ...prev[key], error: t('branding_logo_type_error') } }))
            return
        }

        if (file.size > MAX_LOGO_SIZE_BYTES) {
            setLogosState(prev => ({ ...prev, [key]: { ...prev[key], error: t('branding_logo_size_error') } }))
            return
        }

        clearPendingLogoFile(key)

        const objectUrl = URL.createObjectURL(file)

        pendingObjectUrlsRef.current[key] = objectUrl
        pendingLogoFilesRef.current[key] = file

        setLogosState(prev => ({ ...prev, [key]: { url: objectUrl, error: null, warning: null } }))

        if (file.type !== 'image/svg+xml') {
            const def = LOGO_FIELD_DEFS.find(item => item.key === key)!
            const targetRatio = def.width / def.height
            const img = new Image()

            img.onload = () => {
                if (img.naturalWidth && img.naturalHeight) {
                    const ratio = img.naturalWidth / img.naturalHeight

                    if (Math.abs(ratio - targetRatio) / targetRatio > 0.3) {
                        setLogosState(prev => ({ ...prev, [key]: { ...prev[key], warning: t('branding_logo_ratio_warning') } }))
                    }
                }
            }
            img.src = objectUrl
        }
    }

    const handleLogoRemove = (key: BrandingLogoKey) => {
        clearPendingLogoFile(key)
        setLogosState(prev => ({ ...prev, [key]: { url: '', error: null, warning: null } }))
    }

    const handlePaletteFieldChange = (key: BrandingPaletteColorKey | 'name', value: string) => {
        setPalette(prev => ({ ...prev, [key]: value }))

        if (key !== 'name') {
            setPaletteErrors(prev => ({
                ...prev,
                [key]: HEX_COLOR_PATTERN.test(value) ? undefined : t('branding_color_invalid')
            }))
        }
    }

    const handleSelectPreset = (preset: BrandingPalette) => {
        setPalette({ ...preset })
        setPaletteErrors({})
    }

    const handleSave = async () => {
        const trimmedName = brandingName.trim()

        if (!trimmedName) {
            SwalAlert('warning', t('branding_name_required'))
            return
        }

        if (!palette.name.trim()) {
            SwalAlert('warning', t('branding_palette_name_required'))
            return
        }

        const invalidColorKey = BRANDING_PALETTE_COLOR_KEYS.find(key => !HEX_COLOR_PATTERN.test(palette[key]))

        if (invalidColorKey) {
            setPaletteErrors(prev => ({ ...prev, [invalidColorKey]: t('branding_color_invalid') }))
            SwalAlert('warning', t('branding_color_invalid'))
            return
        }

        setIsSaving(true)
        try {
            const resolvedLogos = { ...DEFAULT_BRANDING_LOGOS } as BrandingLogos

            for (const key of BRANDING_LOGO_KEYS) {
                const pendingFile = pendingLogoFilesRef.current[key]

                if (pendingFile) {
                    try {
                        resolvedLogos[key] = await brandingService.uploadLogo(pendingFile)
                    } catch {
                        SwalAlert('error', t('branding_logo_upload_error'))
                        return
                    }
                } else {
                    resolvedLogos[key] = logosState[key].url
                }
            }

            const saved = await brandingService.save({
                brandingName: trimmedName,
                logos: resolvedLogos,
                palette: { ...palette, name: palette.name.trim() },
                fontFamily
            })

            BRANDING_LOGO_KEYS.forEach(clearPendingLogoFile)
            setBrandingName(saved.brandingName)
            setPalette(saved.palette)
            setPaletteErrors({})
            setFontFamily(saved.fontFamily)
            setLogosState(buildLogosFieldState(saved.logos))

            updateSettings({
                brandingName: saved.brandingName,
                logos: saved.logos,
                palette: saved.palette,
                primaryColor: saved.palette.primary,
                fontFamily: saved.fontFamily
            })

            SwalAlert('success', t('settings_save_success'))
        } catch (error) {
            // Pass the raw API payload when available so SwalAlert can render the execution_id
            // reference the same way every other screen in the app does, not just a bare message.
            const alertContent = error instanceof BrandingApiError
                ? error.payload
                : (error instanceof Error && error.message) || t('settings_save_error')

            SwalAlert('error', alertContent)
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <Grid container spacing={6}>
            <Grid size={{ xs: 12 }}>
                <Card>
                    <CardHeader
                        title={t('branding_info_section_title')}
                        subheader={t('branding_info_section_subtitle')}
                    />
                    <Divider />
                    <CardContent>
                        <TextField
                            fullWidth
                            label={t('branding_name_label')}
                            placeholder={t('branding_name_placeholder')}
                            value={brandingName}
                            onChange={e => setBrandingName(e.target.value)}
                        />
                    </CardContent>
                </Card>
            </Grid>

            <Grid size={{ xs: 12 }}>
                <Card>
                    <CardHeader
                        title={t('branding_logo_section_title')}
                        subheader={t('branding_logo_section_subtitle')}
                    />
                    <Divider />
                    <CardContent>
                        <Grid container spacing={4}>
                            {LOGO_FIELD_DEFS.map(def => (
                                <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={def.key}>
                                    <LogoUploadField
                                        def={def}
                                        value={logosState[def.key]}
                                        t={t}
                                        onFileSelect={file => handleLogoFileSelect(def.key, file)}
                                        onRemove={() => handleLogoRemove(def.key)}
                                    />
                                </Grid>
                            ))}
                        </Grid>
                    </CardContent>
                </Card>
            </Grid>

            <Grid size={{ xs: 12 }}>
                <Card>
                    <CardHeader
                        title={t('branding_palette_section_title')}
                        subheader={t('branding_palette_section_subtitle')}
                    />
                    <Divider />
                    <CardContent>
                        <Stack spacing={5}>
                            <PalettePicker
                                palette={palette}
                                errors={paletteErrors}
                                t={t}
                                onSelectPreset={handleSelectPreset}
                                onFieldChange={handlePaletteFieldChange}
                            />

                            <Divider />

                            <Box>
                                <Typography variant='subtitle2' sx={{ mb: 2 }}>
                                    {t('font_family_label')}
                                </Typography>
                                <TextField
                                    select
                                    fullWidth
                                    value={fontFamily}
                                    onChange={e => setFontFamily(e.target.value)}
                                    sx={{ maxWidth: { sm: 360 } }}
                                >
                                    {fontOptions.map(option => (
                                        <MenuItem key={option.value} value={option.value}>
                                            <span style={{ fontFamily: option.value }}>{option.label}</span>
                                        </MenuItem>
                                    ))}
                                </TextField>
                            </Box>
                        </Stack>
                    </CardContent>
                </Card>
            </Grid>

            <Grid size={{ xs: 12 }}>
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                    <Button variant='contained' loading={isSaving} onClick={handleSave}>
                        {t('save_to_server_button')}
                    </Button>
                </Box>
            </Grid>
        </Grid>
    )
}

export default SystemSettingsClient
