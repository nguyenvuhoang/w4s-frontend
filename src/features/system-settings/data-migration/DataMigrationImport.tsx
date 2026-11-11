import { useState } from 'react'
import UploadFileRounded from '@mui/icons-material/UploadFileRounded'
import {
  Alert, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle,
  FormControlLabel, Paper, Stack, Switch, Typography
} from '@mui/material'

import type en from '@/data/dictionaries/en.json'
import type { Locale } from '@/configs/i18n'

type Props = {
  serviceLabel: string
  locale: Locale
  isProduction: boolean
  labels: typeof en.data_migration
  disabled: boolean
  isImporting: boolean
  onImport: (file: File, preserveIdentity: boolean) => Promise<boolean>
}

const DataMigrationImport = ({ serviceLabel, locale, isProduction, labels, disabled, isImporting, onImport }: Props) => {
  const [file, setFile] = useState<File | null>(null)
  const [invalidFile, setInvalidFile] = useState(false)
  const [preserveIdentity, setPreserveIdentity] = useState(true)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const fileSize = file && new Intl.NumberFormat(locale === 'la' ? 'lo' : locale, {
    style: 'unit', unit: 'byte', unitDisplay: 'short'
  }).format(file.size)

  const selectFiles = (files: FileList | null) => {
    if (disabled || !files?.length) return

    const candidate = files[0]
    const valid = files.length === 1 && candidate.size > 0 && candidate.name.toLowerCase().endsWith('.zip')

    if (valid) setFile(candidate)
    setInvalidFile(!valid)
  }

  const confirmImport = async () => {
    if (!file || !confirmOpen || disabled) return

    setConfirmOpen(false)

    if (await onImport(file, preserveIdentity)) setFile(null)
  }

  return (
    <Stack spacing={3} aria-busy={isImporting}>
      <Typography component='h2' variant='h6'>{labels.import_into.replace('{service}', serviceLabel)}</Typography>

      <Paper
        variant='outlined'
        onDragOver={event => event.preventDefault()}
        onDrop={event => {
          event.preventDefault()
          selectFiles(event.dataTransfer.files)
        }}
        sx={{ p: 4, borderStyle: 'dashed', textAlign: 'center', overflowWrap: 'anywhere' }}
      >
        <Stack spacing={2} alignItems='center'>
          <UploadFileRounded color='primary' />
          <Typography>{file?.name ?? labels.drop_zip}</Typography>
          {fileSize && <Typography variant='body2' color='text.secondary'>{fileSize}</Typography>}
          <Button component='label' variant='outlined' disabled={disabled}>
            {labels.choose_zip}
            <input
              type='file'
              hidden
              disabled={disabled}
              accept='.zip,application/zip'
              onChange={event => {
                selectFiles(event.target.files)
                event.target.value = ''
              }}
            />
          </Button>
          {file && (
            <Button
              disabled={disabled}
              onClick={() => {
                setFile(null)
                setInvalidFile(false)
              }}
            >
              {labels.remove_zip}
            </Button>
          )}
        </Stack>
      </Paper>
      {invalidFile && <Alert severity='error'>{labels.invalid_zip}</Alert>}

      <FormControlLabel
        control={<Switch checked={preserveIdentity} disabled={disabled} onChange={(_, checked) => setPreserveIdentity(checked)} />}
        label={labels.preserve_identity}
      />

      <Button
        variant='contained'
        disabled={!file || disabled}
        loading={isImporting}
        onClick={() => setConfirmOpen(true)}
        sx={{ alignSelf: { xs: 'stretch', sm: 'flex-end' } }}
      >
        {isImporting ? labels.importing : labels.import_zip}
      </Button>

      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)} aria-labelledby='migration-confirm-title'>
        <DialogTitle id='migration-confirm-title'>{labels.confirm_title}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ overflowWrap: 'anywhere' }}>
            <DialogContentText>
              {labels.confirm_target.replace('{service}', serviceLabel)}
            </DialogContentText>
            <Typography fontWeight={600}>{file?.name}</Typography>
            <Typography>{fileSize}</Typography>
            <Typography>{preserveIdentity ? labels.identity_on : labels.identity_off}</Typography>
            <Alert severity={isProduction ? 'error' : 'warning'}>
              {isProduction ? labels.import_production_warning : labels.import_warning}
            </Alert>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button autoFocus onClick={() => setConfirmOpen(false)}>{labels.cancel}</Button>
          <Button variant='contained' disabled={disabled} onClick={() => void confirmImport()}>{labels.confirm_import}</Button>
        </DialogActions>
      </Dialog>
    </Stack>
  )
}

export default DataMigrationImport
