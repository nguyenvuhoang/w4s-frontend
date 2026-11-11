'use client'

import GridViewIcon from '@mui/icons-material/GridView'
import ViewListIcon from '@mui/icons-material/ViewList'
import { ToggleButton, ToggleButtonGroup, Tooltip } from '@mui/material'

import { projectText } from './projectListHelpers'
import type { ProjectDictionary, ProjectViewMode } from './projectListHelpers'

type Props = {
  dictionary: ProjectDictionary
  value: ProjectViewMode
  onChange: (mode: ProjectViewMode) => void
}

const ProjectViewToggle = ({ dictionary, value, onChange }: Props) => {
  const gridLabel = projectText(dictionary, 'gridView', 'Grid view')
  const listLabel = projectText(dictionary, 'listView', 'List view')

  return (
    <ToggleButtonGroup
      exclusive
      size="small"
      color="primary"
      value={value}
      // Clicking the already selected button reports null in exclusive mode: keep the current view.
      onChange={(_, next: ProjectViewMode | null) => {
        if (next) onChange(next)
      }}
    >
      <Tooltip title={gridLabel}>
        <ToggleButton value="grid" aria-label={gridLabel}>
          <GridViewIcon />
        </ToggleButton>
      </Tooltip>
      <Tooltip title={listLabel}>
        <ToggleButton value="list" aria-label={listLabel}>
          <ViewListIcon />
        </ToggleButton>
      </Tooltip>
    </ToggleButtonGroup>
  )
}

export default ProjectViewToggle
