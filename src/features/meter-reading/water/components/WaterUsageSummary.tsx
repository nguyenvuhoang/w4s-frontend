import { Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material'

import { waterText } from '../hooks/useWaterMeterReading'
import type { WaterMeterDictionary, WaterUsageResponse } from '../types'

const WaterUsageSummary = ({ dictionary, locale, data }: { dictionary: WaterMeterDictionary; locale: string; data: WaterUsageResponse }) => {
    const number = (value: number | null) => value === null ? '-' : new Intl.NumberFormat(locale, { maximumFractionDigits: 3 }).format(value)
    const headers = ['apartment_code', 'year_month', 'last_index', 'new_index', 'consumption']

    return (
        <Paper sx={{ border: 1, borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
            <TableContainer>
                <Table size="small">
                    <TableHead><TableRow>{headers.map(header => <TableCell key={header} sx={{ bgcolor: 'primary.main', color: 'common.white', fontWeight: 800 }}>{waterText(dictionary, header)}</TableCell>)}</TableRow></TableHead>
                    <TableBody>
                        {data.usage.length === 0 ? (
                            <TableRow><TableCell colSpan={headers.length} align="center" sx={{ py: 4 }}><Typography fontWeight={700}>{waterText(dictionary, 'no_usage_found')}</Typography></TableCell></TableRow>
                        ) : data.usage.map(item => (
                            <TableRow key={`${item.water_meter_period_id}-${item.year}-${item.month}`}>
                                <TableCell>{data.apartment_code || '-'}</TableCell>
                                <TableCell>{`${item.year}/${String(item.month).padStart(2, '0')}`}</TableCell>
                                <TableCell>{number(item.last_index)}</TableCell>
                                <TableCell>{number(item.new_index)}</TableCell>
                                <TableCell>{number(item.consumption)}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Paper>
    )
}

export default WaterUsageSummary