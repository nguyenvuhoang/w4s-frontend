'use client'

import { useState, type ReactNode } from 'react'

import CloseIcon from '@mui/icons-material/Close'
import ZoomInIcon from '@mui/icons-material/ZoomIn'
import { Box, ButtonBase, Dialog, DialogContent, DialogTitle, Divider, IconButton, Paper, Stack, TextField, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'

import { formatProjectValue, projectCommonText, projectText, type ProjectDictionary } from '../projectListHelpers'
import { PROJECT_BANK_ACCOUNT_FIELDS, type ProjectBankAccount } from './projectBankTypes'

export type ProjectBankAccountEditing = {
  disabled?: boolean
  onChange: (field: keyof ProjectBankAccount, value: string) => void
}

type Props = {
  dictionary: ProjectDictionary
  title: string
  icon: ReactNode
  /** null = no account for this group: every field shows "--" in view mode. Never filled with sample values. */
  account: ProjectBankAccount | null
  /** Present = edit mode (Project Create): the 4 fields are optional text inputs. Absent = view mode. */
  editing?: ProjectBankAccountEditing
}

const QR_SIZE = 160
const QR_BOX_WIDTH = 180

/**
 * One receiving account (bank name, account number, account holder, transfer content). In view mode, a stored
 * `qr_code_url` is shown at the top right of the content (160px, click = larger preview); stacked below the
 * text on mobile. Without a QR nothing extra is rendered.
 */
const ProjectBankAccountCard = ({ dictionary, title, icon, account, editing }: Props) => {
  const [qrOpen, setQrOpen] = useState(false)
  const qrUrl = !editing ? account?.qr_code_url?.trim() || '' : ''
  const qrLabel = projectText(dictionary, 'bankQrCode', 'QR code')
  const qrAlt = `${qrLabel} — ${title}`

  const fields = (
    <Stack spacing={2} sx={{ flex: 1, minWidth: 0 }}>
      {PROJECT_BANK_ACCOUNT_FIELDS.map(({ field, labelKey, labelFallback }) => {
        const label = projectText(dictionary, labelKey, labelFallback)

        // account_number stays a plain text input: its value is kept as a string (leading zeros, any format).
        return editing ? (
          <TextField
            key={field}
            fullWidth
            label={label}
            value={account?.[field] ?? ''}
            disabled={editing.disabled}
            onChange={event => editing.onChange(field, event.target.value)}
            slotProps={{ htmlInput: { 'data-bank-field': field } }}
          />
        ) : (
          <Stack key={field} spacing={0.25} sx={{ minWidth: 0 }}>
            <Typography variant="caption" color="text.secondary">{label}</Typography>
            <Typography variant="body2" sx={{ fontWeight: 600, overflowWrap: 'anywhere' }} data-bank-field={field}>
              {formatProjectValue(account?.[field])}
            </Typography>
          </Stack>
        )
      })}
    </Stack>
  )

  return (
    <Paper variant="outlined" sx={{ p: { xs: 2, md: 2.5 }, borderRadius: 2, height: '100%' }}>
      <Stack spacing={2}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              flexShrink: 0,
              bgcolor: theme => alpha(theme.palette.primary.main, 0.12),
              color: 'primary.main',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {icon}
          </Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>{title}</Typography>
        </Stack>
        <Divider />

        {qrUrl ? (
          // Text on the left, QR at the top right (sm+); QR below the text on mobile, still 160px.
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2.5} alignItems={{ xs: 'stretch', sm: 'flex-start' }} data-bank-qr-layout>
            {fields}
            <Stack spacing={0.75} alignItems="center" sx={{ width: { xs: '100%', sm: QR_BOX_WIDTH }, flexShrink: 0, alignSelf: { xs: 'center', sm: 'flex-start' } }}>
              <ButtonBase
                onClick={() => setQrOpen(true)}
                aria-label={projectText(dictionary, 'bankQrZoom', 'Enlarge QR code')}
                data-bank-qr-open
                sx={{
                  p: 1,
                  borderRadius: 2,
                  border: 1,
                  borderColor: 'divider',
                  bgcolor: 'common.white',
                  position: 'relative',
                  transition: theme => theme.transitions.create(['box-shadow', 'border-color']),
                  '&:hover, &.Mui-focusVisible': { borderColor: 'primary.main', boxShadow: theme => `0 0 0 3px ${alpha(theme.palette.primary.main, 0.12)}` },
                  '&:hover .bank-qr-zoom, &.Mui-focusVisible .bank-qr-zoom': { opacity: 1 }
                }}
              >
                <Box
                  component="img"
                  src={qrUrl}
                  alt={qrAlt}
                  data-bank-field="qr_code_url"
                  sx={{ width: QR_SIZE, height: QR_SIZE, objectFit: 'contain', display: 'block' }}
                />
                <Box
                  className="bank-qr-zoom"
                  sx={{
                    position: 'absolute',
                    right: 6,
                    bottom: 6,
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: theme => alpha(theme.palette.common.black, 0.55),
                    color: 'common.white',
                    opacity: 0,
                    transition: theme => theme.transitions.create('opacity')
                  }}
                >
                  <ZoomInIcon sx={{ fontSize: 18 }} />
                </Box>
              </ButtonBase>
              <Typography variant="caption" color="text.secondary">{qrLabel}</Typography>
            </Stack>
          </Stack>
        ) : (
          fields
        )}
      </Stack>

      {qrUrl && (
        <Dialog open={qrOpen} onClose={() => setQrOpen(false)} maxWidth="xs" fullWidth>
          <DialogTitle sx={{ pr: 6, fontWeight: 800 }}>
            {title}
            <IconButton aria-label={projectCommonText(dictionary, 'close', 'Close')} onClick={() => setQrOpen(false)} sx={{ position: 'absolute', right: 8, top: 8 }}>
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent>
            <Stack spacing={1.5} alignItems="center">
              <Box
                component="img"
                src={qrUrl}
                alt={qrAlt}
                data-bank-qr-dialog-image
                sx={{ width: '100%', maxWidth: 360, aspectRatio: '1 / 1', objectFit: 'contain', bgcolor: 'common.white', border: 1, borderColor: 'divider', borderRadius: 2, p: 1.5 }}
              />
              {account?.bank_name && (
                <Typography variant="body2" sx={{ fontWeight: 700, textAlign: 'center' }}>
                  {`${account.bank_name} · ${account.account_number}`}
                </Typography>
              )}
              {account?.account_holder && <Typography variant="body2" color="text.secondary">{account.account_holder}</Typography>}
            </Stack>
          </DialogContent>
        </Dialog>
      )}
    </Paper>
  )
}

export default ProjectBankAccountCard
