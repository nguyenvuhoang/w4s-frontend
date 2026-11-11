'use client'

import { Box, Stack, Typography } from '@mui/material'

import type { FormDataSchema, FormPrintSchema, FormUiSchema } from '../formSchema.types'
import type { FormTemplateDictionary } from '../types'
import FormComponentTree from '../renderer/FormComponentTree'

type Props = {
  formName: string
  formCode: string
  versionLabel: string
  projectName?: string | null
  dataSchema: FormDataSchema
  uiSchema: FormUiSchema
  printSchema: FormPrintSchema
  locale: string
  dictionary: FormTemplateDictionary
  values: Record<string, unknown>
  labels: { submissionCodePlaceholder: string; qrLabel: string; logoPlaceholder: string }
}

const MM_WIDTH = 210
const MM_HEIGHT = 297

const FormPrintView = ({ formName, formCode, versionLabel, projectName, dataSchema, uiSchema, printSchema, locale, dictionary, values, labels }: Props) => {
  const isLandscape = printSchema.page.orientation === 'landscape'

  return (
    <Box
      className="e-form-print-page"
      sx={{
        width: `${isLandscape ? MM_HEIGHT : MM_WIDTH}mm`,
        minHeight: `${isLandscape ? MM_WIDTH : MM_HEIGHT}mm`,
        mx: 'auto',
        bgcolor: '#fff',
        color: '#111',
        p: `${printSchema.page.margin_top_mm}mm ${printSchema.page.margin_right_mm}mm ${printSchema.page.margin_bottom_mm}mm ${printSchema.page.margin_left_mm}mm`,
        boxSizing: 'border-box'
      }}
    >
      {printSchema.header.enabled && (
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2, borderBottom: '2px solid #111', pb: 1 }}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            {printSchema.header.show_project_logo && (
              <Box sx={{ width: 48, height: 48, border: '1px solid #999', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#999' }}>
                {labels.logoPlaceholder}
              </Box>
            )}
            {printSchema.header.show_project_name && (
              <Typography variant="body2" sx={{ fontWeight: 700 }}>{projectName || '-'}</Typography>
            )}
          </Stack>
          <Stack alignItems="flex-end">
            {printSchema.header.show_form_code && <Typography variant="caption">{formCode}</Typography>}
            {printSchema.header.show_version && <Typography variant="caption">{versionLabel}</Typography>}
          </Stack>
        </Stack>
      )}

      <Typography variant="h6" sx={{ textAlign: 'center', fontWeight: 800, mb: 2 }}>{formName}</Typography>

      <FormComponentTree
        components={uiSchema.components}
        dataSchema={dataSchema}
        mode="print"
        locale={locale}
        dictionary={dictionary}
        values={values}
      />

      {printSchema.options.show_qr_code && (
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
          <Box sx={{ width: 72, height: 72, border: '1px solid #999', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#999' }}>
            {labels.qrLabel}
          </Box>
        </Box>
      )}

      {printSchema.footer.enabled && (
        <Stack direction="row" justifyContent="space-between" sx={{ mt: 3, pt: 1, borderTop: '1px solid #999' }}>
          {printSchema.footer.show_submission_code && <Typography variant="caption" color="text.secondary">{labels.submissionCodePlaceholder}</Typography>}
          {printSchema.footer.show_page_number && <Typography variant="caption" color="text.secondary">1/1</Typography>}
        </Stack>
      )}
    </Box>
  )
}

export default FormPrintView
