'use client'

import AddHomeWorkOutlinedIcon from '@mui/icons-material/AddHomeWorkOutlined'
import CancelIcon from '@mui/icons-material/Cancel'
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined'
import { Alert, Button, Stack, Typography } from '@mui/material'

import ContentWrapper from '@/features/dynamicform/components/layout/content-wrapper'
import RequireWorkingProject from '@/shared/components/project-context/RequireWorkingProject'
import { formatProjectLabel } from '@/shared/services/projectLookupService'

import { apartmentText, commonText } from './apartmentHelpers'
import {
  ApartmentHandoverSection,
  ApartmentInfoSection,
  ApartmentLocationSection,
  ApartmentRecordStatusSelect,
  ApartmentStatusSelect,
  ApartmentTechnicalSection
} from './components/ApartmentFormSections'
import { useApartmentCreateForm } from './hooks/useApartmentCreateForm'
import type { ApartmentPageProps } from './types'

/** Create Apartment page (/properties/unit/create) — WF_BO_CREATE_APARTMENT. */
const ApartmentCreatePage = ({ dictionary, session, locale }: ApartmentPageProps) => {
  const sessiontoken = session?.user?.token ?? undefined
  const form = useApartmentCreateForm({ dictionary, sessiontoken, locale })
  const { values, errors } = form

  return (
    <ContentWrapper
      title={apartmentText(dictionary, 'addApartment', 'Add Apartment')}
      description={apartmentText(dictionary, 'apartmentCreateSubtitle', 'Add a new apartment to the project.')}
      icon={<AddHomeWorkOutlinedIcon sx={{ fontSize: 40, color: 'primary.main' }} />}
      dictionary={dictionary}
      issearch
    >
      <RequireWorkingProject dictionary={dictionary} sessiontoken={sessiontoken} language={locale}>
        <Stack spacing={3} sx={{ mt: 3 }}>
          <Typography variant="caption" color="text.secondary">
            {apartmentText(dictionary, 'apartmentCreateBreadcrumb', 'Properties / Apartment / Add apartment')}
          </Typography>

          {form.submitError && <Alert severity="error">{form.submitError}</Alert>}
          {form.optionsError && <Alert severity="warning">{form.optionsError}</Alert>}

          {/* Project is the working project (project context): shown read-only, sent as project_id. */}
          <ApartmentLocationSection
            dictionary={dictionary}
            projectLabel={form.project ? formatProjectLabel(form.project) : ''}
            values={values}
            errors={errors}
            disabled={form.saving}
            buildingOptions={form.buildingOptions}
            buildingsLoading={form.buildingsLoading}
            floorOptions={form.floorOptions}
            floorsLoading={form.floorsLoading}
            onBuildingChange={buildingId => void form.changeBuilding(buildingId)}
            updateValue={form.updateValue}
          />
          <ApartmentInfoSection
            dictionary={dictionary}
            locale={locale}
            apartmentCode={form.apartmentCode}
            apartmentCodeCustom={form.apartmentCodeCustom}
            onApartmentCodeChange={form.changeApartmentCode}
            onApartmentCodeRestore={form.restoreApartmentCode}
            values={values}
            errors={errors}
            disabled={form.saving}
            updateValue={form.updateValue}
            apartmentStatusField={
              <ApartmentStatusSelect
                dictionary={dictionary}
                locale={locale}
                value={values.apartment_status}
                disabled={form.saving}
                onChange={value => form.updateValue('apartment_status', value)}
              />
            }
            statusField={
              <ApartmentRecordStatusSelect
                dictionary={dictionary}
                value={values.status}
                error={errors.status}
                disabled={form.saving}
                onChange={value => form.updateValue('status', value)}
              />
            }
          />
          <ApartmentTechnicalSection dictionary={dictionary} values={values} disabled={form.saving} updateValue={form.updateValue} />
          <ApartmentHandoverSection dictionary={dictionary} values={values} disabled={form.saving} updateValue={form.updateValue} />

          <Stack direction="row" justifyContent="flex-end" gap={1}>
            <Button variant="outlined" startIcon={<CancelIcon fontSize="small" />} disabled={form.saving} onClick={form.backToList}>
              {commonText(dictionary, 'cancel', 'Cancel')}
            </Button>
            <Button variant="contained" startIcon={<SaveOutlinedIcon fontSize="small" />} disabled={form.saving} onClick={() => void form.submit()}>
              {form.saving ? commonText(dictionary, 'processing', 'Processing...') : commonText(dictionary, 'save', 'Save')}
            </Button>
          </Stack>
        </Stack>
      </RequireWorkingProject>
    </ContentWrapper>
  )
}

export default ApartmentCreatePage
