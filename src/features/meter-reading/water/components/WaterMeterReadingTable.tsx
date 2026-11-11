import { Chip, Paper, Skeleton, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material'

import { waterText } from '../hooks/useWaterMeterReading'
import type { WaterMeterDictionary, WaterMeterSearchItem } from '../types'

type Props = {
    dictionary: WaterMeterDictionary
    locale: string
    rows: WaterMeterSearchItem[]
    loading: boolean
    row_offset?: number
}

const formatNumber = (value: number | null, locale: string) => value === null ? '-' : new Intl.NumberFormat(locale, { maximumFractionDigits: 3 }).format(value)
const formatDate = (value: string | null, locale: string) => value ? new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : '-'

const WaterMeterReadingTable = ({ dictionary, locale, rows, loading, row_offset = 0 }: Props) => {
    const headers = ['no', 'apartment_code', 'building_code', 'floor', 'water_meter_code', 'last_index', 'new_index', 'consumption', 'status', 'recorded_by', 'recorded_on']

    return (
        <Paper sx={{ border: 1, borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
            <TableContainer>
                <Table size="small" sx={{ minWidth: 1180 }}>
                    <TableHead>
                        <TableRow>
                            {headers.map(header => <TableCell key={header} sx={{ bgcolor: 'primary.main', color: 'common.white', fontWeight: 800, whiteSpace: 'nowrap' }}>{waterText(dictionary, header)}</TableCell>)}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? Array.from({ length: 5 }).map((_, index) => (
                            <TableRow key={index}>{headers.map(header => <TableCell key={header}><Skeleton /></TableCell>)}</TableRow>
                        )) : rows.length === 0 ? (
                            <TableRow><TableCell colSpan={headers.length} align="center" sx={{ py: 5 }}><Typography fontWeight={700}>{waterText(dictionary, 'no_readings_found')}</Typography></TableCell></TableRow>
                        ) : rows.map((row, index) => (
                            <TableRow key={row.id || `${row.apartment_id}-${row.water_meter_period_id}-${index}`} hover>
                                <TableCell>{row_offset + index + 1}</TableCell>
                                <TableCell>{row.apartment_code || '-'}</TableCell>
                                <TableCell>{row.building_code || '-'}</TableCell>
                                <TableCell>{row.floor || '-'}</TableCell>
                                <TableCell>{row.water_meter_code || '-'}</TableCell>
                                <TableCell>{formatNumber(row.last_index, locale)}</TableCell>
                                <TableCell>{formatNumber(row.new_index, locale)}</TableCell>
                                <TableCell>{formatNumber(row.consumption, locale)}</TableCell>
                                <TableCell><Chip size="small" color={row.status.toUpperCase() === 'LOCKED' ? 'default' : 'success'} label={row.status || '-'} /></TableCell>
                                <TableCell>{row.recorded_by_user_name || row.recorded_by_user_code || '-'}</TableCell>
                                <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatDate(row.recorded_on_utc, locale)}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Paper>
    )
}

export default WaterMeterReadingTable