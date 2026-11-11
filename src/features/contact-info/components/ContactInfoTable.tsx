import AlternateEmailIcon from '@mui/icons-material/AlternateEmail'
import AccessTimeIcon from '@mui/icons-material/AccessTime'
import PhoneIcon from '@mui/icons-material/Phone'
import {
  Chip,
  Paper,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography
} from '@mui/material'

import { useSearchTableRowConfig } from '@/shared/components/table'

import type { ContactInfoDictionary, ContactInfoItem } from '../types'
import {
  contactInfoText,
  displayText,
  getContactStatusColor,
  getContactStatusLabel,
  getContactTypeLabel
} from './contactInfoHelpers'

type Props = {
  dictionary: ContactInfoDictionary
  rows: ContactInfoItem[]
  loading: boolean
  pageIndex: number
  pageSize: number
  onOpenDetail: (row: ContactInfoItem) => void
}

const headerCellSx = {
  bgcolor: 'primary.main',
  color: 'common.white',
  fontWeight: 800,
  whiteSpace: 'nowrap'
}

const textCellSx = {
  overflowWrap: 'anywhere',
  whiteSpace: 'normal',
  lineHeight: 1.45
}

const nowrapCellSx = {
  whiteSpace: 'nowrap'
}

const columns = [
  'no',
  'contact_type',
  'name',
  'phone',
  'email',
  'address',
  'working_hours',
  'note',
  'display_order',
  'status'
] as const

const columnSx: Partial<Record<(typeof columns)[number], object>> = {
  no: { width: 72 },
  contact_type: { width: 150 },
  name: { width: 180 },
  phone: { width: 150 },
  email: { width: 210 },
  address: { width: 220 },
  working_hours: { width: 170 },
  note: { width: 220 },
  display_order: { width: 120 },
  status: { width: 130 }
}

const ContactInfoTable = ({ dictionary, rows, loading, pageIndex, pageSize, onOpenDetail }: Props) => {
  const table = useSearchTableRowConfig<ContactInfoItem>({
    rowInteraction: {
      onOpenDetail,
      isRowInteractive: row => Boolean(row.id)
    }
  })

  return (
  <Paper sx={{ borderRadius: 2, overflow: 'hidden', border: 1, borderColor: 'divider' }}>
    <TableContainer>
      <Table stickyHeader size="small" sx={{ minWidth: 980 }}>
        <TableHead>
          <TableRow>
            {columns.map(column => (
              <TableCell
                key={column}
                sx={{ ...headerCellSx, ...columnSx[column] }}
                align={column === 'display_order' ? 'right' : 'left'}
              >
                {contactInfoText(dictionary, `field_${column}`, column)}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {loading ? (
            Array.from({ length: pageSize }).map((_, rowIndex) => (
              <TableRow key={rowIndex}>
                {columns.map(column => <TableCell key={column}><Skeleton height={28} /></TableCell>)}
              </TableRow>
            ))
          ) : rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length} align="center" sx={{ py: 6 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                  {contactInfoText(dictionary, 'empty_contacts_title', 'No project contacts found.')}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  {contactInfoText(dictionary, 'empty_contacts_description', 'This project has no contact information yet.')}
                </Typography>
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row, index) => (
              <TableRow
                key={`${row.project_id}-${row.id ?? row.contact_type}-${index}`}
                {...table.getRowProps(row)}
              >
                <TableCell sx={nowrapCellSx}>{(pageIndex - 1) * pageSize + index + 1}</TableCell>
                <TableCell sx={nowrapCellSx}>{getContactTypeLabel(dictionary, row.contact_type)}</TableCell>
                <TableCell sx={textCellSx}>
                  <Typography sx={{ fontWeight: 800 }}>{displayText(row.name)}</Typography>
                </TableCell>
                <TableCell sx={nowrapCellSx}>
                  <Stack direction="row" alignItems="center" gap={0.75}>
                    <PhoneIcon sx={{ fontSize: 17, color: 'text.secondary' }} />
                    <span>{displayText(row.phone)}</span>
                  </Stack>
                </TableCell>
                <TableCell sx={textCellSx}>
                  <Stack direction="row" alignItems="center" gap={0.75}>
                    <AlternateEmailIcon sx={{ fontSize: 17, color: 'text.secondary' }} />
                    <span>{displayText(row.email)}</span>
                  </Stack>
                </TableCell>
                <TableCell sx={textCellSx}>{displayText(row.address)}</TableCell>
                <TableCell sx={nowrapCellSx}>
                  <Stack direction="row" alignItems="center" gap={0.75}>
                    <AccessTimeIcon sx={{ fontSize: 17, color: 'text.secondary' }} />
                    <span>{displayText(row.working_hours)}</span>
                  </Stack>
                </TableCell>
                <TableCell sx={textCellSx}>{displayText(row.note)}</TableCell>
                <TableCell sx={nowrapCellSx} align="right">{displayText(row.display_order)}</TableCell>
                <TableCell sx={nowrapCellSx}>
                  <Chip
                    size="small"
                    color={getContactStatusColor(row.status)}
                    label={getContactStatusLabel(dictionary, row.status)}
                  />
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
  </Paper>
  )
}

export default ContactInfoTable
