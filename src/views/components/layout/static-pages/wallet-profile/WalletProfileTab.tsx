'use client';

import { PageContentProps } from '@/types';
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
    color: '#1a1a1a',
    fontSize: '1rem',
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
              {walletData?.walletName || 'Wallet Name'}
            </Typography>
            <Typography variant="body2" sx={{ color: '#666666' }}>
              {walletData?.walletId || 'Wallet ID'}
            </Typography>
          </Box>
          <Chip
            label={walletData?.status || 'Active'}
            color={walletData?.status === 'Active' ? 'success' : 'default'}
            size="medium"
          />
        </Box>

        <Divider sx={{ mb: 3 }} />

        {/* Profile Details */}
        <Typography variant="h6" sx={{ mb: 3, color: '#225087', fontWeight: 600 }}>
          {dictionary['wallet']?.profileInfo || 'Profile Information'}
        </Typography>

        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="body2" sx={labelStyle}>
              {dictionary['wallet']?.ownerName || 'Owner Name'}
            </Typography>
            <Typography variant="body1" sx={valueStyle}>
              {walletData?.ownerName || '-'}
            </Typography>
            <Divider sx={{ my: 2 }} />

            <Typography variant="body2" sx={labelStyle}>
              {dictionary['wallet']?.phoneNumber || 'Phone Number'}
            </Typography>
            <Typography variant="body1" sx={valueStyle}>
              {walletData?.phoneNumber || '-'}
            </Typography>
            <Divider sx={{ my: 2 }} />

            <Typography variant="body2" sx={labelStyle}>
              {dictionary['wallet']?.email || 'Email'}
            </Typography>
            <Typography variant="body1" sx={valueStyle}>
              {walletData?.email || '-'}
            </Typography>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="body2" sx={labelStyle}>
              {dictionary['wallet']?.identityNumber || 'Identity Number'}
            </Typography>
            <Typography variant="body1" sx={valueStyle}>
              {walletData?.identityNumber || '-'}
            </Typography>
            <Divider sx={{ my: 2 }} />

            <Typography variant="body2" sx={labelStyle}>
              {dictionary['wallet']?.address || 'Address'}
            </Typography>
            <Typography variant="body1" sx={valueStyle}>
              {walletData?.address || '-'}
            </Typography>
            <Divider sx={{ my: 2 }} />

            <Typography variant="body2" sx={labelStyle}>
              {dictionary['wallet']?.createdAt || 'Created At'}
            </Typography>
            <Typography variant="body1" sx={valueStyle}>
              {walletData?.createdAt || '-'}
            </Typography>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

export default WalletProfileTab;
