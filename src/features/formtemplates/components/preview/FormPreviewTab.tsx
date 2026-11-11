'use client'

import { useState } from 'react'

import DesktopWindowsIcon from '@mui/icons-material/DesktopWindows'
import PhoneIphoneIcon from '@mui/icons-material/PhoneIphone'
import RestartAltIcon from '@mui/icons-material/RestartAlt'
import { Alert, Box, Button, Paper, Stack, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material'

import { getLocalizedText } from '@/shared/utils/getLocalizedText'

import { getUnplacedFields } from '../../builder/treeUtils'
import type { FormDataSchema, FormUiSchema } from '../../formSchema.types'
import { formTemplateText } from '../../formTemplateHelpers'
import FormComponentTree from '../../renderer/FormComponentTree'
import type { FormTemplateDictionary } from '../../types'

type PreviewValuesApi = {
  values: Record<string, unknown>
  errors: Record<string, string>
  setFieldValue: (name: string, value: unknown) => void
  reset: () => void
  validateRequired: (message: string) => boolean
}

type Props = {
  dictionary: FormTemplateDictionary
  locale: string
  sessiontoken?: string
  projectId?: number | null
  dataSchema: FormDataSchema
  uiSchema: FormUiSchema
  preview: PreviewValuesApi
}

const FormPreviewTab = ({ dictionary, locale, sessiontoken, projectId, dataSchema, uiSchema, preview }: Props) => {
  const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop')
  const [validated, setValidated] = useState(false)
  const unplacedFields = getUnplacedFields(dataSchema, uiSchema.components)

  const handleValidate = () => {
    const ok = preview.validateRequired(formTemplateText(dictionary, 'requiredFieldMessage', 'Trường này là bắt buộc.'))

    setValidated(true)

    return ok
  }

  return (
    <Stack spacing={2}>
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" gap={1.5}>
        <ToggleButtonGroup
          size="small"
          exclusive
          value={device}
          onChange={(_, value) => value && setDevice(value)}
        >
          <ToggleButton value="desktop">
            <DesktopWindowsIcon fontSize="small" sx={{ mr: 0.75 }} />
            {formTemplateText(dictionary, 'previewDesktop', 'Desktop')}
          </ToggleButton>
          <ToggleButton value="mobile">
            <PhoneIphoneIcon fontSize="small" sx={{ mr: 0.75 }} />
            {formTemplateText(dictionary, 'previewMobile', 'Mobile')}
          </ToggleButton>
        </ToggleButtonGroup>

        <Stack direction="row" spacing={1}>
          <Button size="small" variant="outlined" onClick={handleValidate}>
            {formTemplateText(dictionary, 'previewValidate', 'Kiểm tra bắt buộc')}
          </Button>
          <Button
            size="small"
            variant="outlined"
            startIcon={<RestartAltIcon />}
            onClick={() => { preview.reset(); setValidated(false) }}
          >
            {formTemplateText(dictionary, 'previewReset', 'Reset preview')}
          </Button>
        </Stack>
      </Stack>

      <Alert severity="info" sx={{ display: { xs: 'flex' } }}>
        {formTemplateText(dictionary, 'previewNotice', 'Đây là dữ liệu xem trước, không được lưu thành hồ sơ thật.')}
      </Alert>

      {validated && Object.values(preview.errors).some(Boolean) && (
        <Alert severity="warning">
          {formTemplateText(dictionary, 'previewValidationFailed', 'Còn trường bắt buộc chưa được điền.')}
        </Alert>
      )}

      {unplacedFields.length > 0 && (
        <Alert severity="warning">
          {formTemplateText(dictionary, 'unplacedFieldsNotice', 'Có {count} field trong data_schema chưa được đưa vào bố cục (ui_schema), nên chưa hiển thị ở Xem trước/Bản in:').replace('{count}', String(unplacedFields.length))}{' '}
          {unplacedFields.map(field => getLocalizedText(field.label, locale) || field.name).join(', ')}
        </Alert>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
        <Paper
          variant="outlined"
          sx={{
            p: { xs: 2, md: 3 },
            width: '100%',
            maxWidth: device === 'mobile' ? 420 : '100%',
            transition: 'max-width .2s ease'
          }}
        >
          {uiSchema.components.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 6 }}>
              {formTemplateText(dictionary, 'previewEmptyState', 'Biểu mẫu chưa có component nào để xem trước.')}
            </Typography>
          ) : (
            <FormComponentTree
              components={uiSchema.components}
              dataSchema={dataSchema}
              mode="preview"
              locale={locale}
              dictionary={dictionary}
              sessiontoken={sessiontoken}
              projectId={projectId}
              values={preview.values}
              errors={validated ? preview.errors : undefined}
              onFieldChange={preview.setFieldValue}
            />
          )}
        </Paper>
      </Box>
    </Stack>
  )
}

export default FormPreviewTab
