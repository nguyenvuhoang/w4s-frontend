import {
    Chip,
    LinearProgress,
    Paper,
    Skeleton,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography
} from '@mui/material'

import type { Locale } from '@/configs/i18n'
import { useSearchTableRowConfig } from '@/shared/components/table'

import type { ResidentModel } from '../../types'
import ResidentApartmentChips from './ResidentApartmentChips'
import {
    formatResidentDateTime,
    getResidentAppUsageColor,
    getResidentAppUsageLabel,
    getResidentGenderDisplay,
    getResidentStatusColor,
    getResidentStatusLabel,
    residentText,
    type ResidentDictionary
} from './residentListHelpers'

type Props = {
    dictionary: ResidentDictionary
    locale?: Locale
    rows: ResidentModel[]
    loading: boolean
    page_size: number
    emptyTitle?: string
    emptyDescription?: string
    on_row_double_click?: (row: ResidentModel) => void
}

const COLUMN_COUNT = 9

const ResidentTable = ({
    dictionary,
    locale,
    rows,
    loading,
    page_size,
    emptyTitle,
    emptyDescription,
    on_row_double_click
}: Props) => {
    const table = useSearchTableRowConfig<ResidentModel>({
        rowInteraction: {
            onOpenDetail: on_row_double_click,
            isRowInteractive: () => Boolean(on_row_double_click)
        }
    })

    return (
    <Paper sx={{ borderRadius: 2, overflow: 'hidden', border: 1, borderColor: 'divider' }}>
        {/* Refetch with rows already on screen: component-level indicator, no skeleton/overlay. */}
        <LinearProgress sx={{ height: 3, visibility: loading && rows.length > 0 ? 'visible' : 'hidden' }} />
        <TableContainer sx={{ overflowX: 'auto' }}>
            <Table stickyHeader size="small" sx={{ minWidth: 1320 }}>
                <TableHead>
                    <TableRow>
                        {[
                            residentText(dictionary, 'field_resident_code', 'Mã cư dân'),
                            residentText(dictionary, 'field_full_name', 'Họ tên'),
                            residentText(dictionary, 'field_apartment_code', 'Căn hộ'),
                            residentText(dictionary, 'field_phone', 'Số điện thoại'),
                            residentText(dictionary, 'field_email', 'Email'),
                            residentText(dictionary, 'field_gender', 'Giới tính'),
                            residentText(dictionary, 'field_status', 'Trạng thái'),
                            residentText(dictionary, 'field_app_usage', 'Đã sử dụng App'),
                            residentText(dictionary, 'field_updated_on_utc', 'Cập nhật lúc')
                        ].map(label => (
                            <TableCell key={label} sx={{ bgcolor: 'primary.main', color: 'common.white', fontWeight: 800 }}>
                                {label}
                            </TableCell>
                        ))}
                    </TableRow>
                </TableHead>
                <TableBody
                    aria-busy={loading}
                    sx={loading && rows.length > 0 ? { opacity: 0.55, transition: 'opacity 120ms' } : undefined}
                >
                    {loading && rows.length === 0 ? (
                        Array.from({ length: page_size }).map((_, index) => (
                            <TableRow key={index}>
                                {Array.from({ length: COLUMN_COUNT }).map((__, cell_index) => <TableCell key={cell_index}><Skeleton height={28} /></TableCell>)}
                            </TableRow>
                        ))
                    ) : rows.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={COLUMN_COUNT} align="center" sx={{ py: 6 }}>
                                <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                                    {emptyTitle ?? residentText(dictionary, 'empty_title', 'Không có cư dân')}
                                </Typography>
                                {emptyDescription && (
                                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                        {emptyDescription}
                                    </Typography>
                                )}
                            </TableCell>
                        </TableRow>
                    ) : (
                        rows.map(row => (
                            <TableRow
                                key={row.id}
                                {...table.getRowProps(row)}
                            >
                                <TableCell sx={{ fontWeight: 800 }}>{row.resident_code || '-'}</TableCell>
                                <TableCell>{row.full_name || '-'}</TableCell>
                                <TableCell sx={{ minWidth: 220 }}>
                                    <ResidentApartmentChips dictionary={dictionary} locale={locale} apartments={row.apartments} />
                                </TableCell>
                                <TableCell>{row.phone || '-'}</TableCell>
                                <TableCell>{row.email || '-'}</TableCell>
                                <TableCell>{getResidentGenderDisplay(dictionary, row.gender)}</TableCell>
                                <TableCell><Chip size="small" color={getResidentStatusColor(row.status)} label={getResidentStatusLabel(dictionary, row.status)} /></TableCell>
                                <TableCell>
                                    <Chip
                                        size="small"
                                        variant="outlined"
                                        color={getResidentAppUsageColor(row.app_usage)}
                                        label={getResidentAppUsageLabel(dictionary, row.app_usage)}
                                    />
                                </TableCell>
                                <TableCell>{formatResidentDateTime(row.updated_on_utc || row.created_on_utc)}</TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </TableContainer>
    </Paper>
    )
}

export default ResidentTable
