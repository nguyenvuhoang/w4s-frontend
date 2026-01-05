'use client';

import { PageContentProps } from '@/types';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';

interface WalletTransactionTabProps {
  walletData: any;
  dictionary: PageContentProps['dictionary'];
  session: PageContentProps['session'];
  locale: PageContentProps['locale'];
}

const WalletTransactionTab = ({
  walletData,
  dictionary,
  session,
  locale,
}: WalletTransactionTabProps) => {
  const transactions = walletData?.transactions || [];

  const formatCurrency = (value: number | string) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat('vi-VN').format(num || 0);
  };

  const getTransactionTypeColor = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'deposit':
      case 'credit':
        return 'success';
      case 'withdrawal':
      case 'debit':
        return 'error';
      case 'transfer':
        return 'info';
      default:
        return 'default';
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'deposit':
      case 'credit':
        return <ArrowDownwardIcon sx={{ color: '#4caf50', fontSize: 18 }} />;
      case 'withdrawal':
      case 'debit':
        return <ArrowUpwardIcon sx={{ color: '#f44336', fontSize: 18 }} />;
      default:
        return null;
    }
  };

  return (
    <Card className="shadow-md" sx={{ borderRadius: 2 }}>
      <CardContent>
        <Typography variant="h6" sx={{ mb: 3, color: '#225087', fontWeight: 600 }}>
          {dictionary['wallet']?.transactionHistory || 'Transaction History'}
        </Typography>

        {transactions.length > 0 ? (
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                  <TableCell>{dictionary['wallet']?.transactionId || 'Transaction ID'}</TableCell>
                  <TableCell>{dictionary['wallet']?.transactionType || 'Type'}</TableCell>
                  <TableCell>{dictionary['wallet']?.transactionDate || 'Date'}</TableCell>
                  <TableCell align="right">{dictionary['wallet']?.amount || 'Amount'}</TableCell>
                  <TableCell>{dictionary['wallet']?.description || 'Description'}</TableCell>
                  <TableCell>{dictionary['common']?.status || 'Status'}</TableCell>
                  <TableCell align="center">{dictionary['common']?.actions || 'Actions'}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {transactions.map((tx: any, index: number) => (
                  <TableRow key={index} hover>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                        {tx.transactionId || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {getTransactionIcon(tx.type)}
                        <Chip
                          label={tx.type || '-'}
                          color={getTransactionTypeColor(tx.type) as any}
                          size="small"
                          variant="outlined"
                        />
                      </Box>
                    </TableCell>
                    <TableCell>{tx.date || '-'}</TableCell>
                    <TableCell align="right">
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 600,
                          color: tx.type?.toLowerCase() === 'deposit' || tx.type?.toLowerCase() === 'credit'
                            ? '#4caf50'
                            : '#f44336',
                        }}
                      >
                        {tx.type?.toLowerCase() === 'deposit' || tx.type?.toLowerCase() === 'credit' ? '+' : '-'}
                        {formatCurrency(tx.amount)} {walletData?.currency || 'VND'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ maxWidth: 200 }} noWrap>
                        {tx.description || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={tx.status || 'Completed'}
                        color={tx.status === 'Completed' ? 'success' : tx.status === 'Pending' ? 'warning' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title={dictionary['common']?.view || 'View'}>
                        <IconButton size="small" color="primary">
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Box
            sx={{
              textAlign: 'center',
              py: 6,
              color: 'text.secondary',
            }}
          >
            <Typography variant="body1">
              {dictionary['wallet']?.noTransactions || 'No transactions found'}
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default WalletTransactionTab;
