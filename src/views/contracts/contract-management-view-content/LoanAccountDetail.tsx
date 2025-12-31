'use client'

import { Box, Grid, Stack } from '@mui/material'
import NumbersIcon from '@mui/icons-material/Numbers'
import PersonIcon from '@mui/icons-material/Person'
import LanguageIcon from '@mui/icons-material/Language'
import BadgeIcon from '@mui/icons-material/Badge'
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong'
import SavingsIcon from '@mui/icons-material/Savings'
import PercentIcon from '@mui/icons-material/Percent'
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth'
import AccountBalanceIcon from '@mui/icons-material/AccountBalance'
import PriceChangeIcon from '@mui/icons-material/PriceChange'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import AvTimerIcon from '@mui/icons-material/AvTimer'

import { InfoTile } from '@/components/InfoTile'
import { StatTile } from '@/components/StatTile'
import { StatusChip } from '@/components/StatusChip'
import { getDictionary } from '@/utils/getDictionary'
import { AccountTypeIcon } from '@/components/layout/shared/AccountTypeIcon'

type LoanInfo = {
    currency?: string
    opendate?: string
    intdue?: number
    principal_final_due_amt?: number
    interest_final_due_date?: string
    accountnumber?: string
    principaldue?: number
    productname?: string
    interest?: number
    balance?: number
    principal_final_due_date?: string
    interest_next_due_date?: string
    penaltyamount?: number
    status?: string
    principal_remaining_term_count?: number
    todate?: string
    interest_next_due_amt?: number
    disbursementamount?: number
    customername?: string
    interest_remaining_term_count?: number
}

export default function LoanAccountDetail({
    loan,
    dictionary
}: {
    loan: LoanInfo
    dictionary: Awaited<ReturnType<typeof getDictionary>>
}) {
    const fmtNum = (v: any) =>
        typeof v === 'number'
            ? v.toLocaleString(undefined, { maximumFractionDigits: 2 })
            : v ?? '-'

    const fmtDate = (v?: string) => v || '-' 
console.log(loan);
    return (
        <Box sx={{ p: 0.5 }}>

            <Grid container spacing={2}>
                {/* LEFT: Info tiles */}
                <Grid size={{ xs: 12, md: 8 }} container spacing={1.25}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <InfoTile
                            icon={<NumbersIcon fontSize="small" />}
                            label="Account Number"
                            value={loan.accountnumber || '-'}
                            copyable
                        />
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6 }}>
                        <InfoTile
                            icon={<PersonIcon fontSize="small" />}
                            label="Customer Name"
                            value={loan.customername || '-'}
                        />
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6 }}>
                        <InfoTile
                            icon={<BadgeIcon fontSize="small" />}
                            label="Product Name"
                            value={loan.productname || '-'}
                        />
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6 }}>
                        <InfoTile
                            icon={<LanguageIcon fontSize="small" />}
                            label="Status"
                            value={<StatusChip caption={loan.status} />}
                        />
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6 }}>
                        <InfoTile
                            icon={<AccountBalanceIcon fontSize="small" />}
                            label="Account Type"
                            value={
                                <Stack direction="row" alignItems="center" spacing={1}>
                                    <AccountTypeIcon type="LN" dictionary={dictionary} />
                                </Stack>
                            }
                        />
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6 }}>
                        <InfoTile
                            icon={<PriceChangeIcon fontSize="small" />}
                            label="Currency"
                            value={loan.currency || '-'}
                        />
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6 }}>
                        <InfoTile
                            icon={<CalendarMonthIcon fontSize="small" />}
                            label="Open Date"
                            value={fmtDate(loan.opendate)}
                        />
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6 }}>
                        <InfoTile
                            icon={<AvTimerIcon fontSize="small" />}
                            label="Maturity Date"
                            value={fmtDate(loan.todate)}
                        />
                    </Grid>
                </Grid>

                {/* RIGHT: Stats */}
                <Grid size={{ xs: 12, md: 4 }}>
                    <Box sx={{ pl: { md: 1 }, mt: { xs: 2, md: 0 } }}>
                        <Stack spacing={1.25}>
                            <StatTile
                                icon={<SavingsIcon fontSize="small" />}
                                label="Disbursement Amount"
                                value={fmtNum(loan.disbursementamount)}
                                color="error"
                            />

                            <StatTile
                                icon={<PercentIcon fontSize="small" />}
                                label={`Interest Next Due (${fmtDate(loan.interest_next_due_date)})`}
                                value={fmtNum(loan.interest_next_due_amt)}
                                color="warning"
                            />

                            <StatTile
                                icon={<PercentIcon fontSize="small" />}
                                label={`Interest Final Due (${fmtDate(loan.interest_final_due_date)})`}
                                value={fmtNum(loan.principal_final_due_amt)}
                                color="info"
                            />

                            <StatTile
                                icon={<PercentIcon fontSize="small" />}
                                label="Interest Accrued"
                                value={fmtNum(loan.interest)}
                                color="info"
                            />

                            <StatTile
                                icon={<AccountBalanceIcon fontSize="small" />}
                                label="Principal Due"
                                value={fmtNum(loan.principaldue)}
                                color="success"
                            />

                            <StatTile
                                icon={<AccountBalanceIcon fontSize="small" />}
                                label="Interest Due"
                                value={fmtNum(loan.intdue)}
                                color="success"
                            />

                            <StatTile
                                icon={<WarningAmberIcon fontSize="small" />}
                                label="Penalty Amount"
                                value={fmtNum(loan.penaltyamount)}
                                color="error"
                            />

                            <StatTile
                                icon={<AvTimerIcon fontSize="small" />}
                                label="Remaining Terms (Principal / Interest)"
                                value={`${fmtNum(loan.principal_remaining_term_count)} / ${fmtNum(loan.interest_remaining_term_count)}`}
                                color="secondary"
                            />
                        </Stack>
                    </Box>
                </Grid>
            </Grid>
        </Box>
    )
}
