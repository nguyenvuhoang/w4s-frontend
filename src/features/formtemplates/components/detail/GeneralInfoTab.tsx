'use client'

import ApartmentIcon from '@mui/icons-material/Apartment'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import DescriptionIcon from '@mui/icons-material/Description'
import InsertDriveFileOutlinedIcon from '@mui/icons-material/InsertDriveFileOutlined'
import NotesIcon from '@mui/icons-material/Notes'
import SellOutlinedIcon from '@mui/icons-material/SellOutlined'
import SortIcon from '@mui/icons-material/Sort'
import { Box, Button, Chip, Grid, Paper, Stack, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import { useMemo, useState } from 'react'

import { getLocalizedText } from '@/shared/utils/getLocalizedText'
import SwalAlert from '@/shared/utils/SwalAlert'

import { documentService } from '@/features/documents/services/documentService'
import DocumentPreviewDialog from '@/features/documents/components/DocumentPreviewDialog'
import type { DocumentNodeModel } from '@/features/documents/types'
import { formTemplateText, getFormTemplateStatusColor, getFormTemplateStatusLabel } from '../../formTemplateHelpers'
import type { FormTemplateDetailModel, FormTemplateDictionary } from '../../types'

const InfoItem = ({ icon, label, value, valueNode }: { icon: React.ReactNode; label: string; value?: React.ReactNode; valueNode?: React.ReactNode }) => (
  <Stack
    direction="row"
    spacing={1.5}
    alignItems="flex-start"
    sx={{ p: '14px 16px', borderRadius: 2, border: 1, borderColor: 'divider', bgcolor: 'background.paper', height: '100%' }}
  >
    <Box
      sx={{
        width: 36,
        height: 36,
        borderRadius: '50%',
        bgcolor: theme => alpha(theme.palette.primary.main, 0.12),
        color: 'primary.main',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0
      }}
    >
      {icon}
    </Box>
    <Box sx={{ minWidth: 0 }}>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>{label}</Typography>
      {valueNode ?? <Typography variant="body2" sx={{ fontWeight: 700, mt: 0.25, wordBreak: 'break-word' }}>{value}</Typography>}
    </Box>
  </Stack>
)

type Props = {
  dictionary: FormTemplateDictionary
  locale: string
  formTemplate: FormTemplateDetailModel
}

const GeneralInfoTab = ({ dictionary, locale, formTemplate }: Props) => {
  const [previewFile, setPreviewFile] = useState<DocumentNodeModel | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)

  const statusLabel = getFormTemplateStatusLabel(dictionary, formTemplate.status)
  const statusColor = getFormTemplateStatusColor(formTemplate.status)
  const name = getLocalizedText(formTemplate.name, locale)
  const description = formTemplate.description ? getLocalizedText(formTemplate.description, locale) : '-'

  const templateFileKey = formTemplate.template_file_url?.trim() || ''
  const templateFileName = useMemo(() => templateFileKey.split('/').pop() || '', [templateFileKey])
  const templateFileExtension = useMemo(() => templateFileName.split('.').pop()?.toLowerCase() || '', [templateFileName])

  const templateDocument: DocumentNodeModel | null = useMemo(() => {
    if (!previewFile) return null
    return previewFile
  }, [previewFile])

  const handlePreviewTemplateFile = async () => {
    if (!templateFileKey || previewLoading) return

    setPreviewLoading(true)

    try {
      const presignedUrl = await documentService.get_presigned_download_url(templateFileKey, {
        file_name: templateFileName,
        mode: 'inline'
      })

      setPreviewFile({
        id: 'template-file-preview',
        module_code: 'resident_documents',
        parent_id: '',
        item_type: 'file',
        name: templateFileName || 'file',
        file_name: templateFileName || 'file',
        file_extension: templateFileExtension || null,
        mime_type: templateFileExtension === 'pdf' ? 'application/pdf' : null,
        file_size: null,
        file_url: null,
        preview_url: presignedUrl,
        download_url: null,
        status: 'active',
        created_by: '',
        created_on_utc: '',
        updated_by: '',
        updated_on_utc: ''
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : formTemplateText(dictionary, 'templateFilePreviewError', 'Không thể mở file mẫu. Vui lòng thử lại.')
      SwalAlert('error', message, 'center')
    } finally {
      setPreviewLoading(false)
    }
  }

  return (
    <Stack spacing={3}>
      <Paper sx={{ p: { xs: 2, md: 3 }, borderRadius: 2, border: 1, borderColor: 'divider' }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2 }}>
          {formTemplateText(dictionary, 'generalInfo', 'Thông tin chung')}
        </Typography>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <InfoItem icon={<SellOutlinedIcon fontSize="small" />} label={formTemplateText(dictionary, 'formCode', 'Mã biểu mẫu')} value={formTemplate.form_code || '-'} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <InfoItem icon={<DescriptionIcon fontSize="small" />} label={formTemplateText(dictionary, 'formName', 'Tên biểu mẫu')} value={name || '-'} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <InfoItem icon={<ApartmentIcon fontSize="small" />} label={formTemplateText(dictionary, 'projectId', 'Dự án')} value={formTemplate.project_id || '-'} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <InfoItem icon={<SortIcon fontSize="small" />} label={formTemplateText(dictionary, 'displayOrder', 'Thứ tự')} value={formTemplate.display_order ?? '-'} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <InfoItem
              icon={<CheckCircleOutlineIcon fontSize="small" />}
              label={formTemplateText(dictionary, 'status', 'Trạng thái')}
              valueNode={<Chip size="small" color={statusColor} label={statusLabel} sx={{ mt: 0.5, fontWeight: 700 }} />}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <InfoItem icon={<NotesIcon fontSize="small" />} label={formTemplateText(dictionary, 'description', 'Mô tả')} value={description} />
          </Grid>
        </Grid>
      </Paper>

      <Paper sx={{ p: { xs: 2, md: 3 }, borderRadius: 2, border: 1, borderColor: 'divider' }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
          {formTemplateText(dictionary, 'templateFile', 'File mẫu')}
        </Typography>
        {templateFileKey ? (
          <Button
            type="button"
            disabled={previewLoading}
            onClick={handlePreviewTemplateFile}
            variant="outlined"
            startIcon={<InsertDriveFileOutlinedIcon fontSize="small" />}
            sx={{ textTransform: 'none' }}
          >
            {formTemplateText(dictionary, 'viewTemplateFile', 'Xem file mẫu')}
          </Button>
        ) : (
          <Typography variant="body2" color="text.secondary">-</Typography>
        )}
      </Paper>

      <DocumentPreviewDialog dictionary={dictionary} file={templateDocument} on_close={() => setPreviewFile(null)} />
    </Stack>
  )
}

export default GeneralInfoTab
