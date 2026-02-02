import { scanLogos } from '@/shared/utils/logoScanner'
import SystemSettingsClient from '@/views/pages/system-settings/SystemSettingsClient'
import { Box, Grid, Typography } from '@mui/material'

const SystemSettingsPage = () => {
    const presetLogos = scanLogos()

    const serverSettings = {}

    return (
        <Box sx={{ p: 6 }}>
            <Grid container spacing={6}>
                <Grid size={{ xs: 12 }}>
                    <Typography variant='h4'>System Settings</Typography>
                    <Typography variant='body1'>Configure global system appearance and branding.</Typography>
                </Grid>
                <Grid size={{ xs: 12 }}>
                    <SystemSettingsClient presetLogos={presetLogos} serverSettings={serverSettings} />
                </Grid>
            </Grid>
        </Box>
    )
}

export default SystemSettingsPage
