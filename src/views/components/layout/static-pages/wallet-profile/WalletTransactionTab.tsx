'use client';

import { PageContentProps } from '@/types';
import {
  Card,
  CardContent,
  Typography,
  Box,
  alpha,
} from '@mui/material';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';

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
  // Get transactions (not available in current data structure)
  const wallet = walletData?.wallets?.[0] || {};
  const transactions = wallet?.transactions || [];

  return (
    <Card className="shadow-md" sx={{ borderRadius: 2 }}>
      <CardContent>
        <Typography variant="h6" sx={{ mb: 3, color: '#225087', fontWeight: 600 }}>
          {dictionary['wallet']?.transactionHistory || 'Transaction History'}
        </Typography>

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
          <Box>
            {/* TODO: Render transactions when available */}
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default WalletTransactionTab;
