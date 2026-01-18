/* eslint-disable react-hooks/exhaustive-deps */
'use client'

import TabPanel from '@/components/tab/tab-panel';
import { PageContentProps } from '@/types';
import ContentWrapper from '@features/dynamicform/components/layout/content-wrapper';
import AutoAwesomeMosaicIcon from '@mui/icons-material/AutoAwesomeMosaic';
import {
    Box,
    Tab,
    Tabs
} from '@mui/material';
import { useState } from 'react';
import BankAccountInfo from './bank-account';
import ContractInfo from './contract-Info';
import CustomerInfo from './customer-info';
import { getDictionary } from '@/utils/getDictionary';
import UserAccountInfo from './user-account';
import { Session } from 'next-auth';
import { Locale } from '@/configs/i18n';
import GLAccountInfo from './gl-account';
import KYCInfo from './kyc-info';

interface ContractDictionary {
    title: string;
    description: string;
    contractInfo: string;
    customerInfo: string;
    bankAccountInfo: string;
    userAccountInfo: string;
    glAccountInfo: string;
    kycinformation: string;
}

type TabKey = 'contractInfo' | 'customerInfo' | 'bankAccountInfo' | 'userAccountInfo' | 'glAccountInfo' | 'kycinformation';
interface TabConfig {
    key: TabKey;
    component: React.ComponentType<{ contractdata: any, dictionary: Awaited<ReturnType<typeof getDictionary>>; session: Session | null; locale?: Locale }>;
    showCondition?: (contractdata: any) => boolean;
}

const tabConfig: TabConfig[] = [
    { key: 'contractInfo', component: ContractInfo },
    { key: 'customerInfo', component: CustomerInfo },
    {
        key: 'kycinformation',
        component: KYCInfo,
        showCondition: (contractdata) => contractdata?.contractlevelid === 1 || contractdata?.contractlevelid === '1'
    },
    { key: 'bankAccountInfo', component: BankAccountInfo },
    { key: 'userAccountInfo', component: UserAccountInfo },
    { key: 'glAccountInfo', component: GLAccountInfo }

];

const ContractManagementViewContent = ({ dictionary, session, locale, contractdata }: PageContentProps) => {
    const [tabValue, setTabValue] = useState(0);

    // Filter tabs based on showCondition
    const visibleTabs = tabConfig.filter(tab =>
        !tab.showCondition || tab.showCondition(contractdata)
    );

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setTabValue(newValue);
    };

    const renderTabs = () => (
        <Tabs
            value={tabValue}
            onChange={handleTabChange}
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
                },
                '& .Mui-selected': {
                    backgroundColor: '#1780AC',
                    color: 'white !important',
                },
            }}
        >
            {visibleTabs.map((tab, index) => (
                <Tab
                    key={index}
                    label={(dictionary['contract'] as unknown as ContractDictionary)[tab.key] || tab.key}
                    disableRipple
                />
            ))}
        </Tabs>
    );


    const renderTabPanels = () => (
        visibleTabs.map((tab, index) => {
            const Component = tab.component;
            return (
                <TabPanel key={index} value={tabValue} index={index}>
                    <Component contractdata={contractdata} dictionary={dictionary} session={session} />
                </TabPanel>
            );
        })
    );

    return (
        <ContentWrapper
            title={`${dictionary['contract'].title} - ${dictionary['common'].view}`}
            description={dictionary['contract'].description}
            icon={<AutoAwesomeMosaicIcon sx={{ fontSize: 40, color: '#225087' }} />}
            dataref={contractdata?.contractnumber}
            dictionary={dictionary}
        >
            <Box sx={{ mt: 2, width: '100%' }} className="mx-auto">
                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                    {renderTabs()}
                </Box>

                {renderTabPanels()}
            </Box>
        </ContentWrapper>
    );
};

export default ContractManagementViewContent;
