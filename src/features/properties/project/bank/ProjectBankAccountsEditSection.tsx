'use client'

import { useState, type ReactElement } from 'react'

import AccountBalanceOutlinedIcon from '@mui/icons-material/AccountBalanceOutlined'
import ClearIcon from '@mui/icons-material/Clear'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import SavingsOutlinedIcon from '@mui/icons-material/SavingsOutlined'
import { Alert, Box, Chip, Divider, Grid, IconButton, InputAdornment, Paper, Stack, TextField, Tooltip, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'

import type { ProjectBankQrState } from '../hooks/useProjectBankQr'
import { formatProjectValue, projectText, type ProjectDictionary } from '../projectListHelpers'
import ProjectBankQrPanel from './ProjectBankQrPanel'
import {
  isProjectBankAccountMissing,
  isProjectBankAccountUpdatable,
  PROJECT_BANK_ACCOUNT_GROUPS,
  PROJECT_BANK_ACCOUNT_UPDATE_FIELDS,
  type ProjectBankAccount,
  type ProjectBankAccountFormState,
  type ProjectBankAccountGroup,
  type ProjectBankAccountUpdateField
} from './projectBankTypes'
import type { VietQrBank } from './vietqr'
import VietQrBankAutocomplete from './VietQrBankAutocomplete'

const GROUP_ICONS: Record<ProjectBankAccountGroup, ReactElement> = {
  operating_bank_account: <AccountBalanceOutlinedIcon fontSize="small" />,
  deposit_bank_account: <SavingsOutlinedIcon fontSize="small" />
}

type Props = {
  dictionary: ProjectDictionary
  /** Accounts as returned by WF_BO_GET_PROJECT_DETAIL (null = not returned). */
  accounts: Record<ProjectBankAccountGroup, ProjectBankAccount | null>
  values: Record<ProjectBankAccountGroup, ProjectBankAccountFormState>
  errors: Partial<Record<ProjectBankAccountGroup, Partial<Record<ProjectBankAccountUpdateField, string>>>>
  /** VietQR bank list (empty when unavailable: the bank name falls back to a text input, no QR). */
  banks?: VietQrBank[]
  banksError?: string | null
  /** VietQR state of both accounts (absent = no QR panel). */
  qr?: ProjectBankQrState
  disabled: boolean
  onChange: (group: ProjectBankAccountGroup, field: ProjectBankAccountUpdateField, value: string) => void
}

/**
 * "Thông tin ngân hàng" of the Edit Project page: the project's operating and deposit accounts, saved with
 * WF_BO_UPDATE_PROJECT (each with its own account id). Not the payment gateway (PaymentConfig).
 * - existing account (with id): prefilled, editable;
 * - account not set up yet (GET returned null): empty, editable inputs with a "Not set up" label;
 * - account returned without id: read-only (it cannot be targeted by an update).
 */
const ProjectBankAccountsEditSection = ({ dictionary, accounts, values, errors, banks = [], banksError = null, qr, disabled, onChange }: Props) => {
  const t = (key: string, fallback: string) => projectText(dictionary, key, fallback)
  const [copiedGroup, setCopiedGroup] = useState<ProjectBankAccountGroup | null>(null)

  const copyQrUrl = async (group: ProjectBankAccountGroup, url: string) => {
    try {
      await navigator.clipboard.writeText(url)
      setCopiedGroup(group)
    } catch {
      setCopiedGroup(null)
    }
  }

  return (
    <Paper sx={{ p: { xs: 2, md: 3 }, borderRadius: 2, border: 1, borderColor: 'divider' }} data-bank-edit-section>
      <Stack spacing={0.5} sx={{ mb: 2 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'primary.main' }}>{t('bankInformation', 'Bank information')}</Typography>
        <Typography variant="body2" color="text.secondary">
          {t('bankInformationSubtitle', 'Manage receiving accounts and payment instructions for this project.')}
        </Typography>
      </Stack>

      {banksError && <Alert severity="warning" sx={{ mb: 2 }}>{banksError}</Alert>}

      <Grid container spacing={2.5}>
        {PROJECT_BANK_ACCOUNT_GROUPS.map(({ group, titleKey, titleFallback }) => {
          const account = accounts[group]
          const missing = isProjectBankAccountMissing(account)
          const editable = missing || isProjectBankAccountUpdatable(account)

          return (
            <Grid key={group} size={{ xs: 12, md: 6 }} data-bank-group={group} data-bank-editable={String(editable)}>
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
                      {GROUP_ICONS[group]}
                    </Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>{t(titleKey, titleFallback)}</Typography>
                    {missing && <Chip size="small" variant="outlined" label={t('bankAccountNotSetUp', 'Not set up')} data-bank-not-set-up={group} />}
                  </Stack>
                  <Divider />

                  {!editable && (
                    <Alert severity="warning">
                      {t('bankAccountIdMissing', 'The system did not return the identifier of this account, so it cannot be updated. It is shown read-only.')}
                    </Alert>
                  )}

                  <Stack spacing={2}>
                    {PROJECT_BANK_ACCOUNT_UPDATE_FIELDS.map(({ field, labelKey, labelFallback, required }) => {
                      const label = t(labelKey, labelFallback)
                      const error = errors[group]?.[field]

                      // Bank: VietQR picker (logo, name, code, search) storing the short name in bank_name.
                      if (editable && field === 'bank_name' && banks.length > 0) {
                        return (
                          <VietQrBankAutocomplete
                            key={field}
                            banks={banks}
                            value={values[group].bank_name}
                            label={label}
                            required={required}
                            error={error}
                            disabled={disabled}
                            noOptionsText={t('vietQrNoBank', 'No matching bank')}
                            onChange={bankName => onChange(group, 'bank_name', bankName)}
                          />
                        )
                      }

                      // QR URL: generated by the system ("Use this QR"), so read-only; copy / open / clear actions.
                      if (editable && field === 'qr_code_url') {
                        const url = values[group].qr_code_url.trim()

                        return (
                          <TextField
                            key={field}
                            fullWidth
                            label={label}
                            value={values[group].qr_code_url}
                            error={Boolean(error)}
                            helperText={error ?? (copiedGroup === group && url ? t('bankQrCopied', 'QR link copied.') : t('bankQrUrlHint', 'Filled automatically when you use a VietQR.'))}
                            slotProps={{
                              htmlInput: { readOnly: true, 'data-bank-field': field },
                              input: {
                                readOnly: true,
                                endAdornment: url ? (
                                  <InputAdornment position="end">
                                    <Tooltip title={t('bankQrCopy', 'Copy link')}>
                                      <IconButton size="small" aria-label={t('bankQrCopy', 'Copy link')} onClick={() => void copyQrUrl(group, url)} data-bank-qr-url-action="copy">
                                        <ContentCopyIcon fontSize="small" />
                                      </IconButton>
                                    </Tooltip>
                                    <Tooltip title={t('bankQrOpen', 'Open QR image')}>
                                      <IconButton size="small" aria-label={t('bankQrOpen', 'Open QR image')} component="a" href={url} target="_blank" rel="noopener noreferrer" data-bank-qr-url-action="open">
                                        <OpenInNewIcon fontSize="small" />
                                      </IconButton>
                                    </Tooltip>
                                    <Tooltip title={t('bankQrClear', 'Remove QR')}>
                                      <span>
                                        <IconButton size="small" aria-label={t('bankQrClear', 'Remove QR')} disabled={disabled} onClick={() => qr?.clear(group)} data-bank-qr-url-action="clear">
                                          <ClearIcon fontSize="small" />
                                        </IconButton>
                                      </span>
                                    </Tooltip>
                                  </InputAdornment>
                                ) : undefined
                              }
                            }}
                          />
                        )
                      }

                      // account_number stays a plain text input: kept as a string (leading zeros, any format).
                      return editable ? (
                        <TextField
                          key={field}
                          fullWidth
                          required={required}
                          label={label}
                          value={values[group][field]}
                          error={Boolean(error)}
                          helperText={error}
                          disabled={disabled}
                          onChange={event => onChange(group, field, event.target.value)}
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

                  {editable && qr && (
                    <ProjectBankQrPanel
                      dictionary={dictionary}
                      group={group}
                      qrCodeUrl={values[group].qr_code_url.trim()}
                      qr={qr}
                      banksUnavailable={banks.length === 0}
                      disabled={disabled}
                    />
                  )}
                </Stack>
              </Paper>
            </Grid>
          )
        })}
      </Grid>
    </Paper>
  )
}

export default ProjectBankAccountsEditSection
