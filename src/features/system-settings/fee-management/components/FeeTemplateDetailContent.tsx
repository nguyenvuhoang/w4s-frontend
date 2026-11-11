'use client'

import ArrowBackRounded from '@mui/icons-material/ArrowBackRounded'
import ContentCopyRounded from '@mui/icons-material/ContentCopyRounded'
import DeleteOutlineRounded from '@mui/icons-material/DeleteOutlineRounded'
import EditRounded from '@mui/icons-material/EditRounded'
import MarkEmailReadRounded from '@mui/icons-material/MarkEmailReadRounded'
import {
  Alert,
  Box,
  Breadcrumbs,
  Button,
  Chip,
  Divider,
  Grid,
  Link as MuiLink,
  Paper,
  Stack,
  Typography
} from '@mui/material'
import NextLink from 'next/link'
import type { Session } from 'next-auth'
import type { ReactNode } from 'react'

import { useRouter } from '@shared/hooks/useRouter'
import WorkflowErrorAlert from '@/shared/components/WorkflowErrorAlert'
import type { WorkflowErrorDetail } from '@/shared/utils/workflowError'
import type { SystemSettingsDictionary } from '@/views/pages/system-settings/systemSettingsModules'

import { FEE_TEMPLATE_GROUP, FEE_TEMPLATE_LANGUAGES, FEE_TEMPLATE_TOKEN, findUsedFeeTemplateVariables, feeTemplatesHref } from '../feeTemplate.constants'
import type { FeeTemplateItem } from '../feeTemplate.service'
import { feeSettingsHref, feeSettingsText } from '../feeSettingsModules'
import { useFeeTemplateDelete } from '../hooks/useFeeTemplateDelete'
import {
  getNotificationTemplateCodeListCaption,
  getNotificationTemplateStatusCaption,
  useNotificationTemplateCodeLists
} from '../hooks/useNotificationTemplateCodeLists'
import FeeTemplatePreview from './FeeTemplatePreview'

type FeeTemplateDetailContentProps = {
  dictionary: SystemSettingsDictionary
  locale: string
  session: Session | null
  template: FeeTemplateItem | null
  notFound: boolean
  error: WorkflowErrorDetail | null
}

const DetailField = ({ label, children, wide = false }: { label: string; children: ReactNode; wide?: boolean }) => (
  <Grid size={wide ? { xs: 12 } : { xs: 12, sm: 6, md: 4 }}>
    <Stack spacing={0.75}>
      <Typography variant='caption' color='text.secondary' sx={{ fontWeight: 700, textTransform: 'uppercase' }}>{label}</Typography>
      <Box sx={{ minHeight: 28 }}>{children}</Box>
    </Stack>
  </Grid>
)

/** Template detail (WF_BO_GET_NOTIFICATION_TEMPLATE_BY_ID) with Edit / Clone / Delete / Back in the header. */
const FeeTemplateDetailContent = ({ dictionary, locale, session, template, notFound, error }: FeeTemplateDetailContentProps) => {
  const text = (key: string, fallback: string) => feeSettingsText(dictionary, key, fallback)
  const router = useRouter()
  const listHref = feeTemplatesHref(locale)
  const codeLists = useNotificationTemplateCodeLists(locale)
  const { deleteTemplate, deleting } = useFeeTemplateDelete({
    dictionary,
    sessiontoken: session?.user?.token ?? undefined,
    language: locale,
    onDeleted: () => {
      router.push(listHref)
      router.refresh()
    }
  })

  const usedVariables = template
    ? findUsedFeeTemplateVariables(template.subject, template.body_html, ...FEE_TEMPLATE_LANGUAGES.flatMap(language => [template.subject_translations[language], template.body_translations[language]]))
    : []

  return (
    <Stack spacing={4}>
      <Stack spacing={1.5}>
        <Breadcrumbs sx={{ mb: 1 }}>
          <MuiLink component={NextLink} href={`/${locale}/system-settings`} underline='hover'>
            {dictionary.system_settings_modules?.breadcrumb_system_settings ?? 'System Settings'}
          </MuiLink>
          <MuiLink component={NextLink} href={feeSettingsHref(locale)} underline='hover'>{text('hub_title', 'Fee Management')}</MuiLink>
          <MuiLink component={NextLink} href={listHref} underline='hover'>{text('module_fee_templates_title', 'Fee templates')}</MuiLink>
          <Typography color='text.primary'>{template?.template_code || text('template_detail_title', 'Template detail')}</Typography>
        </Breadcrumbs>

        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent='space-between' alignItems={{ xs: 'stretch', md: 'flex-start' }} gap={3}>
          <Stack direction='row' gap={1.5} alignItems='flex-start'>
            <MarkEmailReadRounded color='primary' sx={{ fontSize: 38, mt: 0.25 }} />
            <Box>
              <Typography variant='h4' sx={{ fontWeight: 700, mb: 1 }}>{text('template_detail_title', 'Template detail')}</Typography>
              <Typography variant='body1' color='text.secondary'>{text('template_detail_description', 'Notification template information and available actions.')}</Typography>
            </Box>
          </Stack>
          <Stack direction={{ xs: 'column', sm: 'row' }} gap={1} sx={{ flexShrink: 0 }}>
            <Button component={NextLink} href={listHref} variant='outlined' startIcon={<ArrowBackRounded />}>{text('back', 'Back')}</Button>
            {template?.id && (
              <>
                <Button variant='outlined' color='error' startIcon={<DeleteOutlineRounded />} disabled={deleting} onClick={() => deleteTemplate(template)}>
                  {deleting ? text('deleting', 'Deleting...') : text('delete', 'Delete')}
                </Button>
                <Button component={NextLink} href={feeTemplatesHref(locale, `/new?clone=${template.id}`)} variant='outlined' startIcon={<ContentCopyRounded />}>
                  {text('clone_action', 'Clone')}
                </Button>
                <Button component={NextLink} href={feeTemplatesHref(locale, `/${template.id}/edit`)} variant='contained' startIcon={<EditRounded />}>
                  {text('edit', 'Edit')}
                </Button>
              </>
            )}
          </Stack>
        </Stack>
      </Stack>

      {error && (
        <WorkflowErrorAlert
          title={text('template_detail_load_failed', 'Unable to load the template.')}
          message={error.message}
          workflowId={error.workflowId}
          errorCode={error.errorCode}
          executionId={error.executionId}
          executionIdLabel={dictionary.common?.executionid ?? dictionary.common?.execution_id ?? 'Execution ID'}
          retryLabel={dictionary.common?.retry ?? 'Retry'}
          onRetry={() => router.refresh()}
        />
      )}
      {notFound && <Alert severity='warning' variant='outlined' sx={{ borderRadius: 2 }}>{text('template_not_found', 'The template does not exist or has been deleted.')}</Alert>}
      {codeLists.error && <Alert severity='error' variant='outlined'>{text('template_codelist_load_failed', 'Unable to load notification template options.')}</Alert>}

      {template && (
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, lg: 7 }}>
            <Paper variant='outlined' sx={{ p: { xs: 2, md: 3 }, borderRadius: 2 }}>
              <Stack spacing={3}>
                <Stack direction='row' justifyContent='space-between' gap={2}>
                  <Stack spacing={0.5}>
                    <Typography variant='h5' sx={{ fontWeight: 800, color: 'primary.main' }}>{template.template_name || '-'}</Typography>
                    <Typography variant='body2' color='text.secondary'>{template.template_code || '-'}</Typography>
                  </Stack>
                  {template.is_default && <Chip size='small' color='primary' variant='outlined' label={text('field_is_default', 'Default template')} sx={{ alignSelf: 'center' }} />}
                </Stack>
                <Divider />
                <Grid container spacing={3}>
                  <DetailField label={text('field_template_code', 'Template code')}><Typography sx={{ fontWeight: 700 }}>{template.template_code || '-'}</Typography></DetailField>
                  <DetailField label={text('field_template_name', 'Template name')}><Typography>{template.template_name || '-'}</Typography></DetailField>
                  <DetailField label={text('field_template_group', 'Template group')}><Typography>{getNotificationTemplateCodeListCaption(codeLists.groupCaptionMap, template.template_group || FEE_TEMPLATE_GROUP)}</Typography></DetailField>
                  <DetailField label={text('field_channel', 'Channel')}><Typography>{getNotificationTemplateCodeListCaption(codeLists.channelCaptionMap, template.channel)}</Typography></DetailField>
                  <DetailField label={text('field_language', 'Language')}><Typography>{template.language || '-'}</Typography></DetailField>
                  <DetailField label={text('field_status', 'Status')}><Typography>{getNotificationTemplateStatusCaption(codeLists.statusCaptionMap, template.status)}</Typography></DetailField>
                  <DetailField label={text('field_is_default', 'Default template')}><Typography>{template.is_default ? text('yes', 'Yes') : text('no_value', 'No')}</Typography></DetailField>
                  <DetailField label={text('field_subject', 'Subject')} wide><Typography sx={{ overflowWrap: 'anywhere' }}>{template.subject || '-'}</Typography></DetailField>
                  <DetailField label={text('field_body_text', 'Content')} wide>
                    <Box component='pre' sx={{ m: 0, p: 1.5, borderRadius: 1, bgcolor: 'action.hover', whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', fontSize: 13, maxHeight: 280, overflow: 'auto' }}>
                      {template.body_html || '-'}
                    </Box>
                  </DetailField>
                  <DetailField label={text('variables_used', 'Variables used')} wide>
                    {usedVariables.length > 0 ? (
                      <Stack direction='row' flexWrap='wrap' gap={1}>
                        {usedVariables.map(key => <Chip key={key} size='small' variant='outlined' label={`${text(`variable_${key}`, key)} · ${FEE_TEMPLATE_TOKEN(key)}`} />)}
                      </Stack>
                    ) : <Typography color='text.secondary'>-</Typography>}
                  </DetailField>
                </Grid>
              </Stack>
            </Paper>
          </Grid>
          <Grid size={{ xs: 12, lg: 5 }}>
            <Paper variant='outlined' sx={{ p: { xs: 2, md: 3 }, borderRadius: 2 }}>
              <FeeTemplatePreview dictionary={dictionary} channel={template.channel} subjects={template.subject_translations} bodies={template.body_translations} />
            </Paper>
          </Grid>
        </Grid>
      )}
    </Stack>
  )
}

export default FeeTemplateDetailContent
