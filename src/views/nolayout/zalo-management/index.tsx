'use client';

import { getDictionary } from '@/shared/utils/getDictionary';
import {
    ContentCopy as ContentCopyIcon,
    InfoOutlined as InfoIcon,
    Visibility as VisibilityIcon,
    VisibilityOff as VisibilityOffIcon
} from '@mui/icons-material';
import {
    Box,
    Button,
    Card,
    CardContent,
    CardHeader,
    Divider,
    Grid,
    IconButton,
    InputAdornment,
    MenuItem,
    Paper,
    Switch,
    TextField,
    Typography
} from '@mui/material';
import React, { useState } from 'react';
import { ZaloAppSettings } from './types';

const ZaloManagementContent = ({ dictionary, session }: {
    dictionary: Awaited<ReturnType<typeof getDictionary>>,
    session: any
}) => {
    const t = dictionary.zalo;
    const [showSecret, setShowSecret] = useState(false);
    const [settings, setSettings] = useState<ZaloAppSettings>({
        appId: '292759467911125320',
        appSecret: '**************************',
        displayName: 'vKnight',
        appDomain: 'vknight.io.vn',
        contactPhone: '+84 388 861 300',
        contactEmail: 'nguyenvuhoangz@gmail.com',
        appIconUrl: '',
        category: t.dev_tools,
        description: 'O24 là nền tảng API Management và Product Service mã nguồn mở từ vKnight. Plugin first architecture, tài liệu đầy đủ, triển khai linh hoạt trên onprem hoặc cloud, xây dựng bởi developers, cho developers.',
        isActive: true,
        requireSecretProof: false,
    });

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        // Add toast notification here if available
    };

    const handleChange = (field: keyof ZaloAppSettings) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const value = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
        setSettings(prev => ({ ...prev, [field]: value }));
    };

    return (
        <Box sx={{ pb: 10 }}>
            {/* Header */}

            <Grid container spacing={4}>
                {/* Main Content */}
                <Grid size={{ xs: 12 }}>
                    <Card sx={{ borderRadius: 2, boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                        <CardHeader
                            title={
                                <Box display="flex" alignItems="center" justifyContent="space-between">
                                    <Typography variant="h6" fontWeight={700}>{t.app_info}</Typography>
                                    <Box display="flex" alignItems="center" gap={1}>
                                        <Switch
                                            checked={settings.isActive}
                                            onChange={(e) => setSettings(prev => ({ ...prev, isActive: e.target.checked }))}
                                            color="primary"
                                        />
                                        <Typography variant="body2" fontWeight={500} color="textSecondary">
                                            {settings.isActive ? t.active : t.inactive}
                                        </Typography>
                                        <InfoIcon sx={{ fontSize: 18, color: 'text.disabled', ml: 0.5 }} />
                                    </Box>
                                </Box>
                            }
                        />
                        <Divider />
                        <CardContent sx={{ p: 4 }}>
                            <Grid container spacing={4}>
                                <Grid size={{ xs: 12, md: 6 }}>
                                    <Typography variant="subtitle2" gutterBottom fontWeight={600}>{t.app_id}</Typography>
                                    <TextField
                                        fullWidth
                                        value={settings.appId}
                                        slotProps={{
                                            input: {
                                                readOnly: true,
                                                endAdornment: (
                                                    <InputAdornment position="end">
                                                        <IconButton onClick={() => handleCopy(settings.appId)} size="small">
                                                            <ContentCopyIcon fontSize="small" />
                                                        </IconButton>
                                                    </InputAdornment>
                                                ),
                                                sx: { bgcolor: '#f8f9fa' }
                                            },

                                        }}
                                        size="small"
                                    />
                                </Grid>
                                <Grid size={{ xs: 12, md: 6 }}>
                                    <Typography variant="subtitle2" gutterBottom fontWeight={600}>{t.app_secret}</Typography>
                                    <TextField
                                        fullWidth
                                        type={showSecret ? 'text' : 'password'}
                                        value={settings.appSecret}
                                        slotProps={{
                                            input: {
                                                readOnly: true,
                                                endAdornment: (
                                                    <InputAdornment position="end">
                                                        <IconButton onClick={() => setShowSecret(!showSecret)} size="small">
                                                            {showSecret ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                                                        </IconButton>
                                                    </InputAdornment>
                                                ),
                                                sx: { bgcolor: '#f8f9fa' }
                                            },
                                        }}

                                        size="small"
                                    />
                                </Grid>

                                <Grid size={{ xs: 12, md: 6 }}>
                                    <Typography variant="subtitle2" gutterBottom fontWeight={600}>{t.display_name} <Box component="span" color="error.main">*</Box> <InfoIcon sx={{ fontSize: 16, verticalAlign: 'middle', ml: 0.5, color: 'text.disabled' }} /></Typography>
                                    <TextField
                                        fullWidth
                                        value={settings.displayName}
                                        onChange={handleChange('displayName')}
                                        size="small"
                                        placeholder={t.app_name_placeholder}
                                    />
                                </Grid>
                                <Grid size={{ xs: 12, md: 6 }}>
                                    <Typography variant="subtitle2" gutterBottom fontWeight={600}>{t.app_domain} <InfoIcon sx={{ fontSize: 16, verticalAlign: 'middle', ml: 0.5, color: 'text.disabled' }} /></Typography>
                                    <TextField
                                        fullWidth
                                        value={settings.appDomain}
                                        onChange={handleChange('appDomain')}
                                        size="small"
                                        placeholder="domain.com"
                                    />
                                </Grid>

                                <Grid size={{ xs: 12, md: 6 }}>
                                    <Typography variant="subtitle2" gutterBottom fontWeight={600}>{t.contact_phone} <Box component="span" color="error.main">*</Box></Typography>
                                    <TextField
                                        fullWidth
                                        value={settings.contactPhone}
                                        onChange={handleChange('contactPhone')}
                                        size="small"
                                        slotProps={{
                                            input: {
                                                startAdornment: <InputAdornment position="start"><Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>🇻🇳 +84</Box></InputAdornment>
                                            },
                                        }}
                                    />
                                </Grid>
                                <Grid size={{ xs: 12, md: 6 }}>
                                    <Typography variant="subtitle2" gutterBottom fontWeight={600}>{t.contact_email} <Box component="span" color="error.main">*</Box></Typography>
                                    <TextField
                                        fullWidth
                                        value={settings.contactEmail}
                                        onChange={handleChange('contactEmail')}
                                        size="small"
                                        placeholder="email@example.com"
                                    />
                                </Grid>

                                <Grid size={{ xs: 12, md: 6 }}>
                                    <Typography variant="subtitle2" gutterBottom fontWeight={600}>{t.app_icon} (512 x 512)</Typography>
                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                        <Paper
                                            variant="outlined"
                                            sx={{
                                                width: 120,
                                                height: 120,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                bgcolor: '#fff',
                                                borderStyle: 'dashed',
                                                borderRadius: 2,
                                                overflow: 'hidden'
                                            }}
                                        >
                                            {/* <Image
                                                src="https://zalo-config.s3.ap-southeast-1.amazonaws.com/oa-avt-1.png" // Placeholder or actual icon
                                                alt="App Icon"
                                                style={{ width: '80%', height: '80%', objectFit: 'contain' }}
                                                onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/120?text=Icon'; }}
                                            /> */}
                                        </Paper>
                                        <Box display="flex" gap={1}>
                                            <Button variant="outlined" size="small" component="label" sx={{ textTransform: 'none' }}>
                                                {t.choose_file}
                                                <input type="file" hidden />
                                            </Button>
                                            <Typography variant="caption" color="textSecondary" alignSelf="center">{t.no_file_chosen}</Typography>
                                        </Box>
                                        <Typography variant="caption" color="textSecondary">
                                            {t.app_icon_desc}
                                        </Typography>
                                    </Box>
                                </Grid>

                                <Grid size={{ xs: 12, md: 6 }}>
                                    <Typography variant="subtitle2" gutterBottom fontWeight={600}>{t.category} <Box component="span" color="error.main">*</Box></Typography>
                                    <TextField
                                        select
                                        fullWidth
                                        value={settings.category}
                                        onChange={handleChange('category')}
                                        size="small"
                                    >
                                        <MenuItem value={t.dev_tools}>{t.dev_tools}</MenuItem>
                                        <MenuItem value={t.utilities}>{t.utilities}</MenuItem>
                                        <MenuItem value={t.business}>{t.business}</MenuItem>
                                    </TextField>

                                    <Box mt={3}>
                                        <Typography variant="subtitle2" gutterBottom fontWeight={600}>{t.description} <Box component="span" color="error.main">*</Box> <InfoIcon sx={{ fontSize: 16, verticalAlign: 'middle', ml: 0.5, color: 'text.disabled' }} /></Typography>
                                        <TextField
                                            fullWidth
                                            multiline
                                            rows={4}
                                            value={settings.description}
                                            onChange={handleChange('description')}
                                            size="small"
                                            placeholder={t.description_placeholder}
                                        />
                                    </Box>
                                </Grid>

                                <Grid size={{ xs: 12 }}>
                                    <Box display="flex" justifyContent="center" mt={2}>
                                        <Button
                                            variant="contained"
                                            sx={{
                                                bgcolor: '#0068ff', // Zalo blue button
                                                '&:hover': { bgcolor: '#005ae6' },
                                                px: 4,
                                                py: 1,
                                                borderRadius: 1,
                                                textTransform: 'none',
                                                fontWeight: 600,
                                            }}
                                        >
                                            {t.save_changes}
                                        </Button>
                                    </Box>
                                </Grid>
                            </Grid>
                        </CardContent>
                    </Card>

                    <Card sx={{ mt: 4, borderRadius: 2, boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                        <CardHeader title={<Typography variant="h6" fontWeight={700}>{t.security}</Typography>} />
                        <Divider />
                        <CardContent sx={{ p: 4 }}>
                            <Box display="flex" alignItems="center" justifyContent="space-between">
                                <Box display="flex" alignItems="center" gap={1}>
                                    <Switch
                                        checked={settings.requireSecretProof}
                                        onChange={(e) => setSettings(prev => ({ ...prev, requireSecretProof: e.target.checked }))}
                                        color="primary"
                                    />
                                    <Typography variant="body2" fontWeight={500}>
                                        {t.app_secret_proof_desc}
                                    </Typography>
                                </Box>
                                <Button
                                    variant="outlined"
                                    sx={{
                                        color: '#0068ff',
                                        borderColor: '#0068ff',
                                        '&:hover': { borderColor: '#005ae6', bgcolor: 'rgba(0,104,255,0.05)' },
                                        textTransform: 'none',
                                        fontWeight: 600,
                                    }}
                                >
                                    {t.register_token}
                                </Button>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
};


export default ZaloManagementContent;
