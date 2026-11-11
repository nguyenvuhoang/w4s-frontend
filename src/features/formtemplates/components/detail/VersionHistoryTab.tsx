'use client'

import { useState } from 'react'

import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import VisibilityIcon from '@mui/icons-material/Visibility'
import {
  Alert,
  Box,
  Button,
  Chip,
  Collapse,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography
} from '@mui/material'

import JsonViewEditor from '@/shared/components/json-view-editor/JsonViewEditor'
import WorkflowErrorAlert from '@/shared/components/WorkflowErrorAlert'

import { commonText, formTemplateText, getFormTemplateVersionStatusColor, getFormTemplateVersionStatusLabel } from '../../formTemplateHelpers'
import type { FormTemplateDictionary, FormTemplateVersionDetail, FormTemplateVersionSummary } from '../../types'
import type { WorkflowErrorInfo } from '../../hooks/useFormTemplateVersions'

type Props = {
  dictionary: FormTemplateDictionary
  locale: string
  versions: FormTemplateVersionSummary[]
  versionsLoading: boolean
  versionsError: WorkflowErrorInfo | null
  selectedVersionNo: number | null
  versionDetail: FormTemplateVersionDetail | null
  detailLoading: boolean
  isLegacyMode: boolean
  onSelectVersion: (versionNo: number) => void
}

const formatDate = (value: string | null) => {
  if (!value) return '-'

  const date = new Date(value)

  return Number.isNaN(date.getTime()) ? value : date.toLocaleString()
}

const VersionHistoryTab = ({
  dictionary,
  locale,
  versions,
  versionsLoading,
  versionsError,
  selectedVersionNo,
  versionDetail,
  detailLoading,
  isLegacyMode,
  onSelectVersion
}: Props) => {
  const [schemaOpen, setSchemaOpen] = useState(false)

  if (isLegacyMode) {
    return (
      <Alert severity="info">
        {formTemplateText(dictionary, 'versionHistoryLegacyNotice', 'Biểu mẫu chưa có phiên bản nào — đang hiển thị dữ liệu từ schema cũ (legacy). Lịch sử phiên bản sẽ xuất hiện sau khi có phiên bản đầu tiên.')}
      </Alert>
    )
  }

  if (versionsError) {
    return (
      <WorkflowErrorAlert
        title={formTemplateText(dictionary, 'versionsLoadError', 'Không thể tải lịch sử phiên bản.')}
        description={versionsError.message}
        executionId={versionsError.executionId}
        technicalDetails={versionsError.technicalDetails}
        referenceLabel={commonText(dictionary, 'errorReference', 'Mã tra cứu lỗi')}
        copyLabel={commonText(dictionary, 'copyErrorReference', 'Sao chép mã tra cứu')}
        copySuccessMessage={commonText(dictionary, 'copiedErrorReference', 'Đã sao chép mã tra cứu')}
        technicalDetailsLabel={commonText(dictionary, 'technicalDetails', 'Chi tiết kỹ thuật')}
      />
    )
  }

  if (!versionsLoading && versions.length === 0) {
    return (
      <Alert severity="info">
        {formTemplateText(dictionary, 'versionHistoryEmptyState', 'Chưa có phiên bản nào.')}
      </Alert>
    )
  }

  return (
    <Stack spacing={2}>
      <Paper variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: 'action.hover' }}>
              <TableCell>{formTemplateText(dictionary, 'versionNo', 'Phiên bản')}</TableCell>
              <TableCell>{formTemplateText(dictionary, 'status', 'Trạng thái')}</TableCell>
              <TableCell>{formTemplateText(dictionary, 'changeNote', 'Ghi chú')}</TableCell>
              <TableCell>{formTemplateText(dictionary, 'publishedBy', 'Người xuất bản')}</TableCell>
              <TableCell>{formTemplateText(dictionary, 'publishedOn', 'Ngày xuất bản')}</TableCell>
              <TableCell align="right">{formTemplateText(dictionary, 'action', 'Thao tác')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {versions.map(version => {
              const isSelected = version.version_no === selectedVersionNo

              return (
                <TableRow
                  key={version.id}
                  hover
                  onClick={() => onSelectVersion(version.version_no)}
                  sx={{ cursor: 'pointer', bgcolor: isSelected ? 'action.selected' : 'transparent' }}
                >
                  <TableCell sx={{ fontWeight: isSelected ? 700 : 400 }}>v{version.version_no}</TableCell>
                  <TableCell>
                    <Chip size="small" color={getFormTemplateVersionStatusColor(version.status)} label={getFormTemplateVersionStatusLabel(dictionary, version.status)} />
                  </TableCell>
                  <TableCell sx={{ maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{version.change_note || '-'}</TableCell>
                  <TableCell>{version.published_by || '-'}</TableCell>
                  <TableCell>{formatDate(version.published_on_utc)}</TableCell>
                  <TableCell align="right">
                    <Button
                      size="small"
                      startIcon={<VisibilityIcon fontSize="small" />}
                      onClick={event => { event.stopPropagation(); onSelectVersion(version.version_no) }}
                      disabled={detailLoading}
                    >
                      {formTemplateText(dictionary, 'viewVersion', 'Xem')}
                    </Button>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </Paper>

      {versionDetail && versionDetail.version_no === selectedVersionNo && (
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" onClick={() => setSchemaOpen(open => !open)} sx={{ cursor: 'pointer' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              {formTemplateText(dictionary, 'viewingVersionSchema', 'Schema của phiên bản đang chọn')} (v{versionDetail.version_no})
            </Typography>
            {schemaOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </Stack>
          <Collapse in={schemaOpen}>
            <Stack spacing={2} sx={{ mt: 2 }}>
              <Box>
                <Typography variant="caption" color="text.secondary">data_schema</Typography>
                <JsonViewEditor value={versionDetail.data_schema} mode="view" readOnly height={220} />
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">ui_schema</Typography>
                <JsonViewEditor value={versionDetail.ui_schema} mode="view" readOnly height={220} />
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">print_schema</Typography>
                <JsonViewEditor value={versionDetail.print_schema} mode="view" readOnly height={220} />
              </Box>
            </Stack>
          </Collapse>
        </Paper>
      )}
    </Stack>
  )
}

export default VersionHistoryTab
