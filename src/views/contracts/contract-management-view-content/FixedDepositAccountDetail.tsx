'use client'

import AccountBalanceIcon from '@mui/icons-material/AccountBalance'
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth'
import HubIcon from '@mui/icons-material/Hub'
import LocalAtmIcon from '@mui/icons-material/LocalAtm'
import NumbersIcon from '@mui/icons-material/Numbers'
import PercentIcon from '@mui/icons-material/Percent'
import PersonIcon from '@mui/icons-material/Person'
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong'
import SavingsIcon from '@mui/icons-material/Savings'
import { Box, Grid, Stack } from '@mui/material'

import { InfoTile } from '@/components/InfoTile'
import { StatTile } from '@/components/StatTile'
import { StatusChip } from '@/components/StatusChip'
import { getDictionary } from '@/utils/getDictionary'

type FixedDepositInfo = {
    totalyear?: number
    interestpaid?: number
    fromdate?: string
    orgdate?: string
    custid?: string
    availablebalance?: number
    accruedinterest?: number
    statuscd?: string
    brcd?: string
    balance?: number
    interestrate?: number
    brid?: number
    currencyid?: string
    acctname?: string
    todate?: string
    dptname?: string
    customername?: string
    accountno?: string
}

export default function FixedDepositAccountDetail({
    fd,
    dictionary
}: {
    fd: FixedDepositInfo
    dictionary: Awaited<ReturnType<typeof getDictionary>>
}) {
    const fmtNum = (v: any) =>
        typeof v === 'number'
            ? v.toLocaleString(undefined, { maximumFractionDigits: 2 })
            : v ?? '-'

    const fmtDate = (v?: string) => v || '-'

    return (
        <Box sx={{ p: 0.5 }}>
            <Box
                sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 1,
                    px: 1.25,
                    py: 0.75,
                    mb: 1.5,
                    borderRadius: 999,
                    bgcolor: 'primary.50',
                    border: '1px solid',
                    borderColor: 'primary.200'
                }}
            >
                <ReceiptLongIcon sx={{ color: 'primary.main' }} fontSize="small" />
                Fixed Deposit account details
            </Box>

            <Grid container spacing={2}>
                {/* LEFT: info */}
                <Grid size={{ xs: 12, md: 8 }} container spacing={1.25}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <InfoTile
                            icon={<NumbersIcon fontSize="small" />}
                            label="Account Number"
                            value={fd.accountno || '-'}
                            copyable
                        />
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6 }}>
                        <InfoTile
                            icon={<PersonIcon fontSize="small" />}
                            label="Customer Name"
                            value={fd.customername || fd.acctname || '-'}
                        />
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6 }}>
                        <InfoTile
                            icon={<LocalAtmIcon fontSize="small" />}
                            label="Currency"
                            value={fd.currencyid || '-'}
                        />
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6 }}>
                        <InfoTile
                            icon={<PercentIcon fontSize="small" />}
                            label="Interest Rate (%)"
                            value={fmtNum(fd.interestrate)}
                        />
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6 }}>
                        <InfoTile
                            icon={<CalendarMonthIcon fontSize="small" />}
                            label="From Date"
                            value={fmtDate(fd.fromdate)}
                        />
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6 }}>
                        <InfoTile
                            icon={<CalendarMonthIcon fontSize="small" />}
                            label="To Date"
                            value={fmtDate(fd.todate)}
                        />
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6 }}>
                        <InfoTile
                            icon={<HubIcon fontSize="small" />}
                            label="Branch Code"
                            value={fd.brcd || String(fd.brid ?? '') || '-'}
                        />
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6 }}>
                        <InfoTile
                            icon={<AccountBalanceIcon fontSize="small" />}
                            label="Status"
                            value={<StatusChip caption={fd.statuscd} />}
                        />
                    </Grid>

                    <Grid size={{ xs: 12 }}>
                        <InfoTile
                            icon={<ReceiptLongIcon fontSize="small" />}
                            label="Product"
                            value={fd.dptname || '-'}
                        />
                    </Grid>
                </Grid>

                {/* RIGHT: stats */}
                <Grid size={{ xs: 12, md: 4 }}>
                    <Box sx={{ pl: { md: 1 }, mt: { xs: 2, md: 0 } }}>
                        <Stack spacing={1.25}>
                            <StatTile
                                icon={<SavingsIcon fontSize="small" />}
                                label="Principal (Balance)"
                                value={fmtNum(fd.balance)}
                                color="error"
                            />
                            <StatTile
                                icon={<AccountBalanceIcon fontSize="small" />}
                                label="Available Balance"
                                value={fmtNum(fd.availablebalance)}
                                color="info"
                            />
                            <StatTile
                                icon={<PercentIcon fontSize="small" />}
                                label="Accrued Interest"
                                value={fmtNum(fd.accruedinterest)}
                                color="warning"
                            />
                            <StatTile
                                icon={<PercentIcon fontSize="small" />}
                                label="Interest Paid (YTD/Total)"
                                value={fmtNum(fd.interestpaid)}
                                color="success"
                            />
                            <StatTile
                                icon={<CalendarMonthIcon fontSize="small" />}
                                label="Total Years (Tenor)"
                                value={fmtNum(fd.totalyear)}
                                color="secondary"
                            />
                        </Stack>
                    </Box>
                </Grid>
            </Grid>
        </Box>
    )
}
