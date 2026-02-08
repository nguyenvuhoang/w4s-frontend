'use client';

import React from 'react';
import {
    Box,
    Paper,
    Typography,
    TextField,
    Button,
    Stack,
    IconButton,
    InputAdornment,
    Switch,
    FormControlLabel,
    CircularProgress,
    Alert,
} from '@mui/material';
import {
    ArrowBack as ArrowBackIcon,
    Visibility as VisibilityIcon,
    VisibilityOff as VisibilityOffIcon,
    Save as SaveIcon,
} from '@mui/icons-material';
import { useEmailSettingsHandler } from '@/features/email/hooks/useEmailSettingsHandler';

interface EmailSettingsViewProps {
    onBack: () => void;
    dictionary: any;
}

export default function EmailSettingsView({ onBack, dictionary }: EmailSettingsViewProps) {
    const {
        config,
        loading,
        error,
        showPassword,
        togglePasswordVisibility,
        handleSave,
        setConfig
    } = useEmailSettingsHandler();

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ p: 4, maxWidth: 800, mx: 'auto' }}>
            <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 4 }}>
                <IconButton onClick={onBack} sx={{ color: 'text.primary' }}>
                    <ArrowBackIcon />
                </IconButton>
                <Typography variant="h5" sx={{ fontWeight: 600 }}>
                    {dictionary.email.settings_title}
                </Typography>
            </Stack>

            {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

            <Paper sx={{ p: 4, borderRadius: 2 }}>
                <Stack spacing={3}>
                    <Grid container spacing={3}>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label={dictionary.email.config_id}
                                value={config?.config_id || ''}
                                disabled
                                variant="outlined"
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label={dictionary.email.sender_email}
                                value={config?.sender || ''}
                                onChange={(e) => setConfig(prev => prev ? ({ ...prev, sender: e.target.value }) : null)}
                                variant="outlined"
                            />
                        </Grid>
                        <Grid item xs={12} sm={8}>
                            <TextField
                                fullWidth
                                label={dictionary.email.smtp_host}
                                value={config?.host || ''}
                                onChange={(e) => setConfig(prev => prev ? ({ ...prev, host: e.target.value }) : null)}
                                variant="outlined"
                            />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <TextField
                                fullWidth
                                label={dictionary.email.port}
                                type="number"
                                value={config?.port || ''}
                                onChange={(e) => setConfig(prev => prev ? ({ ...prev, port: parseInt(e.target.value) }) : null)}
                                variant="outlined"
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label={dictionary.email.password}
                                type={showPassword ? 'text' : 'password'}
                                value={config?.password || ''}
                                onChange={(e) => setConfig(prev => prev ? ({ ...prev, password: e.target.value }) : null)}
                                variant="outlined"
                                InputProps={{
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton
                                                onClick={togglePasswordVisibility}
                                                edge="end"
                                            >
                                                {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                }}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label={dictionary.email.test_email}
                                value={config?.email_test || ''}
                                onChange={(e) => setConfig(prev => prev ? ({ ...prev, email_test: e.target.value }) : null)}
                                variant="outlined"
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={config?.enable_tls || false}
                                        onChange={(e) => setConfig(prev => prev ? ({ ...prev, enable_tls: e.target.checked }) : null)}
                                        color="primary"
                                    />
                                }
                                label={dictionary.email.enable_tls}
                            />
                        </Grid>
                    </Grid>

                    <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                        <Button
                            variant="contained"
                            startIcon={<SaveIcon />}
                            onClick={handleSave}
                            sx={{
                                bgcolor: '#0C9150',
                                '&:hover': { bgcolor: '#0a7d45' },
                                px: 4,
                                py: 1,
                                borderRadius: 2
                            }}
                        >
                            {dictionary.email.save_config}
                        </Button>
                    </Box>
                </Stack>
            </Paper>
        </Box>
    );
}

// Simple Grid replacement
function Grid({ container, item, spacing, children, xs, sm, ...props }: any) {
    if (container) {
        return (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', m: -(spacing || 0) / 2 }}>
                {React.Children.map(children, child =>
                    React.isValidElement(child) ? React.cloneElement(child as any, { spacing }) : child
                )}
            </Box>
        );
    }
    const width = xs ? (xs / 12) * 100 : '100%';
    const smWidth = sm ? (sm / 12) * 100 : width;
    return (
        <Box sx={{
            p: (spacing || 0) / 2,
            width: { xs: `${width}%`, sm: `${smWidth}%` },
            boxSizing: 'border-box'
        }}>
            {children}
        </Box>
    );
}
