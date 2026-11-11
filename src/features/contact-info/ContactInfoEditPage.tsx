'use client'

import ContactPhoneIcon from '@mui/icons-material/ContactPhone'
import { Alert, Stack } from '@mui/material'
import { useRouter } from '@shared/hooks/useRouter'
import { useState } from 'react'

import ContentWrapper from '@/features/dynamicform/components/layout/content-wrapper'
import SwalAlert from '@shared/utils/SwalAlert'

import ContactInfoCreateDialog from './components/ContactInfoCreateDialog'
import { contactInfoText } from './components/contactInfoHelpers'
import { contactInfoService } from './service'
import type {
  ContactInfoDictionary,
  ContactInfoItem,
  ContactInfoProjectOption,
  CreateContactInfoFormValues
} from './types'

type PendingSuccessAlert = {
  message: string
  execution_id?: string
}

type Props = {
  dictionary: ContactInfoDictionary
  locale: string
  sessiontoken?: string
  contact: ContactInfoItem | null
  project?: ContactInfoProjectOption | null
  error?: string | null
}

const buildProjectOption = (
  contact: ContactInfoItem | null,
  project?: ContactInfoProjectOption | null
): ContactInfoProjectOption | null => {
  if (!contact) return null

  const code = project?.code?.trim() || contact.project_code?.trim() || ''
  const name = project?.name?.trim() || contact.project_name?.trim() || ''
  const fallback = `#${contact.project_id}`

  return {
    id: contact.project_id,
    code,
    name: name || code || fallback,
    status: '',
    address: ''
  }
}

const ContactInfoEditPage = ({ dictionary, locale, sessiontoken, contact, project = null, error = null }: Props) => {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(error)
  const [dialogOpen, setDialogOpen] = useState(Boolean(contact))
  const [pendingSuccessAlert, setPendingSuccessAlert] = useState<PendingSuccessAlert | null>(null)

  const goDetail = () => {
    if (contact?.id) router.push(`/${locale}/contact-info-view-detail/${contact.id}`)
    else router.push(`/${locale}/contact-info`)
  }

  const handleDialogExited = () => {
    if (!pendingSuccessAlert) return

    const alertData = pendingSuccessAlert

    setPendingSuccessAlert(null)
    SwalAlert(
      'success',
      alertData,
      'center',
      false,
      false,
      true,
      goDetail
    )
  }

  const updateContact = async (values: CreateContactInfoFormValues) => {
    if (!contact?.id) return

    setSaving(true)
    setSaveError(null)

    try {
      const result = await contactInfoService.updateProjectContact({
        sessiontoken,
        language: locale as any,
        fields: {
          id: contact.id,
          contact_type: values.contact_type,
          name: values.name.trim(),
          phone: values.phone.trim(),
          email: values.email.trim() || null,
          address: values.address.trim() || null,
          working_hours: values.working_hours.trim() || null,
          note: values.note.trim() || null,
          display_order: values.display_order === '' ? null : Number(values.display_order),
          status: values.status || contact.status || 'A'
        }
      })

      setPendingSuccessAlert({
        message: result.message || contactInfoText(
          dictionary,
          'update_success',
          locale === 'vi' ? 'Cập nhật thông tin liên hệ thành công' : 'Contact information updated successfully'
        ),
        execution_id: result.execution_id
      })
      setSaving(false)
      setDialogOpen(false)
    } catch (err) {
      SwalAlert(
        'error',
        err instanceof Error
          ? err
          : {
            message: contactInfoText(dictionary, 'update_failed', 'Unable to update project contact.'),
            ...(typeof err === 'object' && err !== null ? err : {})
          },
        'center'
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <ContentWrapper
      title={contactInfoText(dictionary, 'edit_title', 'Update Project Contact')}
      description={contactInfoText(dictionary, 'page_subtitle', 'Update project contact information.')}
      icon={<ContactPhoneIcon sx={{ fontSize: 40, color: 'primary.main' }} />}
      dictionary={dictionary}
      issearch
    >
      <Stack spacing={3} sx={{ mt: 3 }}>
        {!contact && (
          <Alert severity={saveError ? 'error' : 'info'}>
            {saveError ?? contactInfoText(dictionary, 'detail_not_found', 'Project contact detail was not found.')}
          </Alert>
        )}
      </Stack>

      <ContactInfoCreateDialog
        dictionary={dictionary}
        open={dialogOpen}
        mode="edit"
        loading={saving}
        error={saveError}
        project={buildProjectOption(contact, project)}
        contact={contact}
        onClose={goDetail}
        onSubmit={values => void updateContact(values)}
        onExited={handleDialogExited}
      />
    </ContentWrapper>
  )
}

export default ContactInfoEditPage
