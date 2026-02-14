'use client'

import { Locale } from '@/configs/i18n';
import { UserAccount, UserMobileAccount } from '@shared/types/bankType';
import { PageData, Role } from '@shared/types/systemTypes';
import { getDictionary } from '@utils/getDictionary';
import { Box, Tab, Tabs } from '@mui/material';
import { Session } from 'next-auth';
import React, { useState } from 'react';
import InvokeApprove from './invoke-approve';
import InvokeLimit from './invoke-limit';
import MobileUserAssignment from './mobile-user-assignment';
import UserAssignment from './user-assignment';

// Component Ä‘á»ƒ hiá»ƒn thá»‹ ná»™i dung cá»§a má»—i tab
interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

function TabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`tabpanel-${index}`}
            aria-labelledby={`tab-${index}`}
            {...other}
        >
            {value === index && (
                <Box sx={{ height: '100%' }}>
                    {children}
                </Box>
            )}
        </div>
    );
}

type Props = {
    locale: Locale
    session: Session | null;
    dictionary: Awaited<ReturnType<typeof getDictionary>>;
    role: PageData<Role>;
    userdata: PageData<UserAccount>;
    mobileuserdata: PageData<UserMobileAccount>;
};

const RoleProfileGeneric = ({ locale, session, dictionary, role, userdata, mobileuserdata }: Props) => {
    const [value, setValue] = useState(0);
    const [subValue, setSubValue] = useState(0);
    const subTabs = ['Invoke-Approve', 'User Assignment', 'Mobile User Assignment', 'Invoke limit'];

    const handleChange = (event: React.SyntheticEvent, newValue: number) => {
        setValue(newValue);
        setSubValue(0);
    };

    const handleSubChange = (event: React.SyntheticEvent, newSubValue: number) => {
        setSubValue(newSubValue);
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', p: 2 }}>

            <Box sx={{
                flex: 1,
                width: '100%',
                maxWidth: {
                    xs: '100%',
                    sm: '90%',
                    md: '1200px',
                    lg: '1400px',
                    xl: '1980px',
                },
                margin: '0 auto',
                px: { xs: 1, sm: 2 }
            }}>
                <TabPanel value={value} index={value}>
                    <Box
                        sx={{
                            border: '1px solid #225087',
                            borderRadius: '4px',
                            p: 2,
                            width: '100%',
                            height: 'calc(100% - 16px)',
                            boxSizing: 'border-box',
                            overflow: 'auto',
                        }}
                    >
                        {/* Tab nhá» bÃªn trong */}
                        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                            <Tabs
                                value={subValue}
                                onChange={handleSubChange}
                                aria-label="sub service tabs"
                                slotProps={{
                                    indicator: {
                                        style: { backgroundColor: '#225087' }
                                    }
                                }}
                            >
                                {subTabs.map((subTab, subIndex) => (
                                    <Tab
                                        key={subIndex}
                                        label={subTab}
                                        id={`subtab-${subIndex}`}
                                        aria-controls={`subtabpanel-${subIndex}`}
                                        sx={{
                                            color: '#225087',
                                            fontSize: '14px',
                                            '&.Mui-selected': { color: '#225087', fontWeight: 'bold' },
                                        }}
                                    />
                                ))}
                            </Tabs>
                        </Box>

                        {subTabs.map((subTab, subIndex) => (
                            <TabPanel key={subIndex} value={subValue} index={subIndex}>
                                {subTab === 'Invoke-Approve' ? (
                                    <InvokeApprove
                                        locale={locale}
                                        session={session}
                                        dictionary={dictionary}
                                        tabvalue={value}
                                    />
                                ) : subTab === 'User Assignment' ? (
                                    <UserAssignment
                                        dictionary={dictionary}
                                        role={role}
                                        userdata={userdata}
                                        session={session}
                                    />
                                ) : subTab === 'Mobile User Assignment' ? (
                                    <MobileUserAssignment
                                        dictionary={dictionary}
                                        role={role}
                                        userdata={mobileuserdata}
                                        session={session}
                                    />
                                ) : (
                                    <InvokeLimit
                                        roles={role}
                                    />
                                )}
                            </TabPanel>
                        ))}
                    </Box>
                </TabPanel>
            </Box>
        </Box>
    );
};

export default RoleProfileGeneric;
