/* eslint-disable react-hooks/exhaustive-deps */
'use client'

import TabPanel from '@/components/tab/tab-panel'
import { PageContentProps } from '@/types'
import { getDictionary } from '@/utils/getDictionary'
import ContentWrapper from '@/views/components/layout/content-wrapper'
import AutoAwesomeMosaicIcon from '@mui/icons-material/AutoAwesomeMosaic'
import { Box, Divider, Paper, Tab, Tabs, Typography } from '@mui/material'
import { Session } from 'next-auth'
import { useMemo, useState } from 'react'
import BankAccountInfo from './bank-account'
import ContractInfo from './contract-Info'
import CustomerInfo from './customer-info'
import UserAccountAssignment from './user-account'

// ⛳️ Contract is no longer a tab
type TabKey = 'customerInfo' | 'accountAndUser'

interface TabConfig {
    key: TabKey
    component: React.ComponentType<{
        contractdata: any
        dictionary: Awaited<ReturnType<typeof getDictionary>>
        session: Session | null
    }>
}

/** 
 * Wrapper tab that shows BankAccountInfo and UserAccountInfo together,
 * and lets them share data via lifted state.
 */
const CombinedAccountTab = ({
    contractdata,
    dictionary,
    session
}: {
    contractdata: any
    dictionary: Awaited<ReturnType<typeof getDictionary>>
    session: Session | null
}) => {
    // Shared state across the two sections
    const [syncedBankAccounts, setSyncedBankAccounts] = useState<any[]>([])

    // Example handlers to pass down:
    const handleAfterSync = (accounts: any[]) => {
        setSyncedBankAccounts(accounts ?? [])
    }

    // You can memo UI helpers if needed
    const hasSynced = useMemo(() => syncedBankAccounts?.length > 0, [syncedBankAccounts])

    const availableAccounts = useMemo(
        () => (syncedBankAccounts.length ? syncedBankAccounts : (contractdata?.contractaccount ?? [])),
        [syncedBankAccounts, contractdata?.contractaccount]
    )
    return (
        <Box sx={{ display: 'grid', gap: 2 }}>
            {/* Section 1: Bank accounts (sync) */}
            <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
                <Box sx={{ px: 2, py: 1.25, bgcolor: '#225087', color: 'white', fontWeight: 600 }}>
                    {dictionary['contract']?.bankAccountInfo ?? 'Bank Account Information'}
                </Box>
                <Box sx={{ p: 2 }}>
                    <BankAccountInfo
                        contractdata={contractdata}
                        dictionary={dictionary}
                        session={session}
                        onSynced={handleAfterSync}
                    />
                </Box>
            </Paper>

            <Divider />

            {/* Section 2: Assign accounts to user */}
            <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
                <Box sx={{ px: 2, py: 1.25, bgcolor: '#225087', color: 'white', fontWeight: 600 }}>
                    {dictionary['contract']?.userAccountInfo ?? 'User Account Information'}
                </Box>
                <Box sx={{ p: 2 }}>
                    {!hasSynced && (
                        <Typography variant="body2" sx={{ mb: 2, opacity: 0.8 }}>
                            {/* Optional hint */}
                            {dictionary['common']?.hintSyncFirst ?? 'Tip: Sync bank accounts first to quickly pick accounts for assignment.'}
                        </Typography>
                    )}
                    <UserAccountAssignment
                        contractdata={contractdata}
                        dictionary={dictionary}
                        session={session}
                        availableAccounts={availableAccounts}
                    />
                </Box>
            </Paper>
        </Box>
    )
}

const tabConfig: TabConfig[] = [
    { key: 'customerInfo', component: CustomerInfo },
    { key: 'accountAndUser', component: CombinedAccountTab }
]

const ContractManagementModifyContent = ({ dictionary, session, locale, contractdata }: PageContentProps) => {
    const [tabValue, setTabValue] = useState(0)

    const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
        setTabValue(newValue)
    }

    return (
        <ContentWrapper
            title={`${dictionary['contract'].title} - ${dictionary['common'].modify}`}
            description={dictionary['contract'].description}
            icon={<AutoAwesomeMosaicIcon sx={{ fontSize: 40, color: '#225087' }} />}
            dataref={contractdata?.contractnumber}
            dictionary={dictionary}
        >
            <Box sx={{ mt: 2, width: '100%' }} className="mx-auto">
                {/* 🔹 Contract box with header */}
                <Paper variant="outlined" sx={{ mb: 2, borderRadius: 2, overflow: 'hidden' }}>
                    <Box
                        sx={{
                            px: 2, py: 1.25,
                            bgcolor: '#225087',
                            color: 'white',
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1
                        }}
                    >
                        {dictionary['contract']?.contractInfo ?? 'Contract Information'}
                    </Box>
                    <Box sx={{ p: 2 }}>
                        <ContractInfo contractdata={contractdata} />
                    </Box>
                </Paper>

                {/* 🔹 Tabs area wrapped by a bordered box */}
                <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
                    <Tabs
                        value={tabValue}
                        onChange={handleTabChange}
                        className="rounded-t-lg"
                        slotProps={{ indicator: { style: { display: 'none' } } }}
                        sx={{
                            backgroundColor: '#225087',
                            color: 'white',
                            '& .MuiTab-root': { color: 'white', fontWeight: 500, textTransform: 'none' },
                            '& .Mui-selected': { backgroundColor: '#1780AC', color: 'white !important' }
                        }}
                    >
                        {tabConfig.map((tab) => (
                            <Tab
                                key={tab.key}
                                label={
                                    // prefer localized label if exists
                                    (dictionary['contract'] as any)[tab.key] ||
                                    (tab.key === 'accountAndUser' ? (dictionary['common']?.accounts ?? 'Accounts') : tab.key)
                                }
                                disableRipple
                            />
                        ))}
                    </Tabs>

                    {/* Tab content */}
                    <Box sx={{ p: 2 }}>
                        {tabConfig.map((tab, index) => {
                            const Component = tab.component
                            return (
                                <TabPanel key={tab.key} value={tabValue} index={index}>
                                    <Component contractdata={contractdata} dictionary={dictionary} session={session} />
                                </TabPanel>
                            )
                        })}
                    </Box>
                </Paper>
            </Box>
        </ContentWrapper>
    )
}

export default ContractManagementModifyContent
