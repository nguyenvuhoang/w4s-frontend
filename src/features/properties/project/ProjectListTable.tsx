'use client'

import { Chip, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material'

import { useRowInteraction } from '@/shared/utils/rowInteraction'

import type { ProjectModel } from '../types'
import {
  displayProjectAddress,
  projectCommonText,
  projectStatusColor,
  projectStatusLabel,
  projectText
} from './projectListHelpers'
import type { ProjectDictionary } from './projectListHelpers'

type Props = {
  dictionary: ProjectDictionary
  projects: ProjectModel[]
  onOpenProject: (project: ProjectModel) => void
}

// Only columns backed by the project search response are shown (investor/province are not returned by it).
const ProjectListTable = ({ dictionary, projects, onOpenProject }: Props) => {
  const { getRowProps } = useRowInteraction<ProjectModel>({ mode: 'single-click', onOpenDetail: onOpenProject })

  const columns = [
    projectText(dictionary, 'projectCode', 'Project Code'),
    projectText(dictionary, 'projectName', 'Project Name'),
    projectText(dictionary, 'address', 'Address'),
    projectCommonText(dictionary, 'status', 'Status')
  ]

  return (
    <Paper sx={{ borderRadius: 2, overflow: 'hidden', border: 1, borderColor: 'divider' }}>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              {columns.map(label => (
                <TableCell key={label} sx={{ bgcolor: 'primary.main', color: 'common.white', fontWeight: 800, whiteSpace: 'nowrap' }}>
                  {label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {projects.map(project => (
              <TableRow key={project.id} {...getRowProps(project)}>
                <TableCell sx={{ fontWeight: 800, whiteSpace: 'nowrap' }}>{project.project_code}</TableCell>
                <TableCell>{project.name}</TableCell>
                <TableCell>{displayProjectAddress(dictionary, project.address)}</TableCell>
                <TableCell>
                  <Chip size="small" color={projectStatusColor(project.status)} label={projectStatusLabel(dictionary, project.status)} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  )
}

export default ProjectListTable
