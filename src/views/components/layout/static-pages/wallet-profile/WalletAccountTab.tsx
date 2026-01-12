'use client';

import { PageContentProps } from '@/types';
import {
  Card,
  CardContent,
  Typography,
  Box,
  alpha,
  Chip,
  Paper,
  Grid,
  Divider,
} from '@mui/material';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import StarIcon from '@mui/icons-material/Star';
import CreditCardIcon from '@mui/icons-material/CreditCard';

interface AccountBalance {
  available_balance: number | null;
  balance: number | null;
  bonus_balance: number | null;
  locked_balance: number | null;
}

interface Account {
  id: number;
  wallet_id: string;
  account_number: string;
  account_type: string;
  account_type_caption: string;
  currency_code: string;
  is_primary: boolean;
  status: string;
  status_caption: string;
  balance: AccountBalance | null;
}

interface WalletAccountTabProps {
  walletData: any;
  dictionary: PageContentProps['dictionary'];
  session: PageContentProps['session'];
  locale: PageContentProps['locale'];
}

const WalletAccountTab = ({
  walletData,
  dictionary,
  session,
  locale,
}: WalletAccountTabProps) => {
  // Get accounts from first wallet
  const wallet = walletData?.wallets?.[0] || {};
  const accounts: Account[] = wallet?.accounts || [];

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
    color: '#215086',
    fontSize: '1rem',
  };

  // Format currency
  const formatCurrency = (value: number | null, currency: string = 'VND') => {
    if (value === null || value === undefined) return '-';
    return new Intl.NumberFormat('vi-VN').format(value) + ' ' + currency;
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'A':
      case 'ACTIVE':
        return 'success';
      case 'I':
      case 'INACTIVE':
        return 'default';
      case 'P':
      case 'PENDING':
        return 'warning';
      case 'B':
      case 'BLOCKED':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Card className="shadow-md" sx={{ borderRadius: 2 }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6" sx={{ color: '#225087', fontWeight: 600 }}>
            {dictionary['wallet']?.accountInfo || 'Linked Accounts'}
          </Typography>
          {accounts.length > 0 && (
            <Chip
              label={`${accounts.length} ${dictionary['wallet']?.accounts || 'Accounts'}`}
              color="primary"
              size="small"
            />
          )}
        </Box>

        {accounts.length === 0 ? (
          <Box
            sx={{
              textAlign: 'center',
              py: 8,
              px: 4,
            }}
          >
            <Box
              sx={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                bgcolor: alpha('#225087', 0.1),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 3,
              }}
            >
              <AccountBalanceIcon sx={{ fontSize: 40, color: '#225087' }} />
            </Box>
            <Typography variant="h6" sx={{ color: '#1a1a1a', mb: 1 }}>
              {dictionary['wallet']?.noAccounts || 'No Linked Accounts'}
            </Typography>
            <Typography variant="body2" sx={{ color: '#666', maxWidth: 400, mx: 'auto' }}>
              {dictionary['wallet']?.noAccountsDescription ||
                'You haven\'t linked any bank accounts to this wallet yet. Link your accounts to enable fund transfers.'}
            </Typography>
          </Box>
        ) : (
          <Grid container spacing={2}>
            {accounts.map((account, index) => (
              <Grid size={{ xs: 12, md: 6 }} key={account.id || index}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 2.5,
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: account.is_primary ? alpha('#225087', 0.3) : '#e0e0e0',
                    bgcolor: account.is_primary ? alpha('#225087', 0.03) : 'transparent',
                    position: 'relative',
                    transition: 'all 0.2s',
                    '&:hover': {
                      borderColor: '#225087',
                      boxShadow: '0 4px 12px rgba(34, 80, 135, 0.1)',
                    },
                  }}
                >
                  {/* Primary Badge */}
                  {account.is_primary && (
                    <Chip
                      icon={<StarIcon sx={{ fontSize: 14 }} />}
                      label={dictionary['wallet']?.primary || 'Primary'}
                      size="small"
                      color="primary"
                      sx={{
                        position: 'absolute',
                        top: 12,
                        right: 12,
                        height: 24,
                        '& .MuiChip-icon': { ml: 0.5 },
                      }}
                    />
                  )}

                  {/* Account Header */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Box
                      sx={{
                        width: 48,
                        height: 48,
                        borderRadius: 2,
                        bgcolor: alpha('#225087', 0.1),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <CreditCardIcon sx={{ fontSize: 24, color: '#225087' }} />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography
                        variant="body1"
                        sx={{
                          fontWeight: 600,
                          color: '#1a1a1a',
                          fontFamily: 'monospace',
                          letterSpacing: 1,
                        }}
                      >
                        {account.account_number}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#666' }}>
                        {account.account_type_caption || account.account_type}
                      </Typography>
                    </Box>
                  </Box>

                  <Divider sx={{ my: 2 }} />

                  {/* Account Details */}
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 6 }}>
                      <Typography variant="body2" sx={labelStyle}>
                        {dictionary['wallet']?.currency || 'Currency'}
                      </Typography>
                      <Typography variant="body1" sx={valueStyle}>
                        {account.currency_code || '-'}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                      <Typography variant="body2" sx={labelStyle}>
                        {dictionary['common']?.status || 'Status'}
                      </Typography>
                      <Chip
                        label={account.status_caption || account.status}
                        color={getStatusColor(account.status)}
                        size="small"
                        sx={{ height: 24 }}
                      />
                    </Grid>
                    {account.balance !== null && (
                      <Grid size={{ xs: 12 }}>
                        <Typography variant="body2" sx={labelStyle}>
                          {dictionary['wallet']?.balance || 'Balance'}
                        </Typography>
                        <Typography variant="body1" sx={{ ...valueStyle, color: '#4caf50' }}>
                          {formatCurrency(account.balance.available_balance, account.currency_code)}
                        </Typography>
                      </Grid>
                    )}
                  </Grid>
                </Paper>
              </Grid>
            ))}
          </Grid>
        )}
      </CardContent>
    </Card>
  );
};

export default WalletAccountTab;
