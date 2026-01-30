'use client'

import { getDictionary } from '@utils/getDictionary'
import {
    Box,
    Card,
    CardContent,
    Divider,
    FormControlLabel,
    Switch,
    Typography
} from '@mui/material'
import { Session } from 'next-auth'
import { useState } from 'react'

const NotificationConfigurationContent = ({ session, dictionary }: {
    session: Session | null
    dictionary: Awaited<ReturnType<typeof getDictionary>>
}) => {
    const [settings, setSettings] = useState({
        email: true,
        sms: false,
        push: true
    })
    const handleToggle = (key: keyof typeof settings) => {
        setSettings(prev => ({ ...prev, [key]: !prev[key] }))
    }
    return (
        <Box className="max-w mx-auto py-6 px-4 space-y-6">
            {/* Title */}
            <Box>
                <Typography variant="h4" className="font-semibold text-primary">{dictionary['common'].notificationconfiguration}</Typography>
                <Typography variant="body1" className="text-primary">
                    {dictionary['common'].notificationconfigurationdescription}
                </Typography>
            </Box>

            {/* Tabs */}
            <Card>
                <CardContent>
                    <Typography variant="h6" gutterBottom>
                        {dictionary['common'].notificationtypes}
                    </Typography>

                    <Divider sx={{ my: 2 }} />

                    <FormControlLabel
                        control={<Switch checked={settings.email} onChange={() => handleToggle('email')} />}
                        label={dictionary['common'].emailnotification}
                    />
                    <FormControlLabel
                        control={<Switch checked={settings.sms} onChange={() => handleToggle('sms')} />}
                        label={dictionary['common'].smsnotification}
                    />
                    <FormControlLabel
                        control={<Switch checked={settings.push} onChange={() => handleToggle('push')} />}
                        label={dictionary['common'].pushnotification}
                    />
                </CardContent>
            </Card>

        </Box>
    )
}

export default NotificationConfigurationContent

