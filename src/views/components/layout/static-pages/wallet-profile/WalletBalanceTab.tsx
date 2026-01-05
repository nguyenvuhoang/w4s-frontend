'use client';

import { PageContentProps } from '@/types';
import {
  Card,
  CardContent,
  Grid,
  Typography,
  Divider,
  Box,
  Paper,
} from '@mui/material';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';

interface WalletBalanceTabProps {
  walletData: any;
  dictionary: PageContentProps['dictionary'];
  session: PageContentProps['session'];
  locale: PageContentProps['locale'];
}

const WalletBalanceTab = ({
  walletData,
  dictionary,
  session,
  locale,
}: WalletBalanceTabProps) => {
  const labelStyle = {
    color: '#666666',
    fontSize: '0.75rem',
    fontWeight: 500,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
    mb: 0.5,
  };

  const valueStyle = {
    fontWeight: 600,
    color: '#1a1a1a',
    fontSize: '1rem',
  };

  const formatCurrency = (value: number | string) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat('vi-VN').format(num || 0);
  };

  const balanceChange = walletData?.balanceChange || 0;
  const isPositive = balanceChange >= 0;

  return (
    <Card className="shadow-md" sx={{ borderRadius: 2 }}>
      <CardContent>
        {/* Balance Overview */}
        <Box sx={{ mb: 4 }}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              background: 'linear-gradient(135deg, #225087 0%, #1780AC 100%)',
              borderRadius: 2,
              color: 'white',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <AccountBalanceWalletIcon sx={{ fontSize: 40 }} />
              <Typography variant="h6">
                {dictionary['wallet']?.currentBalance || 'Current Balance'}
              </Typography>
            </Box>
            <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
              {formatCurrency(walletData?.currentBalance)} {walletData?.currency || 'VND'}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {isPositive ? (
                <TrendingUpIcon sx={{ color: '#4caf50' }} />
              ) : (
                <TrendingDownIcon sx={{ color: '#f44336' }} />
              )}
              <Typography variant="body2" sx={{ color: isPositive ? '#4caf50' : '#f44336' }}>
                {isPositive ? '+' : ''}{formatCurrency(balanceChange)} ({walletData?.balanceChangePercent || '0'}%)
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>
                {dictionary['wallet']?.sinceLastMonth || 'since last month'}
              </Typography>
            </Box>
          </Paper>
        </Box>

        <Typography variant="h6" sx={{ mb: 3, color: '#225087', fontWeight: 600 }}>
          {dictionary['wallet']?.balanceDetails || 'Balance Details'}
        </Typography>

        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="body2" sx={labelStyle}>
              {dictionary['wallet']?.availableBalance || 'Available Balance'}
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 500, color: '#4caf50' }}>
              {formatCurrency(walletData?.availableBalance)} {walletData?.currency || 'VND'}
            </Typography>
            <Divider sx={{ my: 2 }} />

            <Typography variant="body2" sx={labelStyle}>
              {dictionary['wallet']?.pendingBalance || 'Pending Balance'}
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 500, color: '#ff9800' }}>
              {formatCurrency(walletData?.pendingBalance)} {walletData?.currency || 'VND'}
            </Typography>
            <Divider sx={{ my: 2 }} />

            <Typography variant="body2" sx={labelStyle}>
              {dictionary['wallet']?.blockedBalance || 'Blocked Balance'}
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 500, color: '#f44336' }}>
              {formatCurrency(walletData?.blockedBalance)} {walletData?.currency || 'VND'}
            </Typography>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="body2" sx={labelStyle}>
              {dictionary['wallet']?.totalDeposit || 'Total Deposit'}
            </Typography>
            <Typography variant="body1" sx={valueStyle}>
              {formatCurrency(walletData?.totalDeposit)} {walletData?.currency || 'VND'}
            </Typography>
            <Divider sx={{ my: 2 }} />

            <Typography variant="body2" sx={labelStyle}>
              {dictionary['wallet']?.totalWithdrawal || 'Total Withdrawal'}
            </Typography>
            <Typography variant="body1" sx={valueStyle}>
              {formatCurrency(walletData?.totalWithdrawal)} {walletData?.currency || 'VND'}
            </Typography>
            <Divider sx={{ my: 2 }} />

            <Typography variant="body2" sx={labelStyle}>
              {dictionary['wallet']?.lastUpdated || 'Last Updated'}
            </Typography>
            <Typography variant="body1" sx={valueStyle}>
              {walletData?.lastUpdated || '-'}
            </Typography>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

export default WalletBalanceTab;
