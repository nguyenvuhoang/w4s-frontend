'use client'

import { useAdminPropertyContext } from '@/features/properties/PropertyRouteContext'
import { propertyPath } from '@/features/properties/propertyPaths'

import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import CancelIcon from '@mui/icons-material/Cancel'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined'
import { Alert, Button, Stack, Typography } from '@mui/material'

import ContentWrapper from '@/features/dynamicform/components/layout/content-wrapper'
import { useRouter } from '@shared/hooks/useRouter'
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
import { useApartmentEditForm } from './hooks/useApartmentEditForm'
import type { ApartmentDetailApartment, ApartmentDetailResult, ApartmentPageProps } from './types'

type Props = ApartmentPageProps & {
  apartmentId: number
  /** Loaded by the route (WF_BO_GET_APARTMENT_DETAIL). */
  initialDetail: ApartmentDetailResult
  initialError?: string | null
}

const EditForm = ({
  dictionary,
  locale,
  sessiontoken,
  apartment,
  projectLabel
}: Pick<Props, 'dictionary' | 'locale'> & { sessiontoken?: string; apartment: ApartmentDetailApartment; projectLabel: string }) => {
  const form = useApartmentEditForm({ dictionary, sessiontoken, locale, apartment })
  const { values, errors } = form
  const busy = form.saving || form.optionsLoading

  return (
    <Stack spacing={3} sx={{ mt: 3 }}>
      <Typography variant="caption" color="text.secondary">
        {apartmentText(dictionary, 'apartmentEditBreadcrumb', 'Properties / Apartment / Apartment detail / Edit apartment')}
      </Typography>

      {form.submitError && <Alert severity="error">{form.submitError}</Alert>}
      {form.optionsError && <Alert severity="warning">{form.optionsError}</Alert>}

      {/* The apartment's project is context for the tower/floor cascade only: read-only, never sent (no project_id in the update contract). */}
      <ApartmentLocationSection
        dictionary={dictionary}
        projectLabel={projectLabel}
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
      >
        <ApartmentRecordStatusSelect
          dictionary={dictionary}
          value={values.status}
          error={errors.status}
          disabled={form.saving}
          onChange={value => form.updateValue('status', value)}
        />
      </ApartmentInfoSection>
      <ApartmentTechnicalSection dictionary={dictionary} values={values} disabled={form.saving} updateValue={form.updateValue} />
      <ApartmentHandoverSection dictionary={dictionary} values={values} disabled={form.saving} updateValue={form.updateValue} />

      <Stack direction="row" justifyContent="flex-end" gap={1}>
        <Button variant="outlined" startIcon={<CancelIcon fontSize="small" />} disabled={form.saving} onClick={form.backToDetail}>
          {commonText(dictionary, 'cancel', 'Cancel')}
        </Button>
        <Button variant="contained" startIcon={<SaveOutlinedIcon fontSize="small" />} disabled={busy} onClick={() => void form.submit()}>
          {form.saving ? commonText(dictionary, 'processing', 'Processing...') : apartmentText(dictionary, 'saveChanges', 'Save changes')}
        </Button>
      </Stack>
    </Stack>
  )
}

/** Edit Apartment page (/properties/unit/[id]/edit) — WF_BO_UPDATE_APARTMENT. */
const ApartmentEditPage = ({ dictionary, session, locale, apartmentId, initialDetail, initialError = null }: Props) => {
  const router = useRouter()
  const admin = useAdminPropertyContext()
  const apartment = initialDetail.apartment
  const project = initialDetail.project
  const projectLabel = project?.name
    ? formatProjectLabel({ code: project.project_code, name: project.name })
    : (apartment?.project_code ?? '')

  return (
    <ContentWrapper
      title={apartmentText(dictionary, 'editApartment', 'Edit Apartment')}
      description={apartmentText(dictionary, 'apartmentEditSubtitle', 'Update the apartment information.')}
      icon={<EditOutlinedIcon sx={{ fontSize: 40, color: 'primary.main' }} />}
      dictionary={dictionary}
    >
      {initialError || !apartment ? (
        <Stack spacing={2} sx={{ mt: 3, alignItems: 'flex-start' }}>
          <Alert severity="error" sx={{ width: '100%' }}>{initialError || apartmentText(dictionary, 'apartmentNotFound', 'Apartment not found.')}</Alert>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => router.push(apartmentId > 0 ? `/${locale}${propertyPath('unit', admin)}/${apartmentId}` : `/${locale}${propertyPath('unit', admin)}`)}
          >
            {apartmentId > 0
              ? apartmentText(dictionary, 'backToApartmentDetail', 'Back to apartment detail')
              : apartmentText(dictionary, 'backToApartmentList', 'Back to apartment list')}
          </Button>
        </Stack>
      ) : (
        <EditForm
          dictionary={dictionary}
          locale={locale}
          sessiontoken={session?.user?.token ?? undefined}
          apartment={apartment}
          projectLabel={projectLabel}
        />
      )}
    </ContentWrapper>
  )
}

export default ApartmentEditPage
