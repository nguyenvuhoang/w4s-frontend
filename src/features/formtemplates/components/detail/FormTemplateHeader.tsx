'use client'

import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import PublishIcon from '@mui/icons-material/Publish'
import SaveIcon from '@mui/icons-material/Save'
import VisibilityIcon from '@mui/icons-material/Visibility'
import { Box, Button, Chip, Stack, Typography } from '@mui/material'
import type { ChipProps } from '@mui/material/Chip'

import { formTemplateText } from '../../formTemplateHelpers'
import type { FormTemplateDictionary } from '../../types'

type Props = {
  dictionary: FormTemplateDictionary
  templateName: string
  formCode: string
  versionLabel: string
  statusLabel: string
  statusColor: ChipProps['color']
  dirty: boolean
  saving: boolean
  publishing: boolean
  creatingVersion: boolean
  isReadOnly: boolean
  isLegacyMode: boolean
  onBack: () => void
  onSaveDraft: () => void
  onGoToPreview: () => void
  onPublish: () => void
  onCreateNewVersion: () => void
}

const ft = (dictionary: FormTemplateDictionary, key: string, fallback: string) => formTemplateText(dictionary, key, fallback)

const FormTemplateHeader = ({
  dictionary,
  templateName,
  formCode,
  versionLabel,
  statusLabel,
  statusColor,
  dirty,
  saving,
  publishing,
  creatingVersion,
  isReadOnly,
  isLegacyMode,
  onBack,
  onSaveDraft,
  onGoToPreview,
  onPublish,
  onCreateNewVersion
}: Props) => (
  <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ md: 'center' }} gap={2}>
    <Box sx={{ minWidth: 0 }}>
      <Stack direction="row" gap={1} alignItems="center" flexWrap="wrap">
        <Typography variant="h5" sx={{ fontWeight: 900, color: 'primary.dark' }}>{templateName}</Typography>
        <Chip size="small" variant="outlined" label={formCode} />
        <Chip size="small" label={versionLabel} />
        <Chip size="small" color={statusColor} label={statusLabel} />
      </Stack>
    </Box>

    <Stack direction="row" gap={1} flexWrap="wrap" justifyContent="flex-end">
      <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={onBack}>
        {ft(dictionary, 'backToFormTemplateList', 'Quay lại danh sách biểu mẫu')}
      </Button>
      <Button variant="outlined" startIcon={<VisibilityIcon />} onClick={onGoToPreview}>
        {ft(dictionary, 'previewButton', 'Xem trước')}
      </Button>

      {isReadOnly ? (
        <Button
          variant="contained"
          startIcon={<AddCircleOutlineIcon />}
          onClick={onCreateNewVersion}
          disabled={creatingVersion || isLegacyMode}
        >
          {creatingVersion ? ft(dictionary, 'creatingVersion', 'Đang tạo phiên bản...') : ft(dictionary, 'createNewVersionButton', 'Tạo phiên bản mới')}
        </Button>
      ) : (
        <>
          <Button
            variant="outlined"
            startIcon={<SaveIcon />}
            onClick={onSaveDraft}
            disabled={saving || !dirty}
          >
            {saving ? ft(dictionary, 'savingDraft', 'Đang lưu...') : ft(dictionary, 'saveDraftButton', 'Lưu bản nháp')}
          </Button>
          <Button
            variant="contained"
            startIcon={<PublishIcon />}
            onClick={onPublish}
            disabled={publishing}
          >
            {publishing ? ft(dictionary, 'publishingVersion', 'Đang xuất bản...') : ft(dictionary, 'publishButton', 'Xuất bản')}
          </Button>
        </>
      )}
    </Stack>
  </Stack>
)

export default FormTemplateHeader
