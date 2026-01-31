'use client'

import React, { useState } from 'react'
import {
    Box,
    Button,
    Card,
    CardContent,
    CardHeader,
    Divider,
    Grid,
    InputAdornment,
    MenuItem,
    Stack,
    TextField,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Typography,
    Alert
} from '@mui/material'
import { useSettings } from '@core/hooks/useSettings'
import primaryColorConfig from '@/configs/primaryColorConfig'

const fontOptions = [
    { label: 'Quicksand (Default)', value: 'var(--font-quicksand-sans), Quicksand, sans-serif' },
    { label: 'Inter', value: 'Inter, sans-serif' },
    { label: 'Roboto', value: 'Roboto, sans-serif' },
    { label: 'Open Sans', value: '"Open Sans", sans-serif' },
    { label: 'System UI', value: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif' }
]

type SystemSettingsClientProps = {
    presetLogos?: { name: string; url: string }[]
    serverSettings?: any
}

const SystemSettingsClient = ({ presetLogos = [], serverSettings = {} }: SystemSettingsClientProps) => {
    const { settings, updateSettings } = useSettings()

    const [formData, setFormData] = useState({
        logoUrl: serverSettings.logoUrl || settings.logoUrl || '',
        primaryColor: serverSettings.primaryColor || settings.primaryColor || primaryColorConfig[0].main,
        fontFamily: serverSettings.fontFamily || settings.fontFamily || fontOptions[0].value,
        brandingName: serverSettings.brandingName || settings.brandingName || ''
    })

    const [galleryOpen, setGalleryOpen] = useState(false)
    const [sizeWarning, setSizeWarning] = useState<string | null>(null)
    const [isSaving, setIsSaving] = useState(false)

    const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value
        setFormData(prev => ({ ...prev, [field]: value }))
        if (field === 'logoUrl') setSizeWarning(null)
    }

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            // Check size (approx 3KB limit for cookie safety)
            if (file.size > 3072) {
                setSizeWarning('File is too large (> 3KB). It might not persist after refresh due to cookie limits.')
            } else {
                setSizeWarning(null)
            }

            const reader = new FileReader()
            reader.onloadend = () => {
                setFormData(prev => ({ ...prev, logoUrl: reader.result as string }))
            }
            reader.readAsDataURL(file)
        }
    }

    const handleApply = () => {
        updateSettings({
            logoUrl: formData.logoUrl,
            primaryColor: formData.primaryColor,
            fontFamily: formData.fontFamily,
            brandingName: formData.brandingName
        })
    }

    const handleSaveToServer = async () => {
        setIsSaving(true)
        try {
            const response = await fetch('/api/system-settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })
            if (response.ok) {
                alert('Settings saved to server successfully!')
            } else {
                alert('Failed to save settings to server.')
            }
        } catch (error) {
            console.error('Save to server error:', error)
            alert('An error occurred while saving to server.')
        } finally {
            setIsSaving(false)
        }
    }

    const handleReset = () => {
        setFormData({
            logoUrl: '',
            primaryColor: primaryColorConfig[0].main,
            fontFamily: fontOptions[0].value,
            brandingName: ''
        })
        setSizeWarning(null)
        updateSettings({
            logoUrl: '',
            primaryColor: primaryColorConfig[0].main,
            fontFamily: fontOptions[0].value,
            brandingName: ''
        })
    }

    const handleSelectFromGallery = (url: string) => {
        setFormData(prev => ({ ...prev, logoUrl: url }))
        setSizeWarning(null)
        setGalleryOpen(false)
    }

    return (
        <Grid container spacing={6}>
            <Grid size={{ xs: 12, md: 6 }}>
                <Card>
                    <CardHeader title='Branding' subheader='Customize your logo and enterprise identity' />
                    <Divider />
                    <CardContent>
                        <Stack spacing={5}>
                            <TextField
                                fullWidth
                                label='Branding Name (Branch Name)'
                                placeholder='Enterprise Console'
                                value={formData.brandingName}
                                onChange={handleChange('brandingName')}
                                sx={{ fontFamily: 'Quicksand, sans-serif' }}
                            />
                            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mt: 2 }}>
                                <TextField
                                    fullWidth
                                    label='Logo URL'
                                    placeholder='https://example.com/logo.png'
                                    value={formData.logoUrl}
                                    onChange={handleChange('logoUrl')}
                                    helperText='Web URL, Base64, or pick from gallery'
                                    sx={{ '& .MuiFormHelperText-root': { fontFamily: 'Quicksand, sans-serif' }, fontFamily: 'Quicksand, sans-serif' }}
                                />
                                <Box sx={{ display: 'flex', gap: 2, width: '100%', mt: 2 }}>
                                    <Button
                                        variant='outlined'
                                        component='label'
                                        size='small'
                                        sx={{ whiteSpace: 'nowrap', fontFamily: 'Quicksand, sans-serif' }}
                                    >
                                        Upload File
                                        <input type='file' hidden accept='image/*' onChange={handleFileUpload} />
                                    </Button>
                                    <Button
                                        variant='outlined'
                                        size='small'
                                        onClick={() => setGalleryOpen(true)}
                                        sx={{ fontFamily: 'Quicksand, sans-serif' }}
                                    >
                                        Choose from Gallery
                                    </Button>
                                </Box>
                            </Box>

                            {sizeWarning && (
                                <Alert severity='warning' sx={{ mt: 2 }}>
                                    {sizeWarning}
                                </Alert>
                            )}

                            {formData.logoUrl && (
                                <Box sx={{ mt: 2, p: 4, border: '1px dashed grey', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, borderRadius: 1 }}>
                                    <img src={formData.logoUrl} alt='Logo Preview' style={{ maxHeight: '80px', maxWidth: '100%' }} />
                                    <Button size='small' color='error' variant='text' onClick={() => setFormData(prev => ({ ...prev, logoUrl: '' }))}>
                                        Remove Logo
                                    </Button>
                                </Box>
                            )}
                        </Stack>
                    </CardContent>
                </Card>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
                <Card>
                    <CardHeader title='Colors & Typography' subheader='Global styles for the entire platform' />
                    <Divider />
                    <CardContent>
                        <Stack spacing={4}>
                            <TextField
                                select
                                fullWidth
                                label='Font Family'
                                value={formData.fontFamily}
                                onChange={handleChange('fontFamily')}
                            >
                                {fontOptions.map(option => (
                                    <MenuItem key={option.value} value={option.value}>
                                        <span style={{ fontFamily: option.value }}>{option.label}</span>
                                    </MenuItem>
                                ))}
                            </TextField>

                            <TextField
                                fullWidth
                                label='Primary Color'
                                value={formData.primaryColor}
                                onChange={handleChange('primaryColor')}
                                slotProps={{
                                    input: {
                                        startAdornment: (
                                            <InputAdornment position='start'>
                                                <Box
                                                    sx={{
                                                        width: 24,
                                                        height: 24,
                                                        borderRadius: '4px',
                                                        bgcolor: formData.primaryColor,
                                                        border: '1px solid grey'
                                                    }}
                                                />
                                            </InputAdornment>
                                        )
                                    }
                                }}
                            />

                            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                                {primaryColorConfig.map(color => (
                                    <Box
                                        key={color.main}
                                        onClick={() => setFormData(prev => ({ ...prev, primaryColor: color.main }))}
                                        sx={{
                                            width: 32,
                                            height: 32,
                                            borderRadius: '50%',
                                            bgcolor: color.main,
                                            cursor: 'pointer',
                                            border: formData.primaryColor === color.main ? '2px solid black' : '1px solid grey',
                                            '&:hover': { opacity: 0.8 }
                                        }}
                                    />
                                ))}
                            </Box>
                        </Stack>
                    </CardContent>
                </Card>
            </Grid>

            <Grid size={{ xs: 12 }}>
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                    <Button variant='outlined' color='secondary' onClick={handleReset}>
                        Reset to Default
                    </Button>
                    <Button variant='outlined' color='primary' loading={isSaving} onClick={handleSaveToServer}>
                        Save to Server
                    </Button>
                    <Button variant='contained' onClick={handleApply}>
                        Apply Changes
                    </Button>
                </Box>
            </Grid>

            {/* Logo Gallery Modal */}
            <Dialog open={galleryOpen} onClose={() => setGalleryOpen(false)} maxWidth='md' fullWidth>
                <DialogTitle sx={{ fontFamily: 'Quicksand, sans-serif' }}>Logo Warehouse</DialogTitle>
                <DialogContent>
                    <Grid container spacing={4} sx={{ mt: 2 }}>
                        {presetLogos.map(logo => (
                            <Grid size={{ xs: 6, sm: 4, md: 3 }} key={logo.url}>
                                <Card
                                    sx={{
                                        cursor: 'pointer',
                                        border: formData.logoUrl === logo.url ? '2px solid primary.main' : '1px solid divider',
                                        '&:hover': { boxShadow: 4 }
                                    }}
                                    onClick={() => handleSelectFromGallery(logo.url)}
                                >
                                    <Box sx={{ p: 4, display: 'flex', justifyContent: 'center' }}>
                                        <img src={logo.url} alt={logo.name} style={{ maxHeight: '60px', maxWidth: '100%' }} />
                                    </Box>
                                    <Divider />
                                    <Box sx={{ p: 2, textAlign: 'center' }}>
                                        <Typography variant='caption' sx={{ fontFamily: 'Quicksand, sans-serif' }}>{logo.name}</Typography>
                                    </Box>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setGalleryOpen(false)}>Cancel</Button>
                </DialogActions>
            </Dialog>
        </Grid>
    )
}

export default SystemSettingsClient
