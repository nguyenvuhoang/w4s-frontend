'use client'

import { Alert, Box, Divider, Grid, Paper, Typography } from '@mui/material'

import type { Locale } from '@/configs/i18n'
import { getLocalizedText } from '@/shared/utils/getLocalizedText'

import type { DataField, FormDataSchema, UiComponent } from '../formSchema.types'
import { formTemplateText } from '../formTemplateHelpers'
import type { FormTemplateDictionary } from '../types'
import FieldRenderer, { type FieldRenderMode } from './FieldRenderer'
import { sanitizeStaticHtml } from './sanitizeHtml'

type Props = {
  components: UiComponent[]
  dataSchema: FormDataSchema
  mode: FieldRenderMode
  locale: Locale | string
  dictionary: FormTemplateDictionary
  sessiontoken?: string
  projectId?: number | null
  values: Record<string, unknown>
  errors?: Record<string, string>
  onFieldChange?: (name: string, value: unknown) => void
}

const COLUMN_SPAN_GRID: Record<number, number> = { 1: 12, 2: 6, 3: 4, 4: 3 }

const findField = (dataSchema: FormDataSchema, fieldId: string): DataField | null => (
  dataSchema.fields.find(field => field.id === fieldId) ?? null
)

const FormComponentTree = ({ components, dataSchema, mode, locale, dictionary, sessiontoken, projectId, values, errors, onFieldChange }: Props) => (
  <>
    {components.map(component => {
      switch (component.type) {
        case 'heading': {
          const variant = component.level === 1 ? 'h5' : component.level === 3 ? 'subtitle1' : 'h6'
          const textAlign = component.align ?? 'left'

          return (
            <Typography key={component.id} variant={variant} sx={{ display: 'block', width: '100%', fontWeight: 800, my: 1, textAlign }}>
              {getLocalizedText(component.text, locale)}
            </Typography>
          )
        }

        case 'static_text': {
          const textAlign = component.align ?? 'left'

          return (
            <Typography key={component.id} variant="body2" sx={{ whiteSpace: 'pre-line', my: 1, textAlign }}>
              {getLocalizedText(component.content, locale)}
            </Typography>
          )
        }

        case 'static_html': {
          const textAlign = component.align ?? 'left'

          return (
            <Box
              key={component.id}
              sx={{
                my: 1,
                textAlign,
                '& p': { m: 0, mb: 1 },
                '& table': { borderCollapse: 'collapse', width: '100%' },
                '& td, & th': { border: '1px solid', borderColor: 'divider', p: 0.5 }
              }}
              dangerouslySetInnerHTML={{ __html: sanitizeStaticHtml(getLocalizedText(component.content, locale)) }}
            />
          )
        }

        case 'divider':
          return <Divider key={component.id} sx={{ my: 2 }} />

        case 'spacer':
          return <Box key={component.id} sx={{ height: component.height ?? 16 }} />

        case 'page_break':
          return (
            <Box
              key={component.id}
              className="e-form-page-break"
              sx={{
                my: 2,
                borderTop: mode === 'preview' ? '2px dashed' : 'none',
                borderColor: 'divider',
                textAlign: 'center'
              }}
            >
              {mode === 'preview' && (
                <Typography variant="caption" color="text.secondary">{formTemplateText(dictionary, 'pageBreakLabel', '— page break —')}</Typography>
              )}
            </Box>
          )

        case 'section':
          return (
            <Paper
              key={component.id}
              variant={component.show_border ? 'outlined' : 'elevation'}
              elevation={0}
              sx={{
                p: component.spacing === 'compact' ? 1.5 : component.spacing === 'relaxed' ? 3 : 2,
                mb: 2,
                bgcolor: component.show_background ? 'action.hover' : 'transparent',
                border: component.show_border ? '1px solid' : 'none',
                borderColor: 'divider'
              }}
            >
              {component.title?.vi && (
                <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 1.5, textAlign: component.title_align ?? 'left' }}>
                  {getLocalizedText(component.title, locale)}
                </Typography>
              )}
              <Grid container spacing={2}>
                {component.children.map(child => {
                  if (child.type === 'field' || child.type === 'repeater') {
                    const field = findField(dataSchema, child.field_id)

                    if (!field) {
                      return (
                        <Grid key={child.id} size={{ xs: 12 }}>
                          <Alert severity="warning">
                            {formTemplateText(dictionary, 'missingFieldNotice', 'Component tham chiếu field không tồn tại:')} {child.field_id}
                          </Alert>
                        </Grid>
                      )
                    }

                    const span = COLUMN_SPAN_GRID[child.column_span ?? 1] ?? 12

                    return (
                      <Grid key={child.id} size={{ xs: 12, md: span }}>
                        <FieldRenderer
                          field={field}
                          mode={mode}
                          locale={locale}
                          dictionary={dictionary}
                          sessiontoken={sessiontoken}
                          projectId={projectId}
                          value={values[field.name]}
                          error={errors?.[field.name]}
                          onChange={mode === 'preview' ? (value => onFieldChange?.(field.name, value)) : undefined}
                        />
                      </Grid>
                    )
                  }

                  return (
                    <Grid key={child.id} size={{ xs: 12 }}>
                      <FormComponentTree
                        components={[child]}
                        dataSchema={dataSchema}
                        mode={mode}
                        locale={locale}
                        dictionary={dictionary}
                        sessiontoken={sessiontoken}
                        projectId={projectId}
                        values={values}
                        errors={errors}
                        onFieldChange={onFieldChange}
                      />
                    </Grid>
                  )
                })}
              </Grid>
            </Paper>
          )

        case 'field':
        case 'repeater': {
          const field = findField(dataSchema, component.field_id)

          if (!field) {
            return (
              <Alert key={component.id} severity="warning" sx={{ mb: 2 }}>
                {formTemplateText(dictionary, 'missingFieldNotice', 'Component tham chiếu field không tồn tại:')} {component.field_id}
              </Alert>
            )
          }

          return (
            <Box key={component.id} sx={{ mb: 2 }}>
              <FieldRenderer
                field={field}
                mode={mode}
                locale={locale}
                dictionary={dictionary}
                sessiontoken={sessiontoken}
                projectId={projectId}
                value={values[field.name]}
                error={errors?.[field.name]}
                onChange={mode === 'preview' ? (value => onFieldChange?.(field.name, value)) : undefined}
              />
            </Box>
          )
        }

        case 'signature_block': {
          const textAlign = component.align ?? 'center'
          const alignItems = textAlign === 'left' ? 'flex-start' : textAlign === 'right' ? 'flex-end' : 'center'

          return (
            <Grid key={component.id} container spacing={2} sx={{ mt: 3, mb: 2 }}>
              {component.signers.map(signer => (
                <Grid key={signer.code} size={{ xs: 12, sm: 12 / Math.max(component.signers.length, 1) }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', textAlign, alignItems, width: '100%' }}>
                    <Typography variant="body2" sx={{ fontWeight: 700, width: '100%' }}>
                      {getLocalizedText(signer.label, locale)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: mode === 'print' ? 6 : 2, width: '100%' }}>
                      {formTemplateText(dictionary, 'signatureHint', '(Ký và ghi rõ họ tên)')}
                    </Typography>
                    <Box
                      sx={{
                        borderTop: '1px solid',
                        borderColor: 'text.secondary',
                        width: '80%',
                        ml: textAlign === 'right' ? 'auto' : textAlign === 'center' ? 'auto' : 0,
                        mr: textAlign === 'left' ? 'auto' : textAlign === 'center' ? 'auto' : 0
                      }}
                    />
                  </Box>
                </Grid>
              ))}
            </Grid>
          )
        }

        default:
          return (
            <Alert key={(component as UiComponent).id} severity="warning" sx={{ mb: 2 }}>
              {formTemplateText(dictionary, 'unsupportedComponentNotice', 'Component chưa được hỗ trợ hiển thị:')} {(component as UiComponent).type}
            </Alert>
          )
      }
    })}
  </>
)

export default FormComponentTree
