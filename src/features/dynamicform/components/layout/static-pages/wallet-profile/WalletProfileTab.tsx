'use client';

import { PageContentProps } from '@/types';
import { formatDateTime } from '@/utils/formatDateTime';
import {
  Avatar,
  Box,
  Card,
  CardContent,
  Chip,
  Grid,
  Typography,
  Divider,
} from '@mui/material';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';

interface WalletProfileTabProps {
  walletData: any;
  dictionary: PageContentProps['dictionary'];
  session: PageContentProps['session'];
  locale: PageContentProps['locale'];
}

const WalletProfileTab = ({
  walletData,
  dictionary,
  session,
  locale,
}: WalletProfileTabProps) => {
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

  // Get first wallet from wallets array
  const wallet = walletData?.wallets?.[0] || {};
  const contract = walletData?.contract || {};

  // Helper to get status color
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
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'A':
        return 'Active';
      case 'I':
        return 'Inactive';
      case 'P':
        return 'Pending';
      default:
        return status || '-';
    }
  };

  return (
    <Card className="shadow-md" sx={{ borderRadius: 2 }}>
      <CardContent>
        {/* Profile Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 4 }}>
          <Avatar sx={{ bgcolor: '#225087', width: 72, height: 72 }}>
            <AccountBalanceWalletIcon sx={{ fontSize: 36 }} />
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h5" sx={{ fontWeight: 600, color: '#1a1a1a' }}>
              {wallet?.wallet_name || 'Wallet Name'}
            </Typography>
            <Typography variant="body2" sx={{ color: '#666666', fontFamily: 'monospace' }}>
              {wallet?.wallet_id || 'Wallet ID'}
            </Typography>
          </Box>
          <Chip
            label={getStatusLabel(wallet?.status)}
            color={getStatusColor(wallet?.status)}
            size="medium"
          />
        </Box>

        <Divider sx={{ mb: 3 }} />

        {/* Profile Details */}
        <Typography variant="h6" sx={{ mb: 3, color: '#225087', fontWeight: 600 }}>
          {dictionary['wallet']?.profileInfo || 'Wallet Information'}
        </Typography>

        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="body2" sx={labelStyle}>
              {dictionary['wallet']?.walletType || 'Wallet Type'}
            </Typography>
            <Typography variant="body1" sx={valueStyle}>
              {wallet?.wallet_type_caption || wallet?.wallet_type || '-'}
            </Typography>
            <Divider sx={{ my: 2 }} />

            <Typography variant="body2" sx={labelStyle}>
              {dictionary['wallet']?.userCode || 'User Code'}
            </Typography>
            <Typography variant="body1" sx={valueStyle}>
              {wallet?.user_code || '-'}
            </Typography>
            <Divider sx={{ my: 2 }} />

            <Typography variant="body2" sx={labelStyle}>
              {dictionary['wallet']?.defaultCurrency || 'Default Currency'}
            </Typography>
            <Typography variant="body1" sx={valueStyle}>
              {wallet?.default_currency || '-'}
            </Typography>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="body2" sx={labelStyle}>
              {dictionary['wallet']?.contractNumber || 'Contract Number'}
            </Typography>
            <Typography variant="body1" sx={{ ...valueStyle, fontFamily: 'monospace', fontSize: '0.875rem' }}>
              {wallet?.contract_number || '-'}
            </Typography>
            <Divider sx={{ my: 2 }} />

            <Typography variant="body2" sx={labelStyle}>
              {dictionary['wallet']?.createdAt || 'Created At'}
            </Typography>
            <Typography variant="body1" sx={valueStyle}>
              {formatDateTime(wallet?.created_on_utc) || '-'}
            </Typography>
            <Divider sx={{ my: 2 }} />

            <Typography variant="body2" sx={labelStyle}>
              {dictionary['wallet']?.updatedAt || 'Updated At'}
            </Typography>
            <Typography variant="body1" sx={valueStyle}>
              {formatDateTime(wallet?.updated_on_utc) || '-'}
            </Typography>
          </Grid>
        </Grid>

        {/* Statistics */}
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" sx={{ mb: 2, color: '#225087', fontWeight: 600 }}>
            {dictionary['wallet']?.statistics || 'Statistics'}
          </Typography>
          <Grid container spacing={2}>
            <Grid size={{ xs: 6, md: 3 }}>
              <Box sx={{ p: 2, bgcolor: '#f5f5f5', borderRadius: 2, textAlign: 'center' }}>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#225087' }}>
                  {wallet?.categories?.length || 0}
                </Typography>
                <Typography variant="body2" sx={{ color: '#666' }}>
                  {dictionary['wallet']?.categories || 'Categories'}
                </Typography>
              </Box>
            </Grid>
            <Grid size={{ xs: 6, md: 3 }}>
              <Box sx={{ p: 2, bgcolor: '#f5f5f5', borderRadius: 2, textAlign: 'center' }}>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#225087' }}>
                  {wallet?.accounts?.length || 0}
                </Typography>
                <Typography variant="body2" sx={{ color: '#666' }}>
                  {dictionary['wallet']?.accounts || 'Accounts'}
                </Typography>
              </Box>
            </Grid>
            <Grid size={{ xs: 6, md: 3 }}>
              <Box sx={{ p: 2, bgcolor: '#f5f5f5', borderRadius: 2, textAlign: 'center' }}>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#225087' }}>
                  {wallet?.budgets?.length || 0}
                </Typography>
                <Typography variant="body2" sx={{ color: '#666' }}>
                  {dictionary['wallet']?.budgets || 'Budgets'}
                </Typography>
              </Box>
            </Grid>
            <Grid size={{ xs: 6, md: 3 }}>
              <Box sx={{ p: 2, bgcolor: '#f5f5f5', borderRadius: 2, textAlign: 'center' }}>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#225087' }}>
                  {wallet?.goals?.length || 0}
                </Typography>
                <Typography variant="body2" sx={{ color: '#666' }}>
                  {dictionary['wallet']?.goals || 'Goals'}
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </CardContent>
    </Card>
  );
};

export default WalletProfileTab;

