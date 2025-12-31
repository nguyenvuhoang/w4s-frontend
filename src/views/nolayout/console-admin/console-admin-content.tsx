'use client'

import { getDictionary } from '@/utils/getDictionary'
import EmailSetting from '@/views/components/console-admin/EmailSetting'
import LocalStringResource from '@/views/components/console-admin/LocalStringResource'
import Settings from '@/views/components/console-admin/Settings'
import {
    Box,
    Paper,
    Tab,
    Tabs,
    Typography
} from '@mui/material'
import { Session } from 'next-auth'
import { useState } from 'react'

const ConsoleAdminContent = ({ session, dictionary }: {
    session: Session | null
    dictionary: Awaited<ReturnType<typeof getDictionary>>
}) => {
    const [activeTab, setActiveTab] = useState(0)

    const tabs = [
        { label: 'Settings', component: <Settings session={session} dictionary={dictionary} /> },
        { label: 'Local String Resource', component: <LocalStringResource /> },
        { label: 'Email Setting', component: <EmailSetting session={session} dictionary={dictionary} /> }
    ].filter(Boolean)

    return (
        <Box className="max-w mx-auto py-6 px-4 space-y-6">
            {/* Title */}
            <Box>
                <Typography variant="h4" className="font-semibold text-primary">Server Admin Console</Typography>
                <Typography variant="body1" className="text-primary">
                    Manage your instance level configurations.
                </Typography>
            </Box>

            {/* Tabs */}
            <Paper elevation={2} className="rounded-xl">
                <Tabs
                    value={activeTab}
                    onChange={(_, newValue) => setActiveTab(newValue)}
                    variant="scrollable"
                    scrollButtons="auto"
                    textColor="inherit"
                    sx={{
                        backgroundColor: 'primary.main',
                        color: 'white',
                        '& .MuiTabs-indicator': {
                            backgroundColor: '#ffffff',
                            height: 4,
                            borderTopLeftRadius: 12,
                            borderTopRightRadius: 12,
                        },
                        borderTopLeftRadius: 12,
                        borderTopRightRadius: 12,
                    }}
                >
                    {tabs.map((tab, index) => (
                        <Tab
                            key={index}
                            label={tab.label}
                            sx={{
                                color: 'white',
                                '&.Mui-selected': {
                                    fontWeight: 'bold',
                                    backgroundColor: 'primary.dark',
                                    borderTopLeftRadius: 12,
                                    borderTopRightRadius: 12,
                                }
                            }}
                        />
                    ))}
                </Tabs>
            </Paper>

            {/* Tab Content */}
            <Paper elevation={3} className="rounded-xl min-h-[400px]">
                {tabs[activeTab].component}
            </Paper>
        </Box>
    )
}

export default ConsoleAdminContent
