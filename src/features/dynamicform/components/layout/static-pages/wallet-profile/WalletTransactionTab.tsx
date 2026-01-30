'use client';

import { PageContentProps } from '@shared/types';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Paper,
  Divider,
  alpha,
} from '@mui/material';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import LocalGasStationIcon from '@mui/icons-material/LocalGasStation';
import MovieIcon from '@mui/icons-material/Movie';
import ElectricBoltIcon from '@mui/icons-material/ElectricBolt';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import PaymentsIcon from '@mui/icons-material/Payments';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingIcon from '@mui/icons-material/Pending';
import ErrorIcon from '@mui/icons-material/Error';

interface Transaction {
  transaction_id: string;
  name: string;
  category: string;
  amount: number;
  currency: string;
  transaction_date: string;
  description: string;
  status: string;
}

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
  // Get transactions from wallet data
  const wallet = walletData?.wallets?.[0] || {};
  const transactions: Transaction[] = wallet?.transactions || [];
  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN').format(value || 0);
  };

  // Format date
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Get category icon and color
  const getCategoryStyle = (category: string, name: string) => {
    const lowerCategory = category?.toLowerCase() || '';
    const lowerName = name?.toLowerCase() || '';

    if (lowerCategory.includes('Äƒn') || lowerCategory.includes('thá»±c pháº©m') || lowerName.includes('thá»±c pháº©m')) {
      return { icon: <RestaurantIcon />, color: '#ff9800', bgColor: alpha('#ff9800', 0.1) };
    }
    if (lowerCategory.includes('di chuyá»ƒn') || lowerName.includes('gá»­i xe')) {
      return { icon: <DirectionsCarIcon />, color: '#2196f3', bgColor: alpha('#2196f3', 0.1) };
    }
    if (lowerName.includes('xÄƒng') || lowerName.includes('gas')) {
      return { icon: <LocalGasStationIcon />, color: '#9c27b0', bgColor: alpha('#9c27b0', 0.1) };
    }
    if (lowerCategory.includes('giáº£i trÃ­') || lowerName.includes('phim')) {
      return { icon: <MovieIcon />, color: '#e91e63', bgColor: alpha('#e91e63', 0.1) };
    }
    if (lowerCategory.includes('tiá»‡n Ã­ch') || lowerName.includes('Ä‘iá»‡n') || lowerName.includes('nÆ°á»›c')) {
      return { icon: <ElectricBoltIcon />, color: '#ffeb3b', bgColor: alpha('#ffeb3b', 0.15) };
    }
    if (lowerCategory.includes('mua sáº¯m') || lowerCategory.includes('shopping')) {
      return { icon: <ShoppingCartIcon />, color: '#4caf50', bgColor: alpha('#4caf50', 0.1) };
    }
    return { icon: <PaymentsIcon />, color: '#225087', bgColor: alpha('#225087', 0.1) };
  };

  // Get status style
  const getStatusStyle = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'SUCCESS':
        return {
          label: dictionary['wallet']?.success || 'ThÃ nh cÃ´ng',
          icon: <CheckCircleIcon sx={{ fontSize: 14 }} />,
          color: '#4caf50',
          bgColor: alpha('#4caf50', 0.1),
        };
      case 'PENDING':
        return {
          label: dictionary['wallet']?.pending || 'Äang xá»­ lÃ½',
          icon: <PendingIcon sx={{ fontSize: 14 }} />,
          color: '#ff9800',
          bgColor: alpha('#ff9800', 0.1),
        };
      case 'FAILED':
        return {
          label: dictionary['wallet']?.failed || 'Tháº¥t báº¡i',
          icon: <ErrorIcon sx={{ fontSize: 14 }} />,
          color: '#f44336',
          bgColor: alpha('#f44336', 0.1),
        };
      default:
        return {
          label: status || '-',
          icon: null,
          color: '#666',
          bgColor: alpha('#666', 0.1),
        };
    }
  };

  // Calculate total spending
  const totalSpending = transactions.reduce((sum, t) => sum + (t.amount || 0), 0);

  return (
    <Card className="shadow-md" sx={{ borderRadius: 2 }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6" sx={{ color: '#225087', fontWeight: 600 }}>
            {dictionary['wallet']?.transactionHistory || 'Transaction History'}
          </Typography>
          {transactions.length > 0 && (
            <Chip
              label={`${transactions.length} ${dictionary['wallet']?.transactions || 'giao dá»‹ch'}`}
              size="small"
              sx={{ bgcolor: alpha('#225087', 0.1), color: '#225087' }}
            />
          )}
        </Box>

        {/* Summary Card */}
        {transactions.length > 0 && (
          <Paper
            elevation={0}
            sx={{
              p: 2,
              mb: 3,
              background: 'linear-gradient(135deg, #225087 0%, #1780AC 100%)',
              borderRadius: 2,
              color: 'white',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <ReceiptLongIcon sx={{ fontSize: 32 }} />
              <Box>
                <Typography variant="body2" sx={{ opacity: 0.8, color: 'white' }}>
                  {dictionary['wallet']?.totalSpending || 'Tá»•ng chi tiÃªu'}
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 700, color: 'white' }}>
                  {formatCurrency(totalSpending)} {transactions[0]?.currency || 'VND'}
                </Typography>
              </Box>
            </Box>
          </Paper>
        )}

        {transactions.length === 0 ? (
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
              <ReceiptLongIcon sx={{ fontSize: 40, color: '#225087' }} />
            </Box>
            <Typography variant="h6" sx={{ color: '#1a1a1a', mb: 1 }}>
              {dictionary['wallet']?.noTransactions || 'No Transactions Yet'}
            </Typography>
            <Typography variant="body2" sx={{ color: '#666', maxWidth: 400, mx: 'auto' }}>
              {dictionary['wallet']?.noTransactionsDescription || 
                'Your transaction history will appear here once you start making deposits, withdrawals, or transfers.'}
            </Typography>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {transactions.map((transaction, index) => {
              const categoryStyle = getCategoryStyle(transaction.category, transaction.name);
              const statusStyle = getStatusStyle(transaction.status);

              return (
                <Paper
                  key={transaction.transaction_id}
                  elevation={0}
                  sx={{
                    p: 2,
                    border: '1px solid #e0e0e0',
                    borderRadius: 2,
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      borderColor: '#225087',
                      bgcolor: alpha('#225087', 0.02),
                    },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                    {/* Category Icon */}
                    <Box
                      sx={{
                        width: 44,
                        height: 44,
                        borderRadius: 2,
                        bgcolor: categoryStyle.bgColor,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: categoryStyle.color,
                        flexShrink: 0,
                      }}
                    >
                      {categoryStyle.icon}
                    </Box>

                    {/* Transaction Details */}
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.5 }}>
                        <Box>
                          <Typography variant="body1" sx={{ fontWeight: 600, color: '#1a1a1a' }}>
                            {transaction.name}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#666' }}>
                            {transaction.category}
                          </Typography>
                        </Box>
                        <Typography
                          variant="body1"
                          sx={{
                            fontWeight: 600,
                            color: '#f44336',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          -{formatCurrency(transaction.amount)} {transaction.currency}
                        </Typography>
                      </Box>

                      <Typography
                        variant="body2"
                        sx={{
                          color: '#666',
                          mb: 1,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {transaction.description}
                      </Typography>

                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="caption" sx={{ color: '#999' }}>
                          {formatDate(transaction.transaction_date)}
                        </Typography>
                        <Chip
                          {...(statusStyle.icon && { icon: statusStyle.icon })}
                          label={statusStyle.label}
                          size="small"
                          sx={{
                            bgcolor: statusStyle.bgColor,
                            color: statusStyle.color,
                            fontSize: '0.7rem',
                            height: 24,
                            '& .MuiChip-icon': {
                              color: statusStyle.color,
                            },
                          }}
                        />
                      </Box>
                    </Box>
                  </Box>
                </Paper>
              );
            })}
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default WalletTransactionTab;

