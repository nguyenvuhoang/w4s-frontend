'use client'

import AddIcon from '@mui/icons-material/Add'
import ContactPhoneIcon from '@mui/icons-material/ContactPhone'
import { Alert, Button, Paper, Snackbar, Stack, Typography } from '@mui/material'
import { useRouter } from '@shared/hooks/useRouter'

import PaginationPage from '@/@core/components/jTable/pagination'
import ContentWrapper from '@/features/dynamicform/components/layout/content-wrapper'
import RequireWorkingProject from '@/shared/components/project-context/RequireWorkingProject'
import { formatProjectLabel } from '@/shared/services/projectLookupService'

import ContactInfoCreateDialog from './components/ContactInfoCreateDialog'
import ContactInfoDeleteDialog from './components/ContactInfoDeleteDialog'
import ContactInfoFilterBar from './components/ContactInfoFilterBar'
import { commonText, contactInfoText } from './components/contactInfoHelpers'
import ContactInfoTable from './components/ContactInfoTable'
import { useContactInfoSearch } from './hooks/useContactInfoSearch'
import type {
  ContactInfoFilterModel,
  ContactInfoPageProps,
  ContactInfoSearchResponse
} from './types'

type Props = ContactInfoPageProps & {
  initialFilter: ContactInfoFilterModel
  initialData: ContactInfoSearchResponse
}

const ContactInfoPage = ({
  dictionary,
  session,
  locale,
  initialFilter,
  initialData
}: Props) => {
  const router = useRouter()
  const sessiontoken = session?.user?.token ?? undefined
  const contacts = useContactInfoSearch({
    dictionary,
    sessiontoken,
    language: locale,
    initialFilter,
    initialData
  })

  return (
    <ContentWrapper
      title={contactInfoText(dictionary, 'page_title', 'Project Contact Information Management')}
      description={contactInfoText(dictionary, 'page_subtitle', 'Select a project to view its management board, security and emergency contact information.')}
      icon={<ContactPhoneIcon sx={{ fontSize: 40, color: 'primary.main' }} />}
      dictionary={dictionary}
      issearch
    >
      <RequireWorkingProject dictionary={dictionary} sessiontoken={sessiontoken} language={locale}>
      <Stack spacing={3} sx={{ mt: 3 }}>
        <Stack spacing={3}>
          <Paper sx={{ p: 2, borderRadius: 2, border: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
            <Stack direction={{ xs: 'column', md: 'row' }} alignItems={{ xs: 'flex-start', md: 'center' }} justifyContent="space-between" gap={1.5}>
              <Stack spacing={0.25}>
                <Typography variant="h6" sx={{ fontWeight: 800 }}>
                  {contactInfoText(dictionary, 'contacts_section_title', 'Contact information')}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {contacts.selectedProject
                    ? `${contactInfoText(dictionary, 'viewing_project', 'Viewing')}: ${formatProjectLabel(contacts.selectedProject)}`
                    : contactInfoText(dictionary, 'select_project_hint', 'Select a project to view contact information.')}
                </Typography>
              </Stack>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={contacts.openCreate}
                disabled={!contacts.selectedProject}
              >
                {contactInfoText(dictionary, 'add_contact', 'Add Contact')}
              </Button>
            </Stack>
          </Paper>

          <ContactInfoFilterBar
                dictionary={dictionary}
                filter={contacts.draftFilter}
                disabled={contacts.loadingContacts}
                onChange={contacts.updateDraftFilter}
                onSearch={contacts.handleSearch}
                onReset={contacts.handleReset}
              />

              {contacts.error && (
                <Alert
                  severity="error"
                  action={
                    <Button color="inherit" size="small" onClick={() => void contacts.loadData()}>
                      {commonText(dictionary, 'retry', 'Retry')}
                    </Button>
                  }
                >
                  {contacts.error}
                </Alert>
              )}

              <ContactInfoTable
                dictionary={dictionary}
                rows={contacts.rows}
                loading={contacts.loadingContacts}
                pageIndex={contacts.filter.page_index}
                pageSize={contacts.filter.page_size}
                onOpenDetail={row => {
                  if (row.id) router.push(`/${locale}/contact-info-view-detail/${row.id}`)
                }}
              />

              {contacts.totalCount > 0 && (
                <PaginationPage
                  page={contacts.filter.page_index}
                  pageSize={contacts.filter.page_size}
                  totalResults={contacts.totalCount}
                  jumpPage={contacts.filter.page_index}
                  handlePageSizeChange={contacts.handlePageSizeChange}
                  handlePageChange={contacts.handlePageChange}
                  handleJumpPage={contacts.handleJumpPage}
                  dictionary={dictionary}
                />
              )}
        </Stack>
      </Stack>
      </RequireWorkingProject>

      <ContactInfoCreateDialog
        dictionary={dictionary}
        open={contacts.createOpen}
        mode={contacts.formMode}
        loading={contacts.createLoading}
        formLoading={contacts.formLoading}
        error={contacts.createError}
        project={contacts.selectedProject}
        contact={contacts.editingContact}
        onClose={contacts.closeCreate}
        onSubmit={values => {
          if (contacts.formMode === 'edit') void contacts.updateContact(values)
          else void contacts.createContact(values)
        }}
      />

      <ContactInfoDeleteDialog
        dictionary={dictionary}
        contact={contacts.deleteTarget}
        loading={contacts.deleteLoading}
        error={contacts.deleteError}
        onClose={contacts.closeDeleteConfirm}
        onConfirm={() => void contacts.deleteContact()}
      />

      <Snackbar
        open={Boolean(contacts.successMessage)}
        autoHideDuration={3000}
        onClose={contacts.closeSuccessMessage}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert severity="success" variant="filled" onClose={contacts.closeSuccessMessage}>
          {contacts.successMessage}
        </Alert>
      </Snackbar>
    </ContentWrapper>
  )
}

export default ContactInfoPage
