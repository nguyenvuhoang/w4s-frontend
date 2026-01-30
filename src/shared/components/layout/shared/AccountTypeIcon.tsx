

'use client'
import RealEstateAgentIcon from '@mui/icons-material/RealEstateAgent';
import SavingsIcon from '@mui/icons-material/Savings';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import CurrencyExchangeIcon from '@mui/icons-material/CurrencyExchange';

import { AccountsType } from '@shared/types/bankType';
import { getDictionary } from '@utils/getDictionary';
import { Box, Typography } from '@mui/material';
import { JSX } from 'react';

export const AccountTypeIcon = ({ type, dictionary }: { type: string | undefined; dictionary: Awaited<ReturnType<typeof getDictionary>> }) => {
    if (!type) {
        return null;
    }

    const accountype = type.trim().toUpperCase() as AccountsType;

    const accountname = dictionary['account']?.[accountype] || type;

    const typeIconMap: Record<string, { icon: JSX.Element; color: string }> = {
        FD: { icon: <AccountBalanceWalletIcon sx={{ color: '#ff9800', mr: 1 }} />, color: '#ff9800' }, // Term Deposit
        T: { icon: <AccountBalanceWalletIcon sx={{ color: '#ff9800', mr: 1 }} />, color: '#ff9800' }, // Term Deposit
        DD: { icon: <SavingsIcon sx={{ color: '#4caf50', mr: 1 }} />, color: '#4caf50' }, // Saving
        S: { icon: <SavingsIcon sx={{ color: '#4caf50', mr: 1 }} />, color: '#4caf50' }, // Saving Account
        LN: { icon: <RealEstateAgentIcon sx={{ color: '#1976d2', mr: 1 }} />, color: '#1976d2' }, // Loan
        L: { icon: <RealEstateAgentIcon sx={{ color: '#1976d2', mr: 1 }} />, color: '#1976d2' }, // Loan
        RV: { icon: <CurrencyExchangeIcon sx={{ color: '#1976d2', mr: 1 }} />, color: '#1976d2' }, // Revolving
        WAL: { icon: <AccountBalanceWalletIcon sx={{ color: '#9c27b0', mr: 1 }} />, color: '#9c27b0' } // Wallet
    };

    const { icon, color } = typeIconMap[type] || { icon: null, color: '#000' };

    return (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {icon}
            <Typography variant="body2" sx={{ color }}>
                {accountname}
            </Typography>
        </Box>
    );
};

