'use client'

import { useEffect } from 'react'

import PrintIcon from '@mui/icons-material/Print'
import { Button, Checkbox, FormControlLabel, Grid, MenuItem, Paper, Stack, TextField, Typography } from '@mui/material'

import type { FormDataSchema, FormPrintSchema, FormUiSchema, PrintOrientation } from '../../formSchema.types'
import { formTemplateText } from '../../formTemplateHelpers'
import FormPrintPortal from '../../print/FormPrintPortal'
import FormPrintView from '../../print/FormPrintView'
import { ensurePrintStylesInjected, removePrintStyles } from '../../print/printSchemaCss'
import type { FormTemplateDictionary } from '../../types'

type Props = {
  dictionary: FormTemplateDictionary
  locale: string
  formName: string
  formCode: string
  versionLabel: string
  projectName?: string | null
  dataSchema: FormDataSchema
  uiSchema: FormUiSchema
  printSchema: FormPrintSchema
  setPrintSchema: (updater: (current: FormPrintSchema) => FormPrintSchema) => void
  values: Record<string, unknown>
  readOnly: boolean
}

const ft = (dictionary: FormTemplateDictionary, key: string, fallback: string) => formTemplateText(dictionary, key, fallback)

const PrintConfigTab = ({ dictionary, locale, formName, formCode, versionLabel, projectName, dataSchema, uiSchema, printSchema, setPrintSchema, values, readOnly }: Props) => {
  useEffect(() => {
    ensurePrintStylesInjected(printSchema)

    return () => removePrintStyles()
  }, [printSchema])

  const updatePage = (patch: Partial<FormPrintSchema['page']>) => setPrintSchema(current => ({ ...current, page: { ...current.page, ...patch } }))
  const updateHeader = (patch: Partial<FormPrintSchema['header']>) => setPrintSchema(current => ({ ...current, header: { ...current.header, ...patch } }))
  const updateFooter = (patch: Partial<FormPrintSchema['footer']>) => setPrintSchema(current => ({ ...current, footer: { ...current.footer, ...patch } }))
  const updateOptions = (patch: Partial<FormPrintSchema['options']>) => setPrintSchema(current => ({ ...current, options: { ...current.options, ...patch } }))

  return (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12, md: 4 }}>
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Stack spacing={2}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{ft(dictionary, 'printPageSection', 'Trang in')}</Typography>
            <TextField select size="small" label={ft(dictionary, 'printOrientation', 'Hướng giấy')} value={printSchema.page.orientation} disabled={readOnly}
              onChange={event => updatePage({ orientation: event.target.value as PrintOrientation })}>
              <MenuItem value="portrait">{ft(dictionary, 'printPortrait', 'Dọc (Portrait)')}</MenuItem>
              <MenuItem value="landscape">{ft(dictionary, 'printLandscape', 'Ngang (Landscape)')}</MenuItem>
            </TextField>
            <Stack direction="row" spacing={1}>
              <TextField type="number" size="small" label={ft(dictionary, 'marginTop', 'Lề trên (mm)')} value={printSchema.page.margin_top_mm} disabled={readOnly}
                onChange={event => updatePage({ margin_top_mm: Number(event.target.value) || 0 })} />
              <TextField type="number" size="small" label={ft(dictionary, 'marginRight', 'Lề phải (mm)')} value={printSchema.page.margin_right_mm} disabled={readOnly}
                onChange={event => updatePage({ margin_right_mm: Number(event.target.value) || 0 })} />
            </Stack>
            <Stack direction="row" spacing={1}>
              <TextField type="number" size="small" label={ft(dictionary, 'marginBottom', 'Lề dưới (mm)')} value={printSchema.page.margin_bottom_mm} disabled={readOnly}
                onChange={event => updatePage({ margin_bottom_mm: Number(event.target.value) || 0 })} />
              <TextField type="number" size="small" label={ft(dictionary, 'marginLeft', 'Lề trái (mm)')} value={printSchema.page.margin_left_mm} disabled={readOnly}
                onChange={event => updatePage({ margin_left_mm: Number(event.target.value) || 0 })} />
            </Stack>

            <Typography variant="subtitle2" sx={{ fontWeight: 700, mt: 1 }}>{ft(dictionary, 'printHeaderSection', 'Header')}</Typography>
            <FormControlLabel control={<Checkbox checked={printSchema.header.enabled} disabled={readOnly} onChange={event => updateHeader({ enabled: event.target.checked })} />} label={ft(dictionary, 'headerEnabled', 'Hiển thị header')} />
            <FormControlLabel control={<Checkbox checked={printSchema.header.show_project_logo} disabled={readOnly} onChange={event => updateHeader({ show_project_logo: event.target.checked })} />} label={ft(dictionary, 'showProjectLogo', 'Logo dự án')} />
            <FormControlLabel control={<Checkbox checked={printSchema.header.show_project_name} disabled={readOnly} onChange={event => updateHeader({ show_project_name: event.target.checked })} />} label={ft(dictionary, 'showProjectName', 'Tên Ban quản lý/dự án')} />
            <FormControlLabel control={<Checkbox checked={printSchema.header.show_form_code} disabled={readOnly} onChange={event => updateHeader({ show_form_code: event.target.checked })} />} label={ft(dictionary, 'showFormCode', 'Mã biểu mẫu')} />
            <FormControlLabel control={<Checkbox checked={printSchema.header.show_version} disabled={readOnly} onChange={event => updateHeader({ show_version: event.target.checked })} />} label={ft(dictionary, 'showVersion', 'Số phiên bản')} />

            <Typography variant="subtitle2" sx={{ fontWeight: 700, mt: 1 }}>{ft(dictionary, 'printFooterSection', 'Footer')}</Typography>
            <FormControlLabel control={<Checkbox checked={printSchema.footer.enabled} disabled={readOnly} onChange={event => updateFooter({ enabled: event.target.checked })} />} label={ft(dictionary, 'footerEnabled', 'Hiển thị footer')} />
            <FormControlLabel control={<Checkbox checked={printSchema.footer.show_submission_code} disabled={readOnly} onChange={event => updateFooter({ show_submission_code: event.target.checked })} />} label={ft(dictionary, 'showSubmissionCode', 'Mã hồ sơ (khi có submission)')} />
            <FormControlLabel control={<Checkbox checked={printSchema.footer.show_page_number} disabled={readOnly} onChange={event => updateFooter({ show_page_number: event.target.checked })} />} label={ft(dictionary, 'showPageNumber', 'Số trang')} />

            <Typography variant="subtitle2" sx={{ fontWeight: 700, mt: 1 }}>{ft(dictionary, 'printOptionsSection', 'Tuỳ chọn khác')}</Typography>
            <FormControlLabel control={<Checkbox checked={printSchema.options.avoid_section_page_break} disabled={readOnly} onChange={event => updateOptions({ avoid_section_page_break: event.target.checked })} />} label={ft(dictionary, 'avoidSectionBreak', 'Hạn chế cắt Section giữa 2 trang')} />
            <FormControlLabel control={<Checkbox checked={printSchema.options.repeat_table_header} disabled={readOnly} onChange={event => updateOptions({ repeat_table_header: event.target.checked })} />} label={ft(dictionary, 'repeatTableHeader', 'Lặp lại header bảng khi qua trang')} />
            <FormControlLabel control={<Checkbox checked={printSchema.options.show_qr_code} disabled={readOnly} onChange={event => updateOptions({ show_qr_code: event.target.checked })} />} label={ft(dictionary, 'showQrCode', 'Hiển thị vị trí QR code')} />

            <Button variant="contained" startIcon={<PrintIcon />} onClick={() => window.print()}>
              {ft(dictionary, 'printButton', 'In / Lưu PDF')}
            </Button>
          </Stack>
        </Paper>
      </Grid>

      <Grid size={{ xs: 12, md: 8 }}>
        <Paper variant="outlined" sx={{ p: 2, bgcolor: '#e5e7eb', display: 'flex', justifyContent: 'center', overflow: 'auto' }}>
          <FormPrintView
            formName={formName}
            formCode={formCode}
            versionLabel={versionLabel}
            projectName={projectName}
            dataSchema={dataSchema}
            uiSchema={uiSchema}
            printSchema={printSchema}
            locale={locale}
            dictionary={dictionary}
            values={values}
            labels={{
              submissionCodePlaceholder: ft(dictionary, 'submissionCodePlaceholder', 'Mã hồ sơ: (chưa có)'),
              qrLabel: ft(dictionary, 'qrPlaceholderLabel', 'QR'),
              logoPlaceholder: ft(dictionary, 'logoPlaceholderLabel', 'LOGO')
            }}
          />
        </Paper>
      </Grid>

      <FormPrintPortal>
        <FormPrintView
          formName={formName}
          formCode={formCode}
          versionLabel={versionLabel}
          projectName={projectName}
          dataSchema={dataSchema}
          uiSchema={uiSchema}
          printSchema={printSchema}
          locale={locale}
          dictionary={dictionary}
          values={values}
          labels={{
            submissionCodePlaceholder: ft(dictionary, 'submissionCodePlaceholder', 'Mã hồ sơ: (chưa có)'),
            qrLabel: ft(dictionary, 'qrPlaceholderLabel', 'QR'),
            logoPlaceholder: ft(dictionary, 'logoPlaceholderLabel', 'LOGO')
          }}
        />
      </FormPrintPortal>
    </Grid>
  )
}

export default PrintConfigTab
