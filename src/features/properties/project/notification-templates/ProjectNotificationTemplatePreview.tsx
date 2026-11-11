'use client'

import { useMemo, useState, type ReactNode } from 'react'

import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew'
import BatteryFullIcon from '@mui/icons-material/BatteryFull'
import GppMaybeOutlinedIcon from '@mui/icons-material/GppMaybeOutlined'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import NotificationsActiveOutlinedIcon from '@mui/icons-material/NotificationsActiveOutlined'
import SignalCellularAltIcon from '@mui/icons-material/SignalCellularAlt'
import WifiIcon from '@mui/icons-material/Wifi'
import { Alert, Avatar, Box, Divider, Paper, Stack, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material'

import type { Locale } from '@/configs/i18n'

import { projectText, type ProjectDictionary } from '../projectListHelpers'
import {
  buildTemplatePreviewDocument,
  renderTemplateHtmlPreview,
  renderTemplateTextPreview,
  sanitizeTemplateHtmlWithReport,
  type SanitizeFindingKind
} from './projectNotificationTemplateHelpers'
import type { NotificationTemplateParameter } from './projectNotificationTemplateTypes'

type PreviewMode = 'mobile' | 'email'

type Props = {
  dictionary: ProjectDictionary
  locale: Locale
  subject: string
  bodyHtml: string
  parameters: NotificationTemplateParameter[]
  projectName: string
}

const intlLocale = (locale: Locale) => (locale === 'vi' ? 'vi-VN' : locale === 'la' ? 'lo-LA' : 'en-US')

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase() ?? '')
    .join('') || 'BQL'

const FULL_NAME_PLACEHOLDER = '{(:FULL_NAME:)}'

const SCREEN_INK = '#1E3A5F'

/** Same height for both phones: as tall as the sticky preview column allows, within a readable range. */
const PHONE_HEIGHT = { xs: 520, lg: 'clamp(460px, calc(94vh - 300px), 620px)' }

/** Phone shell shared by both mobile previews: dark bezel, Dynamic Island, status bar, home indicator. */
const PhoneFrame = ({ label, time, children, kind }: { label: string; time: string; children: ReactNode; kind: string }) => (
  <Stack spacing={1} alignItems="center" sx={{ flex: '1 1 240px', minWidth: 0, maxWidth: 300 }} data-preview-phone={kind}>
    <Box
      sx={{
        position: 'relative',
        width: '100%',
        height: PHONE_HEIGHT,
        borderRadius: '40px',
        border: '10px solid #0f172a',
        boxShadow: '0 18px 40px rgba(15, 23, 42, 0.22)',
        overflow: 'hidden',
        bgcolor: '#F8FAFC',
        color: SCREEN_INK,
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <Box sx={{ position: 'absolute', top: 8, left: '50%', transform: 'translateX(-50%)', width: 88, height: 24, borderRadius: 12, bgcolor: '#0f172a', zIndex: 2 }} />
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ px: 2.5, pt: 1.25, height: 36, flexShrink: 0 }}>
        <Typography variant="caption" sx={{ fontWeight: 700, color: 'inherit' }}>{time}</Typography>
        <Stack direction="row" spacing={0.5} alignItems="center">
          <SignalCellularAltIcon sx={{ fontSize: 14 }} />
          <WifiIcon sx={{ fontSize: 14 }} />
          <BatteryFullIcon sx={{ fontSize: 15, transform: 'rotate(90deg)' }} />
        </Stack>
      </Stack>
      {children}
      <Box sx={{ position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)', width: 110, height: 4, borderRadius: 2, bgcolor: 'rgba(30, 58, 95, 0.35)', zIndex: 2 }} />
    </Box>
    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>{label}</Typography>
  </Stack>
)

/**
 * Previews of the current form values with the sample values of WF_BO_GET_NOTIFICATION_TEMPLATE_PARAMETERS:
 * - Mobile: lock screen (subject as plain text) and in-app detail (HTML body) side by side, stacked when narrow;
 * - Email: sender, recipient, subject and the HTML body.
 * The body is sanitized and rendered in sandboxed frames only. A security notice is shown only when the
 * sanitizer actually removed something from the body.
 */
const ProjectNotificationTemplatePreview = ({ dictionary, locale, subject, bodyHtml, parameters, projectName }: Props) => {
  const [mode, setMode] = useState<PreviewMode>('mobile')
  const [now] = useState(() => new Date())
  const t = (key: string, fallback: string) => projectText(dictionary, key, fallback)

  const tableItemLabel = t('notificationTemplatePreviewTableItem', 'Fee item')
  const tableAmountLabel = t('notificationTemplatePreviewTableAmount', 'Amount')

  const subjectPreview = useMemo(() => renderTemplateTextPreview(subject, parameters).trim(), [subject, parameters])
  const body = useMemo(
    () => sanitizeTemplateHtmlWithReport(renderTemplateHtmlPreview(bodyHtml, parameters, { tableItem: tableItemLabel, tableAmount: tableAmountLabel })),
    [bodyHtml, parameters, tableItemLabel, tableAmountLabel]
  )
  const emailDocument = useMemo(() => buildTemplatePreviewDocument(body.html), [body.html])
  const mobileDocument = useMemo(() => buildTemplatePreviewDocument(body.html, { compact: true }), [body.html])

  const timeText = new Intl.DateTimeFormat(intlLocale(locale), { hour: '2-digit', minute: '2-digit', hour12: false }).format(now)
  const dateText = new Intl.DateTimeFormat(intlLocale(locale), { weekday: 'long', day: 'numeric', month: 'long' }).format(now)
  const emptySubject = t('notificationTemplatePreviewSubjectEmpty', '(No subject)')
  const senderName = `${t('notificationTemplatePreviewSender', 'Management Board')} ${projectName}`.trim()
  const recipient = parameters.find(item => item.placeholder === FULL_NAME_PLACEHOLDER)?.sample_value
    || t('notificationTemplatePreviewRecipient', 'Resident')
  const frameTitle = t('notificationTemplatePreviewEmail', 'Email / In-App')

  const findingLabel = (kind: SanitizeFindingKind, names: string[]) => {
    if (kind === 'unsafeTag') return `${t('notificationTemplateSanitizedTags', 'Unsafe tags')} (${names.map(name => `<${name}>`).join(', ')})`
    if (kind === 'eventHandler') return `${t('notificationTemplateSanitizedEvents', 'Event handler attributes')} (${names.join(', ')})`
    if (kind === 'unsafeUrl') return t('notificationTemplateSanitizedUrls', 'Unsafe links or images')

    return t('notificationTemplateSanitizedStyles', 'Unsafe styles')
  }

  return (
    <Stack spacing={1.5} sx={{ minWidth: 0 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" gap={1} flexWrap="wrap">
        <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>{t('notificationTemplatePreview', 'Preview')}</Typography>
        <ToggleButtonGroup
          size="small"
          exclusive
          value={mode}
          onChange={(_, next: PreviewMode | null) => next && setMode(next)}
          aria-label={t('notificationTemplatePreview', 'Preview')}
        >
          <ToggleButton value="mobile" sx={{ textTransform: 'none', px: 1.5 }}>{t('notificationTemplatePreviewMobile', 'Mobile')}</ToggleButton>
          <ToggleButton value="email" sx={{ textTransform: 'none', px: 1.5 }}>{t('notificationTemplatePreviewEmailTab', 'Email')}</ToggleButton>
        </ToggleButtonGroup>
      </Stack>

      {mode === 'mobile' ? (
        <Stack
          direction="row"
          flexWrap="wrap"
          justifyContent="center"
          gap={{ xs: 2.5, xl: 3.5 }}
          sx={{ py: 2, px: { xs: 1, sm: 2 }, borderRadius: 3, bgcolor: 'action.hover', minWidth: 0 }}
          data-preview="mobile"
        >
          <PhoneFrame kind="lock" label={t('notificationTemplatePreviewLockScreen', 'Lock screen')} time={timeText}>
            <Stack alignItems="center" sx={{ mt: 3, flexShrink: 0 }}>
              <Typography sx={{ fontSize: 13, fontWeight: 600, textTransform: 'capitalize' }}>{dateText}</Typography>
              <Typography sx={{ fontSize: 60, fontWeight: 300, lineHeight: 1.05, letterSpacing: '-1px', fontVariantNumeric: 'tabular-nums' }}>{timeText}</Typography>
            </Stack>
            <Box sx={{ px: 1.25, mt: 'auto', mb: 5.5 }}>
              <Box sx={{ p: 1.5, borderRadius: '18px', bgcolor: '#FFFFFF', border: '1px solid #E2E8F0', color: '#0F172A', boxShadow: '0 4px 14px rgba(15, 23, 42, 0.08)' }}>
                <Stack direction="row" spacing={1.25} alignItems="flex-start">
                  <Avatar variant="rounded" sx={{ width: 34, height: 34, borderRadius: '9px', bgcolor: 'primary.main', flexShrink: 0 }}>
                    <NotificationsActiveOutlinedIcon sx={{ fontSize: 19 }} />
                  </Avatar>
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Stack direction="row" justifyContent="space-between" gap={1}>
                      <Typography sx={{ fontSize: 13, fontWeight: 700 }} noWrap>{projectName}</Typography>
                      <Typography sx={{ fontSize: 12, color: '#475569', flexShrink: 0 }}>{t('notificationTemplatePreviewNow', 'now')}</Typography>
                    </Stack>
                    <Typography
                      sx={{
                        fontSize: 13,
                        lineHeight: 1.4,
                        mt: 0.25,
                        overflowWrap: 'anywhere',
                        display: '-webkit-box',
                        WebkitLineClamp: 4,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        color: subjectPreview ? 'inherit' : '#64748b'
                      }}
                    >
                      {subjectPreview || emptySubject}
                    </Typography>
                  </Box>
                </Stack>
              </Box>
            </Box>
          </PhoneFrame>

          <PhoneFrame kind="detail" label={t('notificationTemplatePreviewInAppDetail', 'In-app detail')} time={timeText}>
            <Stack direction="row" alignItems="center" spacing={0.75} sx={{ px: 1.5, py: 1, flexShrink: 0, borderBottom: '1px solid #E2E8F0', bgcolor: '#FFFFFF' }}>
              <ArrowBackIosNewIcon sx={{ fontSize: 16 }} aria-hidden />
              <Typography sx={{ fontSize: 14, fontWeight: 700 }} noWrap>{t('notificationTemplatePreviewDetailTitle', 'Notification detail')}</Typography>
            </Stack>
            <Box sx={{ px: 1.75, pt: 1.5, pb: 1, flexShrink: 0, bgcolor: '#FFFFFF' }}>
              <Typography sx={{ fontSize: 15, fontWeight: 800, lineHeight: 1.35, overflowWrap: 'anywhere', color: subjectPreview ? '#0F172A' : '#64748b' }}>
                {subjectPreview || emptySubject}
              </Typography>
              <Typography sx={{ fontSize: 12, color: '#64748b', mt: 0.5 }} noWrap>{projectName} · {timeText}</Typography>
            </Box>
            {/* The full body scrolls inside the phone screen; the frame runs no script. */}
            <Box
              component="iframe"
              title={frameTitle}
              sandbox=""
              referrerPolicy="no-referrer"
              srcDoc={mobileDocument}
              sx={{ display: 'block', flex: 1, minHeight: 0, width: '100%', border: 0, bgcolor: '#fff', mb: 2.5 }}
            />
          </PhoneFrame>
        </Stack>
      ) : (
        <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden', display: 'flex', flexDirection: 'column', minWidth: 0 }} data-preview="email">
          <Box sx={{ px: { xs: 2, md: 3 }, py: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.35, overflowWrap: 'anywhere', color: subjectPreview ? 'text.primary' : 'text.disabled' }}>
              {subjectPreview || emptySubject}
            </Typography>
            <Stack direction="row" spacing={1.25} alignItems="center" sx={{ mt: 1.5 }}>
              <Avatar sx={{ width: 40, height: 40, bgcolor: 'primary.main', fontSize: 14, fontWeight: 700 }}>{initials(projectName)}</Avatar>
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 700 }} noWrap>{senderName}</Typography>
                <Typography variant="caption" color="text.secondary" noWrap component="div">
                  {t('notificationTemplatePreviewTo', 'To')}: {recipient}
                </Typography>
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>{timeText}</Typography>
            </Stack>
          </Box>
          <Divider />
          <Box
            component="iframe"
            title={frameTitle}
            sandbox=""
            referrerPolicy="no-referrer"
            srcDoc={emailDocument}
            sx={{ display: 'block', width: '100%', height: { xs: 460, lg: 'clamp(380px, calc(94vh - 330px), 720px)' }, border: 0, bgcolor: '#fff' }}
          />
        </Paper>
      )}

      {body.findings.length > 0 ? (
        <Alert severity="warning" icon={<GppMaybeOutlinedIcon fontSize="inherit" />} data-preview-sanitized="true">
          <Typography variant="body2" sx={{ fontWeight: 700 }}>
            {t('notificationTemplateSanitizedTitle', 'Unsafe content was removed from the preview.')}
          </Typography>
          <Box component="ul" sx={{ m: 0, mt: 0.5, pl: 2.5 }}>
            {body.findings.map(finding => (
              <Typography component="li" variant="body2" key={finding.kind}>{findingLabel(finding.kind, finding.names)}</Typography>
            ))}
          </Box>
          <Typography variant="caption" component="div" sx={{ mt: 0.5 }}>
            {t('notificationTemplateSanitizedNote', 'The saved content is not changed; please review the HTML source.')}
          </Typography>
        </Alert>
      ) : (
        <Stack direction="row" spacing={0.75} alignItems="center" sx={{ color: 'text.secondary' }} data-preview-sample-note="true">
          <InfoOutlinedIcon sx={{ fontSize: 16 }} />
          <Typography variant="caption">{t('notificationTemplatePreviewSampleData', 'Sample data')}</Typography>
        </Stack>
      )}
    </Stack>
  )
}

export default ProjectNotificationTemplatePreview
