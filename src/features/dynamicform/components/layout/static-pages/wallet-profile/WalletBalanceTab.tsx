'use client';

import { PageContentProps } from '@/types';
import {
    Card,
    CardContent,
    Typography,
    Box,
    Paper,
    Grid,
    Chip,
    Divider,
    alpha,
} from '@mui/material';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import LockIcon from '@mui/icons-material/Lock';
import CardGiftcardIcon from '@mui/icons-material/CardGiftcard';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

interface Balance {
    id: number;
    balance: number;
    bonus_balance: number;
    locked_balance: number;
    available_balance: number;
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
    balance?: Balance;
}

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
    // Get wallet info
    const wallet = walletData?.wallets?.[0] || {};
    const accounts: Account[] = wallet?.accounts || [];
    const currency = wallet?.default_currency || 'VND';

    // Format currency
    const formatCurrency = (value: number | string) => {
        const num = typeof value === 'string' ? parseFloat(value) : value;
        return new Intl.NumberFormat('vi-VN').format(num || 0);
    };

    // Check if any account has balance data - FIX: accounts is an array
    const hasBalanceData = accounts.some((acc) => acc.balance !== undefined);

    // Calculate total balances from all accounts
    const totalBalance = accounts.reduce(
        (sum, acc) => sum + (acc.balance?.balance || 0),
        0
    );
    const totalAvailable = accounts.reduce(
        (sum, acc) => sum + (acc.balance?.available_balance || 0),
        0
    );
    const totalLocked = accounts.reduce(
        (sum, acc) => sum + (acc.balance?.locked_balance || 0),
        0
    );
    const totalBonus = accounts.reduce(
        (sum, acc) => sum + (acc.balance?.bonus_balance || 0),
        0
    );

    return (
        <Card className="shadow-md" sx={{ borderRadius: 2 }}>
            <CardContent>
                <Typography variant="h6" sx={{ mb: 3, color: '#225087', fontWeight: 600 }}>
                    {dictionary['wallet']?.balanceInfo || 'Balance Information'}
                </Typography>

                {/* Total Balance Overview Card */}
                <Paper
                    elevation={0}
                    sx={{
                        p: 3,
                        background: 'linear-gradient(135deg, #225087 0%, #1780AC 100%)',
                        borderRadius: 2,
                        color: 'white',
                        mb: 3,
                    }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                        <AccountBalanceWalletIcon sx={{ fontSize: 40 }} />
                        <Box>
                            <Typography variant="body2" sx={{ opacity: 0.8, color: 'white' }}>
                                {dictionary['wallet']?.totalBalance || 'Total Balance'}
                            </Typography>
                            <Typography variant="h4" sx={{ fontWeight: 700, color: 'white' }}>
                                {formatCurrency(totalBalance)} {currency}
                            </Typography>
                        </Box>
                    </Box>

                    {/* Balance breakdown */}
                    <Divider sx={{ borderColor: 'rgba(255,255,255,0.2)', my: 2 }} />
                    <Grid container spacing={3}>
                        <Grid size={{ xs: 12, sm: 4 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <CheckCircleIcon sx={{ fontSize: 20, opacity: 0.8 }} />
                                <Box>
                                    <Typography variant="caption" sx={{ opacity: 0.7, color: 'white' }}>
                                        {dictionary['wallet']?.availableBalance || 'Available'}
                                    </Typography>
                                    <Typography variant="body1" sx={{ fontWeight: 600, color: 'white' }}>
                                        {formatCurrency(totalAvailable)} {currency}
                                    </Typography>
                                </Box>
                            </Box>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 4 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <LockIcon sx={{ fontSize: 20, opacity: 0.8 }} />
                                <Box>
                                    <Typography variant="caption" sx={{ opacity: 0.7, color: 'white' }}>
                                        {dictionary['wallet']?.lockedBalance || 'Locked'}
                                    </Typography>
                                    <Typography variant="body1" sx={{ fontWeight: 600, color: 'white' }}>
                                        {formatCurrency(totalLocked)} {currency}
                                    </Typography>
                                </Box>
                            </Box>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 4 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <CardGiftcardIcon sx={{ fontSize: 20, opacity: 0.8 }} />
                                <Box>
                                    <Typography variant="caption" sx={{ opacity: 0.7, color: 'white' }}>
                                        {dictionary['wallet']?.bonusBalance || 'Bonus'}
                                    </Typography>
                                    <Typography variant="body1" sx={{ fontWeight: 600, color: 'white' }}>
                                        {formatCurrency(totalBonus)} {currency}
                                    </Typography>
                                </Box>
                            </Box>
                        </Grid>
                    </Grid>
                </Paper>

                {/* Account Balance Details */}
                {hasBalanceData && accounts.length > 0 && (
                    <>
                        <Typography
                            variant="subtitle1"
                            sx={{ mb: 2, color: '#225087', fontWeight: 600 }}
                        >
                            {dictionary['wallet']?.accountBalances || 'Account Balances'}
                        </Typography>
                        <Grid container spacing={2}>
                            {accounts.map((account) => (
                                <Grid size={{ xs: 12, md: 6 }} key={account.id}>
                                    <Paper
                                        elevation={0}
                                        sx={{
                                            p: 2,
                                            border: '1px solid',
                                            borderColor: account.is_primary ? '#225087' : '#e0e0e0',
                                            borderRadius: 2,
                                            bgcolor: account.is_primary
                                                ? alpha('#225087', 0.02)
                                                : 'transparent',
                                        }}
                                    >
                                        {/* Account Header */}
                                        <Box
                                            sx={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                mb: 2,
                                            }}
                                        >
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <AccountBalanceIcon
                                                    sx={{ color: '#225087', fontSize: 24 }}
                                                />
                                                <Box>
                                                    <Typography
                                                        variant="body2"
                                                        sx={{ fontWeight: 600, color: '#225087' }}
                                                    >
                                                        {account.account_number}
                                                    </Typography>
                                                    <Typography variant="caption" sx={{ color: '#666' }}>
                                                        {account.account_type_caption || account.account_type}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                            <Box sx={{ display: 'flex', gap: 1 }}>
                                                {account.is_primary && (
                                                    <Chip
                                                        label={dictionary['wallet']?.primary || 'Primary'}
                                                        size="small"
                                                        sx={{
                                                            bgcolor: '#225087',
                                                            color: 'white',
                                                            fontSize: '0.7rem',
                                                        }}
                                                    />
                                                )}
                                                <Chip
                                                    label={account.status_caption || account.status}
                                                    size="small"
                                                    sx={{
                                                        bgcolor:
                                                            account.status === 'A'
                                                                ? alpha('#4caf50', 0.1)
                                                                : alpha('#ff9800', 0.1),
                                                        color: account.status === 'A' ? '#4caf50' : '#ff9800',
                                                        fontSize: '0.7rem',
                                                    }}
                                                />
                                            </Box>
                                        </Box>

                                        {/* Balance Details */}
                                        {account.balance && (
                                            <Grid container spacing={1}>
                                                <Grid size={{ xs: 6 }}>
                                                    <Box
                                                        sx={{
                                                            p: 1.5,
                                                            bgcolor: alpha('#225087', 0.05),
                                                            borderRadius: 1,
                                                        }}
                                                    >
                                                        <Typography
                                                            variant="caption"
                                                            sx={{ color: '#666', display: 'block' }}
                                                        >
                                                            {dictionary['wallet']?.balance || 'Balance'}
                                                        </Typography>
                                                        <Typography
                                                            variant="body2"
                                                            sx={{ fontWeight: 600, color: '#225087' }}
                                                        >
                                                            {formatCurrency(account.balance.balance)}{' '}
                                                            {account.currency_code}
                                                        </Typography>
                                                    </Box>
                                                </Grid>
                                                <Grid size={{ xs: 6 }}>
                                                    <Box
                                                        sx={{
                                                            p: 1.5,
                                                            bgcolor: alpha('#4caf50', 0.05),
                                                            borderRadius: 1,
                                                        }}
                                                    >
                                                        <Typography
                                                            variant="caption"
                                                            sx={{ color: '#666', display: 'block' }}
                                                        >
                                                            {dictionary['wallet']?.available || 'Available'}
                                                        </Typography>
                                                        <Typography
                                                            variant="body2"
                                                            sx={{ fontWeight: 600, color: '#4caf50' }}
                                                        >
                                                            {formatCurrency(account.balance.available_balance)}{' '}
                                                            {account.currency_code}
                                                        </Typography>
                                                    </Box>
                                                </Grid>
                                                <Grid size={{ xs: 6 }}>
                                                    <Box
                                                        sx={{
                                                            p: 1.5,
                                                            bgcolor: alpha('#ff9800', 0.05),
                                                            borderRadius: 1,
                                                        }}
                                                    >
                                                        <Typography
                                                            variant="caption"
                                                            sx={{ color: '#666', display: 'block' }}
                                                        >
                                                            {dictionary['wallet']?.locked || 'Locked'}
                                                        </Typography>
                                                        <Typography
                                                            variant="body2"
                                                            sx={{ fontWeight: 600, color: '#ff9800' }}
                                                        >
                                                            {formatCurrency(account.balance.locked_balance)}{' '}
                                                            {account.currency_code}
                                                        </Typography>
                                                    </Box>
                                                </Grid>
                                                <Grid size={{ xs: 6 }}>
                                                    <Box
                                                        sx={{
                                                            p: 1.5,
                                                            bgcolor: alpha('#9c27b0', 0.05),
                                                            borderRadius: 1,
                                                        }}
                                                    >
                                                        <Typography
                                                            variant="caption"
                                                            sx={{ color: '#666', display: 'block' }}
                                                        >
                                                            {dictionary['wallet']?.bonus || 'Bonus'}
                                                        </Typography>
                                                        <Typography
                                                            variant="body2"
                                                            sx={{ fontWeight: 600, color: '#9c27b0' }}
                                                        >
                                                            {formatCurrency(account.balance.bonus_balance)}{' '}
                                                            {account.currency_code}
                                                        </Typography>
                                                    </Box>
                                                </Grid>
                                            </Grid>
                                        )}
                                    </Paper>
                                </Grid>
                            ))}
                        </Grid>
                    </>
                )}

                {!hasBalanceData && (
                    <Box
                        sx={{
                            textAlign: 'center',
                            py: 4,
                            px: 4,
                            bgcolor: alpha('#225087', 0.05),
                            borderRadius: 2,
                        }}
                    >
                        <Typography variant="body2" sx={{ color: '#666' }}>
                            {dictionary['wallet']?.balanceNotAvailable ||
                                'Detailed balance information will be available once transactions are made.'}
                        </Typography>
                    </Box>
                )}
            </CardContent>
        </Card>
    );
};

export default WalletBalanceTab;
