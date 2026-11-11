'use client'

import { useState } from 'react'

import AutorenewIcon from '@mui/icons-material/Autorenew'
import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined'
import QrCode2Icon from '@mui/icons-material/QrCode2'
import TaskAltIcon from '@mui/icons-material/TaskAlt'
import { Alert, Box, Button, Chip, CircularProgress, Stack, Typography } from '@mui/material'

import { projectText, type ProjectDictionary } from '../projectListHelpers'
import type { ProjectBankQrState } from '../hooks/useProjectBankQr'
import { downloadQrImage } from './projectBankQrService'
import type { ProjectBankAccountGroup } from './projectBankTypes'
import type { VietQrMissingField } from './vietqr'

type Props = {
  dictionary: ProjectDictionary
  group: ProjectBankAccountGroup
  /** QR currently in the form (`qr_code_url`). */
  qrCodeUrl: string
  qr: ProjectBankQrState
  /** The VietQR bank list could not be loaded: no BIN, no QR. */
  banksUnavailable: boolean
  disabled: boolean
}

const MISSING_KEYS: Record<VietQrMissingField, [string, string]> = {
  bank: ['vietQrMissingBank', 'a bank of the VietQR list (BIN)'],
  account_number: ['vietQrMissingAccountNumber', 'an account number (letters / digits, no spaces)'],
  account_holder: ['vietQrMissingAccountHolder', 'an account holder']
}

const QR_SIZE = 180

/** VietQR of one account card: create (preview), download, use (fills qr_code_url), re-create when outdated. */
const ProjectBankQrPanel = ({ dictionary, group, qrCodeUrl, qr, banksUnavailable, disabled }: Props) => {
  const t = (key: string, fallback: string) => projectText(dictionary, key, fallback)
  const [downloading, setDownloading] = useState(false)

  const input = qr.inputOf(group)
  const preview = qr.previews[group]
  const applying = Boolean(qr.applying[group])
  const signature = qr.currentSignature(group)
  const previewOutdated = Boolean(preview && signature !== preview.signature)
  const previewApplied = Boolean(preview && qrCodeUrl && qr.appliedSignatures[qrCodeUrl] === preview.signature)
  const busy = disabled || applying || Boolean(preview?.loading) || downloading
  const stale = qr.stale[group]
  const placeholderSkipped = input.ok && input.placeholderSkipped

  const download = async (url: string) => {
    setDownloading(true)

    try {
      await downloadQrImage(url, `vietqr-${group}.png`)
    } finally {
      setDownloading(false)
    }
  }

  return (
    <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 2, p: 2 }} data-bank-qr={group}>
      <Stack spacing={1.5}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1} flexWrap="wrap">
          <Stack direction="row" alignItems="center" spacing={1}>
            <QrCode2Icon fontSize="small" color="primary" />
            <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>{t('vietQrTitle', 'VietQR')}</Typography>
            {stale && <Chip size="small" color="warning" label={t('vietQrNeedsRegenerate', 'Needs to be re-created')} data-bank-qr-stale={group} />}
          </Stack>
          <Button
            size="small"
            variant={preview ? 'outlined' : 'contained'}
            startIcon={preview || stale ? <AutorenewIcon /> : <QrCode2Icon />}
            disabled={busy || banksUnavailable || !input.ok}
            onClick={() => qr.preview(group)}
            data-bank-qr-action="preview"
          >
            {preview || stale ? t('vietQrRegenerate', 'Re-create QR') : t('vietQrCreate', 'Create VietQR')}
          </Button>
        </Stack>

        {banksUnavailable && <Alert severity="warning">{t('vietQrBanksUnavailable', 'The VietQR bank list is not available, so no QR code can be created.')}</Alert>}
        {!banksUnavailable && !input.ok && (
          <Alert severity="info" data-bank-qr-missing={input.missing.join(',')}>
            {`${t('vietQrMissingPrefix', 'To create a VietQR, enter')}: ${input.missing.map(field => t(...MISSING_KEYS[field])).join(', ')}.`}
          </Alert>
        )}
        {placeholderSkipped && (
          <Alert severity="info">
            {t('vietQrPlaceholderSkipped', 'The transfer content contains a placeholder (e.g. [CanHo]) that is replaced per apartment, so this project QR is a static QR without transfer content.')}
          </Alert>
        )}
        {stale && (
          <Alert severity="warning">{t('bankQrOutdated', 'The QR code no longer matches this account. Re-create the VietQR and use the new one (or remove the QR).')}</Alert>
        )}
        {qr.errors[group] && <Alert severity="error">{qr.errors[group]}</Alert>}

        {preview && (
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'flex-start', sm: 'center' }}>
            <Box sx={{ width: QR_SIZE, height: QR_SIZE, position: 'relative', flexShrink: 0, border: 1, borderColor: 'divider', borderRadius: 1, overflow: 'hidden', bgcolor: 'common.white' }}>
              {preview.loading && (
                <Stack alignItems="center" justifyContent="center" sx={{ position: 'absolute', inset: 0 }}>
                  <CircularProgress size={28} />
                </Stack>
              )}
              <Box
                component="img"
                src={preview.url}
                alt={t('vietQrPreviewAlt', 'VietQR preview')}
                onLoad={() => qr.previewLoaded(group)}
                onError={() => qr.previewFailed(group)}
                sx={{ width: '100%', height: '100%', objectFit: 'contain', opacity: preview.loading ? 0 : 1 }}
                data-bank-qr-preview={group}
              />
            </Box>
            <Stack spacing={1}>
              <Typography variant="caption" color="text.secondary">
                {previewOutdated
                  ? t('vietQrPreviewOutdated', 'The account changed after this preview. Re-create the QR.')
                  : t('vietQrPreviewHint', 'Preview only: nothing is saved until you use this QR and save the changes.')}
              </Typography>
              <Stack direction="row" gap={1} flexWrap="wrap">
                <Button size="small" variant="outlined" startIcon={<DownloadOutlinedIcon />} disabled={busy} onClick={() => void download(preview.url)} data-bank-qr-action="download">
                  {t('vietQrDownload', 'Download QR')}
                </Button>
                <Button
                  size="small"
                  variant="contained"
                  startIcon={applying ? <CircularProgress size={14} color="inherit" /> : <TaskAltIcon />}
                  disabled={busy || previewOutdated || previewApplied}
                  onClick={() => void qr.apply(group)}
                  data-bank-qr-action="apply"
                >
                  {applying ? t('vietQrApplying', 'Creating QR...') : previewApplied ? t('vietQrApplied', 'QR in use') : t('vietQrUse', 'Use this QR')}
                </Button>
              </Stack>
            </Stack>
          </Stack>
        )}

        {!preview && qrCodeUrl && (
          <Stack direction="row" spacing={2} alignItems="center">
            <Box component="img" src={qrCodeUrl} alt={t('vietQrCurrentAlt', 'Current QR code')} sx={{ width: 96, height: 96, objectFit: 'contain', border: 1, borderColor: 'divider', borderRadius: 1, bgcolor: 'common.white', opacity: stale ? 0.4 : 1 }} />
            <Button size="small" variant="outlined" startIcon={<DownloadOutlinedIcon />} disabled={busy} onClick={() => void download(qrCodeUrl)}>
              {t('vietQrDownload', 'Download QR')}
            </Button>
          </Stack>
        )}
      </Stack>
    </Box>
  )
}

export default ProjectBankQrPanel
