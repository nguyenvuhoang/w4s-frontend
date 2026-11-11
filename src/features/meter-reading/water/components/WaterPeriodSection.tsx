import LockOutlinedIcon from '@mui/icons-material/LockOutlined'
import { Button, Chip, Paper, Stack, Typography } from '@mui/material'

import { waterText } from '../hooks/useWaterMeterReading'
import type { WaterMeterDictionary, WaterMeterPeriod } from '../types'

const WaterPeriodSection = ({ dictionary, locale, period, loading, on_lock }: { dictionary: WaterMeterDictionary; locale: string; period: WaterMeterPeriod | null; loading: boolean; on_lock: () => void }) => {
    if (!period) return <Paper sx={{ border: 1, borderColor: 'divider', p: 3 }}><Typography>{waterText(dictionary, 'no_period_selected')}</Typography></Paper>

    const locked = period.status.toUpperCase() === 'LOCKED'
    const locked_on = period.locked_on_utc ? new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(period.locked_on_utc)) : '-'
    const status_label = period.status.toUpperCase() === 'DRAFT'
        ? waterText(dictionary, 'status_draft')
        : locked
            ? waterText(dictionary, 'status_locked')
            : period.status || '-'

    return (
        <Paper sx={{ border: 1, borderColor: 'divider', p: 2.5 }}>
            <Stack direction={{ xs: 'column', md: 'row' }} alignItems={{ md: 'center' }} justifyContent="space-between" gap={2}>
                <Stack direction={{ xs: 'column', sm: 'row' }} gap={3}>
                    <Typography><strong>{waterText(dictionary, 'year')}:</strong> {period.year}</Typography>
                    <Typography><strong>{waterText(dictionary, 'month')}:</strong> {period.month}</Typography>
                    <Typography><strong>{waterText(dictionary, 'project_code')}:</strong> {period.project_code || '-'}</Typography>
                    <Typography><strong>{waterText(dictionary, 'fee_period')}:</strong> {period.fee_period_id ?? '-'}</Typography>
                    <Typography component="div"><strong>{waterText(dictionary, 'period_status')}:</strong> <Chip size="small" color={locked ? 'default' : 'success'} label={status_label} /></Typography>
                    <Typography><strong>{waterText(dictionary, 'locked_on')}:</strong> {locked_on}</Typography>
                    <Typography><strong>{waterText(dictionary, 'locked_by')}:</strong> {period.locked_by_user_code || '-'}</Typography>
                </Stack>
                <Button variant="outlined" color="warning" startIcon={<LockOutlinedIcon />} disabled={locked || loading} onClick={on_lock}>{waterText(dictionary, 'lock_period')}</Button>
            </Stack>
        </Paper>
    )
}

export default WaterPeriodSection