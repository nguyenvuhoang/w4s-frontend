'use client'

import ApartmentIcon from '@mui/icons-material/Apartment'
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import { Box, Typography } from '@mui/material'

import type { Locale } from '@/configs/i18n'
import EntityCardPickerModal from '@/shared/components/entity-card-picker/EntityCardPickerModal'
import { formatProjectLabel } from '@/shared/services/projectLookupService'
import { useWorkingProjectPicker } from '@/shared/hooks/useWorkingProjectPicker'

const headerText = (dictionary: any, key: string, fallback: string) => dictionary?.header?.[key] ?? fallback

type Props = {
  dictionary?: any
  sessiontoken?: string
  language?: Locale | string
}

const WorkingProjectSelector = ({ dictionary, sessiontoken, language }: Props) => {
  const picker = useWorkingProjectPicker({ dictionary, sessiontoken, language })

  // The dashboard-level ProjectContextGate already blocks page content until status is
  // READY, but the Header itself renders regardless — so the selector must hide itself
  // outside READY rather than show a placeholder/half-authorized state.
  if (picker.status !== 'READY') return null

  const selectedLabel = picker.workingProject ? formatProjectLabel(picker.workingProject) : ''
  const placeholderLabel = headerText(dictionary, 'select_working_project_placeholder', 'Select project')

  return (
    <>
      <Box
        component="button"
        type="button"
        onClick={picker.openPicker}
        title={selectedLabel || placeholderLabel}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.5,
          maxWidth: 200,
          bgcolor: 'transparent',
          border: 0,
          p: 0,
          m: 0,
          cursor: 'pointer',
          color: 'primary.contrastText',
          '&:hover .working-project-label': { textDecoration: 'underline' },
          '&:focus-visible': { outline: 'none' }
        }}
      >
        <ApartmentIcon sx={{ fontSize: 18, color: 'primary.contrastText', flexShrink: 0 }} />
        <Typography
          className="working-project-label"
          variant="body2"
          component="span"
          noWrap
          sx={{ color: 'inherit', fontWeight: 500 }}
        >
          {selectedLabel || placeholderLabel}
        </Typography>
        <KeyboardArrowDownIcon sx={{ fontSize: 18, color: 'primary.contrastText', flexShrink: 0 }} />
      </Box>

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

export default WorkingProjectSelector
