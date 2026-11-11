'use client'

import NotificationsRounded from '@mui/icons-material/NotificationsRounded'
import { Alert, Box, MenuItem, Paper, Stack, TextField, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material'
import { useState } from 'react'

import type { SystemSettingsDictionary } from '@/views/pages/system-settings/systemSettingsModules'

import {
  FEE_TEMPLATE_LANGUAGES,
  type FeeTemplateLanguage
} from '../feeTemplate.constants'
import {
  combineFeeTemplateBodies, feeTemplatePreviewDocument, FEE_TEMPLATE_SCENARIOS,
  renderFeeTemplateHtmlPreview, renderFeeTemplateTextPreview,
  type FeeTemplatePreviewLanguage, type FeeTemplateScenario
} from '../feeTemplate.preview'
import { feeSettingsText } from '../feeSettingsModules'

type FeeTemplatePreviewProps = {
  dictionary: SystemSettingsDictionary
  channel: string
  subjects: Record<FeeTemplateLanguage, string>
  bodies: Record<FeeTemplateLanguage, string>
}

/**
 * Preview with sample data only (never sends anything). E-mail HTML is rendered in a sandboxed
 * iframe (no scripts, no access to this page); app push and SMS are rendered as text (React escapes).
 */
const FeeTemplatePreview = ({ dictionary, channel, subjects, bodies }: FeeTemplatePreviewProps) => {
  const text = (key: string, fallback: string) => feeSettingsText(dictionary, key, fallback)
  const [language, setLanguage] = useState<FeeTemplatePreviewLanguage>('vi')
  const [scenario, setScenario] = useState<FeeTemplateScenario>('outstanding')
  const selectedLanguage = language === 'bilingual' && channel !== 'EMAIL' ? 'vi' : language
  const subject = selectedLanguage === 'bilingual' ? [...new Set([subjects.vi, subjects.en].filter(Boolean))].join(' / ') : subjects[selectedLanguage]
  const body = selectedLanguage === 'bilingual' ? combineFeeTemplateBodies(bodies) : bodies[selectedLanguage]
  const sampleText = (key: string, fallback: string) => selectedLanguage === 'bilingual'
    ? [...new Set(FEE_TEMPLATE_LANGUAGES.map(item => text(`${key}_${item}`, text(key, fallback))))].join(' / ')
    : text(`${key}_${selectedLanguage}`, text(key, fallback))
  const renderText = (value: string) => renderFeeTemplateTextPreview(value, scenario, sampleText)

  return (
    <Stack spacing={1.5}>
      <Stack direction='row' justifyContent='space-between' alignItems='center' gap={2} flexWrap='wrap'>
        <Typography variant='subtitle2' sx={{ fontWeight: 700 }}>{text('preview_title', 'Preview with sample data')}</Typography>
        <ToggleButtonGroup size='small' exclusive value={selectedLanguage} onChange={(_event, value) => value && setLanguage(value)}>
          {FEE_TEMPLATE_LANGUAGES.map(item => (
            <ToggleButton key={item} value={item} sx={{ px: 1.5, py: 0.25 }}>{item.toUpperCase()}</ToggleButton>
          ))}
          {channel === 'EMAIL' && <ToggleButton value='bilingual' sx={{ px: 1.5, py: 0.25 }}>{text('preview_bilingual', 'VI + EN')}</ToggleButton>}
        </ToggleButtonGroup>
      </Stack>
      <Typography variant='caption' color='text.secondary'>{text('preview_only_hint', '')}</Typography>
      <TextField select size='small' fullWidth label={text('preview_scenario', '')} value={scenario} onChange={event => setScenario(event.target.value as FeeTemplateScenario)}>
        {FEE_TEMPLATE_SCENARIOS.map(item => <MenuItem key={item} value={item}>{text(`preview_scenario_${item}`, '')}</MenuItem>)}
      </TextField>
      {selectedLanguage === 'bilingual' && bodies.vi !== bodies.en && <Alert severity='info'>{text('preview_bilingual_hint', '')}</Alert>}
      {channel === 'EMAIL' && <Typography variant='caption' color='text.secondary'>{text('preview_qr_hint', '')}</Typography>}

      {channel === 'PUSH_NOTI' && (
        <Paper variant='outlined' sx={{ p: 2, borderRadius: 3, bgcolor: 'action.hover' }}>
          <Stack direction='row' gap={1.5} alignItems='flex-start'>
            <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: 'primary.main', color: 'common.white', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
              <NotificationsRounded fontSize='small' />
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant='body2' sx={{ fontWeight: 700 }}>{renderText(subject) || '-'}</Typography>
              <Typography variant='body2' color='text.secondary' sx={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
                {renderText(body) || '-'}
              </Typography>
            </Box>
          </Stack>
        </Paper>
      )}

      {channel === 'SMS' && (
        <Paper variant='outlined' sx={{ p: 2, borderRadius: 3, maxWidth: 360, bgcolor: 'action.hover' }}>
          <Typography variant='body2' sx={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
            {renderText(body) || '-'}
          </Typography>
        </Paper>
      )}

      {channel !== 'PUSH_NOTI' && channel !== 'SMS' && (
        <Paper variant='outlined' sx={{ borderRadius: 2, overflow: 'hidden' }}>
          <Box sx={{ px: 2, py: 1.5, borderBottom: 1, borderColor: 'divider', bgcolor: 'action.hover' }}>
            <Typography variant='body2' sx={{ fontWeight: 700, overflowWrap: 'anywhere' }}>{renderText(subject) || '-'}</Typography>
          </Box>
          <Box
            component='iframe'
            title={text('preview_title', 'Preview with sample data')}
            sandbox=''
            referrerPolicy='no-referrer'
            srcDoc={feeTemplatePreviewDocument(renderFeeTemplateHtmlPreview(body, scenario, sampleText))}
            sx={{ width: '100%', height: { xs: 480, lg: 640 }, border: 0, bgcolor: 'common.white' }}
          />
        </Paper>
      )}
    </Stack>
  )
}

export default FeeTemplatePreview
