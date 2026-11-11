import type { Locale } from '@/configs/i18n'
import AuthorizedLayout from '@components/layout/AuthorizedLayout'
import { getServerBackendToken } from '@/server/auth/getServerBackendToken'
import { getDictionary } from '@utils/getDictionary'

import { propertyAggregateService } from '../propertyAggregateService'
import type {
  ProjectBuildingModel,
  ProjectBuildingSummaryModel,
  ProjectContactItemModel,
  ProjectDetailModel
} from '../types'
import type { VietQrBank } from './bank/vietqr'
import { fetchVietQrBanks, getVietQrCredentials } from './bank/vietqr.server'
import ProjectDetailPage from './ProjectDetailPage'
import ProjectEditPage from './ProjectEditPage'
import {
  PROJECT_BUSINESS_PERMISSION_PATH,
  PROJECT_CONTEXT_BASE_PATH,
  PROJECT_MANAGEMENT_BASE_PATH,
  type ProjectAccessScope
} from './projectListHelpers'
import { resolveProjectProvince } from './province/projectProvinceValue'

/**
 * Server route body shared by every Project detail / edit route (business `/properties/project/:id`
 * and System Settings `/system-settings/projects/:id`): loads the project (WF_BO_GET_PROJECT_DETAIL),
 * its buildings and contacts, then renders ProjectDetailPage. `mode: 'edit'` renders the dedicated
 * ProjectEditPage instead (project detail only). The stored `province` is resolved here against the
 * Province master (code, or an exact legacy name) so both pages show the province name and Edit starts
 * with the right province_code.
 *
 * Access (AuthorizedLayout):
 * - business: the business Project screen rights (VIEW, MODIFY for edit);
 * - admin: the System Settings admin boundary (static super-admin policy of /system-settings).
 */
export async function renderProjectDetailRoute({
  locale,
  id,
  scope,
  mode = 'view'
}: {
  locale: Locale
  id: string
  scope: ProjectAccessScope
  mode?: 'view' | 'edit'
}) {
  const listHref = scope === 'admin' ? PROJECT_MANAGEMENT_BASE_PATH : PROJECT_CONTEXT_BASE_PATH
  const requiredPath = scope === 'admin' ? PROJECT_MANAGEMENT_BASE_PATH : PROJECT_BUSINESS_PERMISSION_PATH
  const dictionary = await getDictionary(locale)
  const projectId = Number(id)
  const sessiontoken = (await getServerBackendToken()) ?? undefined

  let initialProject: ProjectDetailModel | null = null
  let initialError: string | null = null
  let initialBuildings: ProjectBuildingModel[] = []
  let initialBuildingSummary: ProjectBuildingSummaryModel = {
    total_floors: 0,
    total_apartments: 0,
    total_residents: 0
  }
  let initialBuildingsError: string | null = null
  let initialContacts: ProjectContactItemModel[] = []
  let initialContactsError: string | null = null
  let vietQrBanks: VietQrBank[] = []
  let vietQrBanksError: string | null = null

  if (!Number.isInteger(projectId) || projectId <= 0) {
    initialError = dictionary.projectManagement?.projectNotFound ?? 'Project not found.'
  } else if (mode === 'edit') {
    // Edit loads only the project detail (incl. its bank accounts); no payment-gateway workflow is called here.
    // The VietQR bank list (public, cached) is loaded in parallel; its failure never blocks editing.
    const [projectResult, banksResult] = await Promise.all([
      Promise.allSettled([propertyAggregateService.get_project_detail({ sessiontoken, language: locale, project_id: projectId })]).then(([result]) => result),
      fetchVietQrBanks()
    ])

    vietQrBanks = banksResult.banks
    vietQrBanksError = banksResult.error
      ? (banksResult.error === 'timeout'
        ? (dictionary.projectManagement?.vietQrBanksTimeout ?? 'The VietQR bank list did not answer in time.')
        : (dictionary.projectManagement?.vietQrBanksError ?? 'Unable to load the VietQR bank list.'))
      : null

    if (projectResult.status === 'fulfilled') {
      initialProject = projectResult.value

      if (!initialProject) {
        initialError = dictionary.projectManagement?.projectNotFound ?? 'Project not found.'
      }
    } else {
      initialError = projectResult.reason instanceof Error
        ? projectResult.reason.message
        : (dictionary.projectManagement?.loadError ?? 'Unable to load project detail.')
    }
  } else {
    const [projectResult, buildingsResult, contactsResult] = await Promise.allSettled([
      propertyAggregateService.get_project_detail({ sessiontoken, language: locale, project_id: projectId }),
      propertyAggregateService.get_buildings_by_project_id({ sessiontoken, language: locale, project_id: projectId }),
      propertyAggregateService.get_project_contacts_by_project_id({ sessiontoken, language: locale, project_id: projectId })
    ])

    if (projectResult.status === 'fulfilled') {
      initialProject = projectResult.value

      if (!initialProject) {
        initialError = dictionary.projectManagement?.projectNotFound ?? 'Project not found.'
      }
    } else {
      initialError = projectResult.reason instanceof Error
        ? projectResult.reason.message
        : (dictionary.projectManagement?.loadError ?? 'Unable to load project detail.')
    }

    if (buildingsResult.status === 'fulfilled') {
      initialBuildings = buildingsResult.value.buildings
      initialBuildingSummary = {
        total_floors: buildingsResult.value.total_floors ?? 0,
        total_apartments: buildingsResult.value.total_apartments ?? 0,
        total_residents: buildingsResult.value.total_residents ?? 0
      }
    } else {
      initialBuildingsError = buildingsResult.reason instanceof Error
        ? buildingsResult.reason.message
        : (dictionary.projectManagement?.buildingsLoadError ?? 'Unable to load buildings.')
    }

    if (contactsResult.status === 'fulfilled') {
      initialContacts = contactsResult.value
    } else {
      initialContactsError = contactsResult.reason instanceof Error
        ? contactsResult.reason.message
        : (dictionary.projectManagement?.contactsLoadError ?? 'Unable to load project contacts.')
    }
  }

  // Display/selection only: a failed lookup leaves the province unresolved (never a fallback province).
  const initialProvince = initialProject?.province
    ? await resolveProjectProvince({ sessiontoken, language: locale, value: initialProject.province }).catch(() => null)
    : null

  if (mode === 'edit') {
    return (
      <AuthorizedLayout requiredPath={requiredPath} requiredAction="MODIFY" params={{ locale }}>
        {() => (
          <ProjectEditPage
            vietQrBanks={vietQrBanks}
            vietQrBanksError={vietQrBanksError}
            // Only whether the Generate API is configured reaches the page, never the credentials.
            vietQrGenerateAvailable={getVietQrCredentials() !== null}
            dictionary={dictionary}
            locale={locale}
            projectId={projectId}
            initialProject={initialProject}
            initialProvince={initialProvince}
            initialError={initialError}
            listHref={listHref}
            accessScope={scope}
          />
        )}
      </AuthorizedLayout>
    )
  }

  return (
    <AuthorizedLayout requiredPath={requiredPath} requiredAction="VIEW" params={{ locale }}>
      {() => (
        <ProjectDetailPage
          dictionary={dictionary}
          projectId={projectId}
          initialProject={initialProject}
          initialError={initialError}
          initialBuildings={initialBuildings}
          initialBuildingSummary={initialBuildingSummary}
          initialBuildingsError={initialBuildingsError}
          initialContacts={initialContacts}
          initialContactsError={initialContactsError}
          initialProvince={initialProvince}
          listHref={listHref}
          accessScope={scope}
        />
      )}
    </AuthorizedLayout>
  )
}
