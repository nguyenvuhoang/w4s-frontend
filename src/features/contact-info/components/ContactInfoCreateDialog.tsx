import CloseIcon from '@mui/icons-material/Close'
import SaveIcon from '@mui/icons-material/Save'
import {
  Alert,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Typography
} from '@mui/material'
import { TimePicker } from '@mui/x-date-pickers/TimePicker'
import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import type { Dayjs } from 'dayjs'
import type { ChangeEvent, FormEvent } from 'react'
import { useState } from 'react'

import type { ContactInfoDictionary, ContactInfoItem, ContactInfoProjectOption, CreateContactInfoFormValues } from '../types'
import {
  commonText,
  contactInfoText,
  contactTypeOptions,
  emptyCreateContactInfoForm,
  getContactTypeLabel
} from './contactInfoHelpers'

type Props = {
  dictionary: ContactInfoDictionary
  open: boolean
  mode: 'create' | 'edit'
  loading: boolean
  formLoading?: boolean
  error: string | null
  project: ContactInfoProjectOption | null
  contact?: ContactInfoItem | null
  onClose: () => void
  onSubmit: (values: CreateContactInfoFormValues) => void
  onExited?: () => void
}

type FormErrors = Partial<Record<keyof CreateContactInfoFormValues, string>>
type WorkingHoursPart = 'from' | 'to'
type WorkingHoursRange = Record<WorkingHoursPart, string>

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const timePattern = /\b(?:[01]\d|2[0-3]):[0-5]\d\b/g

dayjs.extend(customParseFormat)

const formatProjectTitle = (project: ContactInfoProjectOption) => (
  project.code ? `[${project.code}] ${project.name}` : project.name
)

const buildForm = (contact?: ContactInfoItem | null): CreateContactInfoFormValues => contact
  ? {
    contact_type: contact.contact_type || '',
    name: contact.name || '',
    phone: contact.phone || '',
    email: contact.email || '',
    address: contact.address || '',
    working_hours: contact.working_hours || '',
    note: contact.note || '',
    display_order: contact.display_order === null || contact.display_order === undefined ? '' : String(contact.display_order),
    status: contact.status || 'A'
  }
  : emptyCreateContactInfoForm

const parseWorkingHoursRange = (value: string): WorkingHoursRange => {
  const [from = '', to = ''] = value.match(timePattern) ?? []

  return { from, to }
}

const formatWorkingHoursRange = ({ from, to }: WorkingHoursRange) => (
  from && to ? `${from} - ${to}` : from || to
)

const toPickerValue = (value: string) => value ? dayjs(value, 'HH:mm', true) : null

const fromPickerValue = (value: Dayjs | null) => (
  value?.isValid() ? value.format('HH:mm') : ''
)

const ContactInfoCreateDialog = ({ dictionary, open, mode, loading, formLoading = false, error, project, contact, onClose, onSubmit, onExited }: Props) => {
  const [form, setForm] = useState<CreateContactInfoFormValues>(() => buildForm(contact))
  const [errors, setErrors] = useState<FormErrors>({})

  const handleDialogEntered = () => {
    setForm(buildForm(contact))
    setErrors({})
  }

  const setField = <K extends keyof CreateContactInfoFormValues>(key: K, value: CreateContactInfoFormValues[K]) => {
    setForm(current => ({ ...current, [key]: value }))
    setErrors(current => ({ ...current, [key]: undefined }))
  }

  const handleChange = (key: keyof CreateContactInfoFormValues) => (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setField(key, event.target.value)
  }

  const handleWorkingHoursChange = (part: WorkingHoursPart) => (value: Dayjs | null) => {
    const range = parseWorkingHoursRange(form.working_hours)

    setField('working_hours', formatWorkingHoursRange({
      ...range,
      [part]: fromPickerValue(value)
    }))
  }

  const validate = () => {
    const nextErrors: FormErrors = {}
    const requiredMessage = contactInfoText(dictionary, 'validation_required', 'Required')

    if (!form.contact_type) nextErrors.contact_type = requiredMessage
    if (!form.name.trim()) nextErrors.name = requiredMessage
    if (!form.phone.trim()) nextErrors.phone = requiredMessage
    if (mode === 'edit' && !form.status) nextErrors.status = requiredMessage
    if (form.email.trim() && !emailPattern.test(form.email.trim())) {
      nextErrors.email = contactInfoText(dictionary, 'validation_email', 'Invalid email format.')
    }
    if (form.display_order !== '') {
      const displayOrder = Number(form.display_order)

      if (!Number.isFinite(displayOrder) || displayOrder < 0) {
        nextErrors.display_order = contactInfoText(dictionary, 'validation_display_order', 'Display order must be a number greater than or equal to 0.')
      }
    }

    setErrors(nextErrors)

    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (validate()) onSubmit(form)
  }

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      fullWidth
      maxWidth="md"
      TransitionProps={{ onEntered: handleDialogEntered, onExited }}
    >
      <DialogTitle sx={{ pr: 7, fontWeight: 800 }}>
        {mode === 'edit'
          ? contactInfoText(dictionary, 'edit_title', 'Update Project Contact')
          : contactInfoText(dictionary, 'create_title', 'Create Project Contact')}
        <IconButton
          aria-label={commonText(dictionary, 'close', 'Close')}
          onClick={onClose}
          disabled={loading}
          sx={{ position: 'absolute', right: 12, top: 10 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Stack component="form" id="contact-info-form" onSubmit={handleSubmit} sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2, pt: 1 }}>
          {project ? (
            <Alert severity="info" sx={{ gridColumn: '1 / -1' }}>
              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                {contactInfoText(dictionary, 'selected_project', 'Selected project')}: {formatProjectTitle(project)}
              </Typography>
            </Alert>
          ) : (
            <Alert severity="warning" sx={{ gridColumn: '1 / -1' }}>
              {contactInfoText(dictionary, 'select_project_before_create', 'Please select a project before creating a contact.')}
            </Alert>
          )}

          {error && <Alert severity="error" sx={{ gridColumn: '1 / -1' }}>{error}</Alert>}
          {formLoading && (
            <Stack alignItems="center" sx={{ gridColumn: '1 / -1', py: 3 }}>
              <CircularProgress />
            </Stack>
          )}

          <TextField
            required
            select
            size="small"
            label={contactInfoText(dictionary, 'field_contact_type', 'Contact Type')}
            value={form.contact_type}
            onChange={handleChange('contact_type')}
            error={Boolean(errors.contact_type)}
            helperText={errors.contact_type}
            disabled={loading || formLoading}
          >
            {contactTypeOptions.map(type => (
              <MenuItem key={type} value={type}>{getContactTypeLabel(dictionary, type)}</MenuItem>
            ))}
          </TextField>

          <TextField
            required
            size="small"
            label={contactInfoText(dictionary, 'create_field_name', 'Contact Name')}
            value={form.name}
            onChange={handleChange('name')}
            error={Boolean(errors.name)}
            helperText={errors.name}
            disabled={loading || formLoading}
          />

          {mode === 'edit' && (
            <TextField
              required
              select
              size="small"
              label={contactInfoText(dictionary, 'field_status', 'Status')}
              value={form.status}
              onChange={handleChange('status')}
              error={Boolean(errors.status)}
              helperText={errors.status}
              disabled={loading || formLoading}
            >
              <MenuItem value="A">{contactInfoText(dictionary, 'status_active', 'Active')}</MenuItem>
              <MenuItem value="I">{contactInfoText(dictionary, 'status_inactive', 'Inactive')}</MenuItem>
            </TextField>
          )}

          <TextField
            required
            size="small"
            label={contactInfoText(dictionary, 'field_phone', 'Phone')}
            value={form.phone}
            onChange={handleChange('phone')}
            error={Boolean(errors.phone)}
            helperText={errors.phone}
            disabled={loading || formLoading}
          />

          <TextField
            size="small"
            label={contactInfoText(dictionary, 'field_email', 'Email')}
            value={form.email}
            onChange={handleChange('email')}
            error={Boolean(errors.email)}
            helperText={errors.email}
            disabled={loading || formLoading}
          />

          <Stack direction={{ xs: 'column', sm: 'row' }} gap={2} sx={{ gridColumn: '1 / -1' }}>
            <TimePicker
              label={contactInfoText(dictionary, 'field_working_hours_from', 'From time')}
              value={toPickerValue(parseWorkingHoursRange(form.working_hours).from)}
              format="HH:mm"
              ampm={false}
              onChange={handleWorkingHoursChange('from')}
              disabled={loading || formLoading}
              slotProps={{
                textField: {
                  size: 'small',
                  fullWidth: true,
                  InputLabelProps: { shrink: true }
                }
              }}
            />
            <TimePicker
              label={contactInfoText(dictionary, 'field_working_hours_to', 'To time')}
              value={toPickerValue(parseWorkingHoursRange(form.working_hours).to)}
              format="HH:mm"
              ampm={false}
              onChange={handleWorkingHoursChange('to')}
              disabled={loading || formLoading}
              slotProps={{
                textField: {
                  size: 'small',
                  fullWidth: true,
                  InputLabelProps: { shrink: true }
                }
              }}
            />
          </Stack>

          <TextField
            size="small"
            type="number"
            label={contactInfoText(dictionary, 'field_display_order', 'Display Order')}
            value={form.display_order}
            onChange={handleChange('display_order')}
            error={Boolean(errors.display_order)}
            helperText={errors.display_order}
            disabled={loading || formLoading}
            slotProps={{ htmlInput: { min: 0 } }}
          />

          <TextField
            size="small"
            label={contactInfoText(dictionary, 'field_address', 'Address')}
            value={form.address}
            onChange={handleChange('address')}
            disabled={loading || formLoading}
            sx={{ gridColumn: '1 / -1' }}
          />

          <TextField
            multiline
            minRows={3}
            label={contactInfoText(dictionary, 'field_note', 'Note')}
            value={form.note}
            onChange={handleChange('note')}
            disabled={loading || formLoading}
            sx={{ gridColumn: '1 / -1' }}
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} disabled={loading}>{commonText(dictionary, 'cancel', 'Cancel')}</Button>
        <Button
          type="submit"
          form="contact-info-form"
          variant="contained"
          startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
          disabled={loading || formLoading || !project}
        >
          {mode === 'edit'
            ? contactInfoText(dictionary, 'save_changes', commonText(dictionary, 'save', 'Save'))
            : commonText(dictionary, 'save', 'Save')}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default ContactInfoCreateDialog
