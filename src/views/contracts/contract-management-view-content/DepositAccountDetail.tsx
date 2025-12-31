
import { InfoTile } from '@/components/InfoTile';
import { AccountTypeIcon } from '@/components/layout/shared/AccountTypeIcon';
import { StatTile } from '@/components/StatTile';
import { StatusChip } from '@/components/StatusChip';
import { getDictionary } from '@/utils/getDictionary';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import CurrencyExchangeIcon from '@mui/icons-material/CurrencyExchange';
import LanguageIcon from '@mui/icons-material/Language';
import NumbersIcon from '@mui/icons-material/Numbers';
import PercentIcon from '@mui/icons-material/Percent';
import PersonIcon from '@mui/icons-material/Person';
import SavingsIcon from '@mui/icons-material/Savings';
import { Box, Grid, Stack } from '@mui/material';

export default function DepositAccountDetail({
    detailSource,
    dictionary
}: {
    detailSource: any,
    dictionary: Awaited<ReturnType<typeof getDictionary>>
}) {
    return (
        <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 8 }}>
                <Grid container spacing={1.25}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <InfoTile
                            icon={<NumbersIcon fontSize="small" />}
                            label="Account Number"
                            value={(detailSource as any)?.accountnumber || '-'}
                            copyable
                        />
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6 }}>
                        <InfoTile
                            icon={<PersonIcon fontSize="small" />}
                            label="Customer Name"
                            value={(detailSource as any)?.customername || '-'}
                        />
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6 }}>
                        <InfoTile
                            icon={<AccountBalanceIcon fontSize="small" />}
                            label="Account Type"
                            value={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <AccountTypeIcon type={(detailSource as any)?.accounttype ?? (detailSource as any)?.accountype} dictionary={dictionary} />

                                </Box>
                            }
                        />
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6 }}>
                        <InfoTile
                            icon={<CurrencyExchangeIcon fontSize="small" />}
                            label="Currency"
                            value={(detailSource as any)?.currency ?? (detailSource as any)?.currencycode ?? '-'}
                        />
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6 }}>
                        <InfoTile
                            icon={<LanguageIcon fontSize="small" />}
                            label="Status"
                            value={<StatusChip caption={(detailSource as any)?.status} />}
                        />
                    </Grid>
                </Grid>
            </Grid>


            <Grid size={{ xs: 12, md: 4 }}>
                <Box sx={{ pl: { md: 1 }, mt: { xs: 2, md: 0 } }}>
                    <Stack spacing={1.25}>
                        <StatTile
                            icon={<SavingsIcon fontSize="small" />}
                            label="Preserver"
                            value={(detailSource as any)?.preserver}
                            color="error"
                        />
                        <StatTile
                            icon={<PercentIcon fontSize="small" />}
                            label="Interest Amount"
                            value={(detailSource as any)?.interestamount}
                            color="warning"
                        />
                        <StatTile
                            icon={<AccountBalanceWalletIcon fontSize="small" />}
                            label="Available Balance"
                            value={(detailSource as any)?.availablebalance}
                            color="info"
                        />
                        <StatTile
                            icon={<AccountBalanceIcon fontSize="small" />}
                            label="Current Balance"
                            value={(detailSource as any)?.currentbalance ?? (detailSource as any)?.balance}
                            color="success"
                        />
                    </Stack>
                </Box>
            </Grid>
        </Grid>
    )

} 
