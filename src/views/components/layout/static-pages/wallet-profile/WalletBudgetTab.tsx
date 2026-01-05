'use client';

import { PageContentProps } from '@/types';
import {
  Card,
  CardContent,
  Grid,
  Typography,
  Divider,
  LinearProgress,
  Box,
} from '@mui/material';

interface WalletBudgetTabProps {
  walletData: any;
  dictionary: PageContentProps['dictionary'];
  session: PageContentProps['session'];
  locale: PageContentProps['locale'];
}

const WalletBudgetTab = ({
  walletData,
  dictionary,
  session,
  locale,
}: WalletBudgetTabProps) => {
  const budgetUsed = walletData?.budgetUsed || 0;
  const budgetLimit = walletData?.budgetLimit || 100;
  const budgetPercentage = budgetLimit > 0 ? (budgetUsed / budgetLimit) * 100 : 0;

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

  return (
    <Card className="shadow-md" sx={{ borderRadius: 2 }}>
      <CardContent>
        <Typography variant="h6" sx={{ mb: 3, color: '#225087', fontWeight: 600 }}>
          {dictionary['wallet']?.budgetInfo || 'Budget Information'}
        </Typography>

        {/* Budget Progress */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" sx={labelStyle}>
              {dictionary['wallet']?.budgetUsage || 'Budget Usage'}
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {budgetPercentage.toFixed(1)}%
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={Math.min(budgetPercentage, 100)}
            sx={{
              height: 10,
              borderRadius: 5,
              backgroundColor: '#e0e0e0',
              '& .MuiLinearProgress-bar': {
                backgroundColor: budgetPercentage > 80 ? '#f44336' : budgetPercentage > 50 ? '#ff9800' : '#4caf50',
                borderRadius: 5,
              },
            }}
          />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
            <Typography variant="caption" color="text.secondary">
              {formatCurrency(budgetUsed)} {walletData?.currency || 'VND'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {formatCurrency(budgetLimit)} {walletData?.currency || 'VND'}
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ my: 3 }} />

        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="body2" sx={labelStyle}>
              {dictionary['wallet']?.dailyLimit || 'Daily Limit'}
            </Typography>
            <Typography variant="body1" sx={valueStyle}>
              {formatCurrency(walletData?.dailyLimit)} {walletData?.currency || 'VND'}
            </Typography>
            <Divider sx={{ my: 2 }} />

            <Typography variant="body2" sx={labelStyle}>
              {dictionary['wallet']?.weeklyLimit || 'Weekly Limit'}
            </Typography>
            <Typography variant="body1" sx={valueStyle}>
              {formatCurrency(walletData?.weeklyLimit)} {walletData?.currency || 'VND'}
            </Typography>
            <Divider sx={{ my: 2 }} />

            <Typography variant="body2" sx={labelStyle}>
              {dictionary['wallet']?.monthlyLimit || 'Monthly Limit'}
            </Typography>
            <Typography variant="body1" sx={valueStyle}>
              {formatCurrency(walletData?.monthlyLimit)} {walletData?.currency || 'VND'}
            </Typography>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="body2" sx={labelStyle}>
              {dictionary['wallet']?.transactionLimit || 'Transaction Limit'}
            </Typography>
            <Typography variant="body1" sx={valueStyle}>
              {formatCurrency(walletData?.transactionLimit)} {walletData?.currency || 'VND'}
            </Typography>
            <Divider sx={{ my: 2 }} />

            <Typography variant="body2" sx={labelStyle}>
              {dictionary['wallet']?.remainingBudget || 'Remaining Budget'}
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 500, color: '#4caf50' }}>
              {formatCurrency(budgetLimit - budgetUsed)} {walletData?.currency || 'VND'}
            </Typography>
            <Divider sx={{ my: 2 }} />

            <Typography variant="body2" sx={labelStyle}>
              {dictionary['wallet']?.budgetPeriod || 'Budget Period'}
            </Typography>
            <Typography variant="body1" sx={valueStyle}>
              {walletData?.budgetPeriod || 'Monthly'}
            </Typography>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

export default WalletBudgetTab;
