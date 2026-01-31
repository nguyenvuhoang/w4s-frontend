import SystemSettingsClient from '@/views/pages/system-settings/SystemSettingsClient'
import { Box, Grid, Typography } from '@mui/material'
import { scanLogos } from '@/shared/utils/logoScanner'
import fs from 'fs'
import path from 'path'

const SystemSettingsPage = () => {
    const presetLogos = scanLogos()

    // Read server settings
    let serverSettings = {}
    const SETTINGS_FILE_PATH = path.join(process.cwd(), 'src/shared/data/system-settings.json')
    try {
        if (fs.existsSync(SETTINGS_FILE_PATH)) {
            serverSettings = JSON.parse(fs.readFileSync(SETTINGS_FILE_PATH, 'utf8'))
        }
    } catch (e) {
        console.error('Error reading server settings:', e)
    }

    return (
        <Box sx={{ p: 6 }}>
            <Grid container spacing={6}>
                <Grid size={{ xs: 12 }}>
                    <Typography variant='h4' sx={{ fontFamily: 'Quicksand, sans-serif' }}>System Settings</Typography>
                    <Typography variant='body1' sx={{ fontFamily: 'Quicksand, sans-serif' }}>Configure global system appearance and branding.</Typography>
                </Grid>
                <Grid size={{ xs: 12 }}>
                    <SystemSettingsClient presetLogos={presetLogos} serverSettings={serverSettings} />
                </Grid>
            </Grid>
        </Box>
    )
}

export default SystemSettingsPage
