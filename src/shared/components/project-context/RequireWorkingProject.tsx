'use client'

import type { ReactNode } from 'react'
import { useEffect, useRef } from 'react'

import ApartmentIcon from '@mui/icons-material/Apartment'
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline'
import LockPersonIcon from '@mui/icons-material/LockPerson'
import { Box, Button, Paper, Stack, Typography } from '@mui/material'

import type { Locale } from '@/configs/i18n'
import EntityCardPickerModal from '@/shared/components/entity-card-picker/EntityCardPickerModal'
import { useWorkingProjectPicker } from '@/shared/hooks/useWorkingProjectPicker'
import { formatProjectLabel } from '@/shared/services/projectLookupService'
import SyncOverlay from '@/views/components/SyncOverlay'
import SystemUnavailableState from './SystemUnavailableState'

const headerText = (dictionary: any, key: string, fallback: string) => dictionary?.header?.[key] ?? fallback

type Props = {
  dictionary?: any
  sessiontoken?: string
  language?: Locale | string
  children: ReactNode
}

const CenteredCard = ({ children }: { children: ReactNode }) => (
  <Box sx={{ py: 6, display: 'flex', justifyContent: 'center' }}>
    <Paper sx={{ p: 4, borderRadius: 2, maxWidth: 480, textAlign: 'center' }}>
      <Stack spacing={2} alignItems="center">
        {children}
      </Stack>
    </Paper>
  </Box>
)

/**
 * Gates project-dependent screens: children only mount once the project context has finished
 * resolving (WF_BO_GET_BO_CONTEXT) AND a project that is actually in the authorized list has
 * been selected. This is what stops those screens from calling any scope-dependent API while
 * the context is still loading, or with an unauthorized project.
 */
const RequireWorkingProject = ({ dictionary, sessiontoken, language, children }: Props) => {
  const picker = useWorkingProjectPicker({ dictionary, sessiontoken, language })
  const hasAutoOpenedRef = useRef(false)

  // The previously selected project is no longer authorized (revoked, or the user changed):
  // open the picker straight away instead of making the user hunt for the button, but only once.
  useEffect(() => {
    if (
      picker.status === 'REQUIRE_SELECTION' &&
      !picker.workingProject &&
      picker.wasProjectInvalidated &&
      picker.totalCount > 0 &&
      !hasAutoOpenedRef.current
    ) {
      hasAutoOpenedRef.current = true
      picker.openPicker()
    }
  }, [picker.status, picker.workingProject, picker.wasProjectInvalidated, picker.totalCount, picker])

  // This gate mounts INSIDE the dashboard content area (Header/Sidebar are rendered by an
  // ancestor — DashboardShell/HorizontalLayout). LOADING here only ever happens from an explicit
  // retry after ERROR, since DashboardContent already keeps the whole screen off until
  // ProjectContext is first READY. `mode="content"` (default) confines the overlay to this content
  // wrapper instead of covering Header/Sidebar with a full-viewport `standalone` overlay.
  if (picker.status === 'LOADING') {
    return (
      <Box sx={{ position: 'relative', minHeight: 300 }}>
        <SyncOverlay
          open
          message={headerText(dictionary, 'working_project_boot_title', 'Đang kết nối hệ thống')}
          description={headerText(dictionary, 'working_project_boot_description', 'Đang tải thông tin dự án và thiết lập phiên làm việc...')}
        />
      </Box>
    )
  }

  if (picker.status === 'NO_PROJECT_ACCESS') {
    return (
      <CenteredCard>
        <LockPersonIcon color="warning" sx={{ fontSize: 40 }} />
        <Typography variant="h6" sx={{ fontWeight: 800 }}>
          {headerText(dictionary, 'working_project_unauthorized_title', 'Your account has not been granted access to any project.')}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {headerText(dictionary, 'working_project_unauthorized_description', 'Please contact your administrator to request project access.')}
        </Typography>
      </CenteredCard>
    )
  }

  // Normally unreachable here (DashboardContent replaces the whole shell first), kept so this gate
  // never falls through to the "select a project" card while the bootstrap is unavailable.
  if (picker.status === 'SERVICE_UNAVAILABLE') {
    return (
      <SystemUnavailableState
        variant="content"
        dictionary={dictionary}
        retrying={picker.retrying}
        errorReference={picker.errorReference}
        onRetry={picker.handleRetry}
      />
    )
  }

  if (picker.status === 'ERROR') {
    return (
      <CenteredCard>
        <ErrorOutlineIcon color="error" sx={{ fontSize: 40 }} />
        <Typography variant="body2" color="text.secondary">
          {picker.error ?? headerText(dictionary, 'working_project_load_failed', 'Unable to load projects.')}
        </Typography>
        <Button variant="outlined" onClick={picker.handleRetry}>
          {headerText(dictionary, 'working_project_retry', 'Retry')}
        </Button>
      </CenteredCard>
    )
  }

  if (picker.workingProject) return <>{children}</>

  return (
    <>
      <CenteredCard>
        <ApartmentIcon color="primary" sx={{ fontSize: 40 }} />
        <Typography variant="h6" sx={{ fontWeight: 800 }}>
          {headerText(dictionary, 'require_project_title', 'Select a project to continue')}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {picker.wasProjectInvalidated
            ? headerText(dictionary, 'working_project_invalidated_description', 'Your previously selected project is no longer available to your account. Please choose another project.')
            : headerText(dictionary, 'require_project_description', 'This screen depends on a working project. Please select a project from the header first.')}
        </Typography>
        <Button variant="contained" startIcon={<ApartmentIcon />} onClick={picker.openPicker}>
          {headerText(dictionary, 'choose_project_button', 'Select project')}
        </Button>
      </CenteredCard>

      <EntityCardPickerModal
        open={picker.open}
        onClose={picker.closePicker}
        title={headerText(dictionary, 'working_project_picker_title', 'Select working project')}
        subtitle={headerText(dictionary, 'working_project_picker_subtitle', 'Choose the project you want to work on.')}
        items={picker.items}
        getKey={project => project.id}
        isSelected={project => picker.workingProject?.id === project.id}
        onSelect={picker.handleSelect}
        renderIcon={(_project, selected) => (
          <ApartmentIcon color={selected ? 'primary' : 'action'} sx={{ fontSize: 34 }} />
        )}
        renderTitle={project => formatProjectLabel(project)}
        loading={picker.loading}
        error={picker.error}
        onRetry={picker.handleRetry}
        retryLabel={headerText(dictionary, 'working_project_retry', 'Retry')}
        emptyTitle={headerText(dictionary, 'working_project_picker_empty_title', 'No project found')}
        emptyDescription={headerText(dictionary, 'working_project_picker_empty_description', 'Try a different search keyword.')}
        searchValue={picker.searchText}
        onSearchChange={picker.setSearchText}
        onSearchSubmit={picker.handleSearchSubmit}
        searchLabel={headerText(dictionary, 'working_project_search_label', 'Search')}
        searchPlaceholder={headerText(dictionary, 'working_project_search_placeholder', 'Search by project code or name')}
        pageIndex={picker.pageIndex + 1}
        pageCount={Math.max(1, Math.ceil(picker.totalCount / picker.pageSize))}
        onPageChange={picker.handlePageChange}
      />
    </>
  )
}

export default RequireWorkingProject
