import {
    Chip,
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

import { useSearchTableRowConfig } from '@/shared/components/table'

import type { AnnouncementDictionary, AnnouncementItem } from '../types'
import {
    announcementText,
    commonText,
    formatAnnouncementDate,
    getAnnouncementCategoryLabel,
    getAnnouncementStatusColor,
    getAnnouncementStatusLabel,
    getBooleanLabel,
    getAnnouncementCategoryColor
} from './announcementListHelpers'

type Props = {
    dictionary: AnnouncementDictionary
    locale: string
    rows: AnnouncementItem[]
    loading: boolean
    pageIndex: number
    pageSize: number
    onView: (row: AnnouncementItem) => void
}

const columns = [
    'no',
    'project_code',
    'title',
    'summary',
    'category',
    'status',
    'published_on_utc',
    'is_pinned',
    'require_read_confirmation'
] as const

const headerCellSx = {
    bgcolor: 'primary.main',
    color: 'common.white',
    fontWeight: 800,
    whiteSpace: 'nowrap'
}

const getColumnLabel = (dictionary: AnnouncementDictionary, column: typeof columns[number]) => {
    const labels: Record<typeof columns[number], string> = {
        no: commonText(dictionary, 'nodot', 'STT'),
        project_code: announcementText(dictionary, 'project_code', 'Mã dự án'),
        title: announcementText(dictionary, 'title', 'Tiêu đề'),
        summary: announcementText(dictionary, 'summary', 'Tóm tắt'),
        category: announcementText(dictionary, 'category', 'Danh mục'),
        status: announcementText(dictionary, 'status', 'Trạng thái'),
        published_on_utc: announcementText(dictionary, 'published_on_utc', 'Ngày đăng'),
        is_pinned: announcementText(dictionary, 'is_pinned', 'Ghim'),
        require_read_confirmation: announcementText(dictionary, 'require_read_confirmation', 'Yêu cầu xác nhận đọc')
    }

    return labels[column]
}

const AnnouncementsTable = ({ dictionary, locale, rows, loading, pageIndex, pageSize, onView }: Props) => {
    const table = useSearchTableRowConfig<AnnouncementItem>({
        rowInteraction: { onOpenDetail: onView }
    })

    return (
        <Paper sx={{ borderRadius: 2, overflow: 'hidden', border: 1, borderColor: 'divider' }}>
            <TableContainer>
                <Table stickyHeader size="small" sx={{ minWidth: 1280 }}>
                    <TableHead>
                        <TableRow>
                            {columns.map(column => (
                                <TableCell key={column} sx={headerCellSx}>
                                    {getColumnLabel(dictionary, column)}
                                </TableCell>
                            ))}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            Array.from({ length: Math.min(pageSize, 10) }).map((_, rowIndex) => (
                                <TableRow key={rowIndex}>
                                    {columns.map(column => <TableCell key={column}><Skeleton height={28} /></TableCell>)}
                                </TableRow>
                            ))
                        ) : rows.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={columns.length} align="center" sx={{ py: 6 }}>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                                        {announcementText(dictionary, 'no_announcements_found', 'Không tìm thấy thông báo')}
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        ) : rows.map((row, index) => {
                            const sequenceNumber = pageIndex * pageSize + index + 1
                            return (
                                <TableRow
                                    key={row.id || `${row.project_code}-${index}`}
                                    {...table.getRowProps(row)}
                                >
                                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{sequenceNumber}</TableCell>
                                    <TableCell sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>{row.project_code || '-'}</TableCell>
                                    <TableCell sx={{ minWidth: 220, fontWeight: 700 }}>{row.title || '-'}</TableCell>
                                    <TableCell sx={{ minWidth: 260 }}>{row.summary || '-'}</TableCell>
                                    <TableCell>
                                        <Chip
                                            size="small" variant="outlined"
                                            label={getAnnouncementCategoryLabel(row.category, locale, dictionary)}
                                            color={getAnnouncementCategoryColor(row.category)}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            size="small"
                                            color={getAnnouncementStatusColor(row.status)}
                                            label={getAnnouncementStatusLabel(row.status, locale, dictionary)}
                                        />
                                    </TableCell>
                                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatAnnouncementDate(row.published_on_utc, locale)}</TableCell>
                                    <TableCell>
                                        <Chip size="small" variant="outlined" label={getBooleanLabel(row.is_pinned, locale, dictionary)} />
                                    </TableCell>
                                    <TableCell>
                                        <Chip size="small" variant="outlined" label={getBooleanLabel(row.require_read_confirmation, locale, dictionary)} />
                                    </TableCell>
                                </TableRow>
                            )
                        } )}
                    </TableBody>
                </Table>
            </TableContainer>
        </Paper>
    )
}

export default AnnouncementsTable
