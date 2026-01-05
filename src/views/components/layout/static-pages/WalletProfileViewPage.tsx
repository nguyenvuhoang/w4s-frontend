'use client';

import TabPanel from '@/components/tab/tab-panel';
import LoadingSubmit from '@/components/LoadingSubmit';
import { PageContentProps } from '@/types';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import {
    Box,
    Tab,
    Tabs,
} from '@mui/material';
import { useState } from 'react';
import ContentWrapper from '../content-wrapper';

// Import tab components
import {
    WalletContractTab,
    WalletProfileTab,
    WalletCategoryTab,
    WalletBudgetTab,
    WalletAccountTab,
    WalletBalanceTab,
    WalletTransactionTab,
} from './wallet-profile';

// Tab configuration
type TabKey = 'contract' | 'profile' | 'category' | 'budget' | 'account' | 'balance' | 'transaction';

interface TabConfig {
    key: TabKey;
    labelKey: string;
    defaultLabel: string;
    component: React.ComponentType<{
        walletData: any;
        dictionary: PageContentProps['dictionary'];
        session: PageContentProps['session'];
        locale: PageContentProps['locale'];
    }>;
}

const tabConfig: TabConfig[] = [
    { key: 'contract', labelKey: 'walletContract', defaultLabel: 'Wallet Contract', component: WalletContractTab },
    { key: 'profile', labelKey: 'walletProfile', defaultLabel: 'Wallet Profile', component: WalletProfileTab },
    { key: 'category', labelKey: 'walletCategory', defaultLabel: 'Wallet Category', component: WalletCategoryTab },
    { key: 'budget', labelKey: 'walletBudget', defaultLabel: 'Wallet Budget', component: WalletBudgetTab },
    { key: 'account', labelKey: 'walletAccount', defaultLabel: 'Wallet Account', component: WalletAccountTab },
    { key: 'balance', labelKey: 'walletBalance', defaultLabel: 'Wallet Balance', component: WalletBalanceTab },
    { key: 'transaction', labelKey: 'walletTransaction', defaultLabel: 'Wallet Transaction', component: WalletTransactionTab },
];

/**
 * WalletProfileViewPage - Static page component for WalletProfileView form_code
 * 
 * This is a static implementation that replaces the dynamic renderer
 * when form_code === 'WalletProfileView'
 */
const WalletProfileViewPage = ({
    dictionary,
    formdata,
    id,
    locale,
    session,
    dataview
}: PageContentProps) => {
    const [loading, setLoading] = useState(false);
    const [tabValue, setTabValue] = useState(0);

    // Extract data from formdata if available
    const info = formdata?.form_design_detail?.info;
    // Extract wallet data from formdata
    const walletData = (dataview as any) || {};
    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setTabValue(newValue);
    };

    const getTabLabel = (tab: TabConfig) => {
        return (dictionary['wallet'] as any)?.[tab.labelKey] || tab.defaultLabel;
    };

    return (
        <Box className="relative">
            {loading && (
                <LoadingSubmit loadingtext={dictionary['common'].loading} />
            )}

            <ContentWrapper
                title={`${info?.lang_form?.[locale] ?? 'Wallet Profile'} - ${dictionary['common'].view}`}
                description={((info as any)?.des as Record<string, string>)?.[locale] || ''}
                icon={<AccountBalanceWalletIcon sx={{ fontSize: 40, color: '#225087' }} />}
                dataref={id}
                dictionary={dictionary}
            >
                <Box sx={{ mt: 2, width: '100%' }} className="mx-auto">
                    {/* Tabs Header */}
                    <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                        <Tabs
                            value={tabValue}
                            onChange={handleTabChange}
                            variant="scrollable"
                            scrollButtons="auto"
                            className="rounded-t-lg"
                            slotProps={{
                                indicator: { style: { display: 'none' } }
                            }}
                            sx={{
                                backgroundColor: '#225087',
                                color: 'white',
                                '& .MuiTab-root': {
                                    color: 'white',
                                    fontWeight: 500,
                                    textTransform: 'none',
                                    minWidth: 120,
                                },
                                '& .Mui-selected': {
                                    backgroundColor: '#1780AC',
                                    color: 'white !important',
                                },
                            }}
                        >
                            {tabConfig.map((tab, index) => (
                                <Tab
                                    key={tab.key}
                                    label={getTabLabel(tab)}
                                    disableRipple
                                />
                            ))}
                        </Tabs>
                    </Box>

                    {/* Tab Panels */}
                    {tabConfig.map((tab, index) => {
                        const Component = tab.component;
                        return (
                            <TabPanel key={tab.key} value={tabValue} index={index}>
                                <Component
                                    walletData={walletData}
                                    dictionary={dictionary}
                                    session={session}
                                    locale={locale}
                                />
                            </TabPanel>
                        );
                    })}
                </Box>
            </ContentWrapper>
        </Box>
    );
};

export default WalletProfileViewPage;
