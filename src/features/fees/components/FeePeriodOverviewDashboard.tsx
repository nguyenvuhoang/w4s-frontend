import { Alert, Grid, Paper, Skeleton, Stack, Typography } from '@mui/material'

import type { FeeDictionary, FeePeriodOverview } from '../types'
import { feeText, formatFeeInvoiceMoney } from './feeInvoiceHelpers'

type Props = { dictionary: FeeDictionary; locale: string; overview: FeePeriodOverview; loading: boolean; error: string | null }

const FeePeriodOverviewDashboard = ({ dictionary, locale, overview, loading, error }: Props) => {
  const total = overview.total_apartments ?? 0
  const paid = overview.paid_apartments ?? 0
  const completion = total > 0 ? Math.round((paid / total) * 100) : 0
  const hasData = Object.values(overview).some(value => value !== null)
  const metrics = [
    ['fee_dashboard_total', 'Total generated', formatFeeInvoiceMoney(overview.total_amount, locale)],
    ['fee_dashboard_paid', 'Collected', formatFeeInvoiceMoney(overview.paid_amount, locale)],
    ['fee_dashboard_remaining', 'Outstanding', formatFeeInvoiceMoney(overview.remaining_amount, locale)],
    ['fee_dashboard_surplus', 'Total wallet surplus', formatFeeInvoiceMoney(overview.total_surplus_amount, locale)],
    ['fee_dashboard_apartments', 'Completed apartments', hasData ? `${paid}/${total}` : '—'],
    ['fee_dashboard_completion', 'Completion', hasData ? `${completion}%` : '—']
  ]
  return <Stack spacing={1.5}>
    {error && <Alert severity="error">{error}</Alert>}
    <Grid container spacing={2}>{metrics.map(([key, fallback, value]) => <Grid key={key} size={{ xs: 12, sm: 6, lg: 2 }}><Paper variant="outlined" sx={{ p: 2, height: '100%' }}><Typography variant="caption" color="text.secondary">{feeText(dictionary, key, fallback)}</Typography><Typography variant="h6" sx={{ mt: .5, fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>{loading ? <Skeleton width="65%" /> : value}</Typography></Paper></Grid>)}</Grid>
  </Stack>
}

export default FeePeriodOverviewDashboard
