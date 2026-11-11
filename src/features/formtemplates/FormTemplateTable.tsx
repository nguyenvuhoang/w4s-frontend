import LaunchIcon from '@mui/icons-material/Launch'
import {
  Chip,
  CircularProgress,
  Link as MuiLink,
  Paper,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip
} from '@mui/material'

import { useSearchTableRowConfig } from '@/shared/components/table'

import {
  displayValue,
  formatNumber,
  formTemplateText,
  getFormTemplateStatusColor,
  getFormTemplateStatusLabel,
  getSchemaSummary
} from './formTemplateHelpers'
import type { FormTemplateDictionary, FormTemplateItem } from './types'

type Props = {
  dictionary: FormTemplateDictionary
  locale: string
  rows: FormTemplateItem[]
  loading?: boolean
  navigatingId?: number | null
  onRowDoubleClick?: (row: FormTemplateItem) => void
}

const TruncatedCell = ({ value, maxWidth = 260 }: { value: unknown; maxWidth?: number }) => {
  const text = displayValue(value)

  if (text === '-') return <>-</>

  return (
    <Tooltip title={text} disableInteractive>
      <span
        style={{
          display: 'block',
          maxWidth,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}
      >
        {text}
      </span>
    </Tooltip>
  )
}

const FormTemplateTable = ({
  dictionary,
  locale,
  rows,
  loading = false,
  navigatingId = null,
  onRowDoubleClick
}: Props) => {
  const columns = [
    formTemplateText(dictionary, 'formCode', 'Mã biểu mẫu'),
    formTemplateText(dictionary, 'formName', 'Tên biểu mẫu'),
    formTemplateText(dictionary, 'description', 'Mô tả'),
    formTemplateText(dictionary, 'templateFile', 'File mẫu'),
    formTemplateText(dictionary, 'schema', 'Schema'),
    formTemplateText(dictionary, 'displayOrder', 'Thứ tự'),
    formTemplateText(dictionary, 'status', 'Trạng thái')
  ]
  const viewTemplateFileLabel = formTemplateText(dictionary, 'viewTemplateFile', 'Xem file mẫu')
  const table = useSearchTableRowConfig<FormTemplateItem>({
    rowInteraction: {
      onOpenDetail: onRowDoubleClick,
      isRowInteractive: () => Boolean(onRowDoubleClick)
    }
  })

  return (
    <Paper sx={{ borderRadius: 2, overflow: 'hidden', border: 1, borderColor: 'divider' }}>
      <TableContainer sx={{ maxWidth: '100%' }}>
        <Table stickyHeader size="small" sx={{ minWidth: 960 }}>
          <TableHead>
            <TableRow>
              {columns.map(label => (
                <TableCell key={label} sx={{ bgcolor: 'primary.main', color: 'common.white', fontWeight: 800 }}>
                  {label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              Array.from({ length: 6 }).map((_, index) => (
                <TableRow key={index}>
                  <TableCell colSpan={columns.length}>
                    <Skeleton height={34} />
                  </TableCell>
                </TableRow>
              ))
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} align="center" sx={{ py: 6 }}>
                  {formTemplateText(dictionary, 'emptyFormTemplates', 'Không tìm thấy biểu mẫu nào.')}
                </TableCell>
              </TableRow>
            ) : (
              rows.map(row => {
                const isNavigating = navigatingId === row.id
                const schemaSummary = getSchemaSummary(dictionary, row.schema_json)

                return (
                  <TableRow
                    key={row.id}
                    {...table.getRowProps(row)}
                  >
                    <TableCell sx={{ fontWeight: 800 }}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <span>{displayValue(row.form_code)}</span>
                        {isNavigating && <CircularProgress size={14} thickness={5} />}
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <TruncatedCell value={row.name} maxWidth={220} />
                    </TableCell>
                    <TableCell>
                      <TruncatedCell value={row.description} maxWidth={260} />
                    </TableCell>
                    <TableCell>
                      {row.template_file_url ? (
                        <MuiLink
                          href={row.template_file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          underline="hover"
                          onClick={event => event.stopPropagation()}
                          sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, fontWeight: 700 }}
                        >
                          {viewTemplateFileLabel}
                          <LaunchIcon sx={{ fontSize: 14 }} />
                        </MuiLink>
                      ) : '-'}
                    </TableCell>
                    <TableCell>
                      <Chip size="small" color={schemaSummary.color} label={schemaSummary.label} />
                    </TableCell>
                    <TableCell>{formatNumber(row.display_order, locale)}</TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        color={getFormTemplateStatusColor(row.status)}
                        label={getFormTemplateStatusLabel(dictionary, row.status)}
                      />
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  )
}

export default FormTemplateTable
