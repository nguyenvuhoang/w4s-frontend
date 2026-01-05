'use client';

import { PageContentProps } from '@/types';
import {
  Card,
  CardContent,
  Grid,
  Typography,
  Divider,
  Chip,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';

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
  const linkedAccounts = walletData?.linkedAccounts || [];

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
        <Typography variant="h6" sx={{ mb: 3, color: '#225087', fontWeight: 600 }}>
          {dictionary['wallet']?.accountInfo || 'Account Information'}
        </Typography>

        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="body2" sx={labelStyle}>
              {dictionary['wallet']?.accountNumber || 'Account Number'}
            </Typography>
            <Typography variant="body1" sx={valueStyle}>
              {walletData?.accountNumber || '-'}
            </Typography>
            <Divider sx={{ my: 2 }} />

            <Typography variant="body2" sx={labelStyle}>
              {dictionary['wallet']?.accountName || 'Account Name'}
            </Typography>
            <Typography variant="body1" sx={valueStyle}>
              {walletData?.accountName || '-'}
            </Typography>
            <Divider sx={{ my: 2 }} />

            <Typography variant="body2" sx={labelStyle}>
              {dictionary['wallet']?.accountType || 'Account Type'}
            </Typography>
            <Typography variant="body1" sx={valueStyle}>
              {walletData?.accountType || '-'}
            </Typography>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="body2" sx={labelStyle}>
              {dictionary['wallet']?.bankName || 'Bank Name'}
            </Typography>
            <Typography variant="body1" sx={valueStyle}>
              {walletData?.bankName || '-'}
            </Typography>
            <Divider sx={{ my: 2 }} />

            <Typography variant="body2" sx={labelStyle}>
              {dictionary['wallet']?.branchName || 'Branch Name'}
            </Typography>
            <Typography variant="body1" sx={valueStyle}>
              {walletData?.branchName || '-'}
            </Typography>
            <Divider sx={{ my: 2 }} />

            <Typography variant="body2" sx={labelStyle}>
              {dictionary['wallet']?.accountStatus || 'Account Status'}
            </Typography>
            <Chip
              label={walletData?.accountStatus || 'Active'}
              color={walletData?.accountStatus === 'Active' ? 'success' : 'default'}
              size="small"
            />
          </Grid>
        </Grid>

        {/* Linked Accounts Table */}
        {linkedAccounts.length > 0 && (
          <Box sx={{ mt: 4 }}>
            <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
              <AccountBalanceIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              {dictionary['wallet']?.linkedAccounts || 'Linked Accounts'}
            </Typography>
            
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                    <TableCell>{dictionary['wallet']?.accountNumber || 'Account Number'}</TableCell>
                    <TableCell>{dictionary['wallet']?.bankName || 'Bank Name'}</TableCell>
                    <TableCell>{dictionary['wallet']?.accountType || 'Type'}</TableCell>
                    <TableCell>{dictionary['common']?.status || 'Status'}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {linkedAccounts.map((account: any, index: number) => (
                    <TableRow key={index}>
                      <TableCell>{account.accountNumber || '-'}</TableCell>
                      <TableCell>{account.bankName || '-'}</TableCell>
                      <TableCell>{account.accountType || '-'}</TableCell>
                      <TableCell>
                        <Chip
                          label={account.status || 'Active'}
                          color={account.status === 'Active' ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default WalletAccountTab;
