'use client'

import type { ProjectModel } from '../types'
import ProjectGridView from './ProjectGridView'
import ProjectListTable from './ProjectListTable'
import type { ProjectDictionary, ProjectViewMode } from './projectListHelpers'

type Props = {
  dictionary: ProjectDictionary
  viewMode: ProjectViewMode
  projects: ProjectModel[]
  onOpenProject: (project: ProjectModel) => void
  onHoverStart: (event: React.MouseEvent<HTMLElement>, project: ProjectModel) => void
  onHoverEnd: () => void
}

// Both views render the same already-loaded page of projects; switching never reloads data.
const ProjectCollectionView = ({ dictionary, viewMode, projects, onOpenProject, onHoverStart, onHoverEnd }: Props) => (
  viewMode === 'grid' ? (
    <ProjectGridView
      dictionary={dictionary}
      projects={projects}
      onOpenProject={onOpenProject}
      onHoverStart={onHoverStart}
      onHoverEnd={onHoverEnd}
    />
  ) : (
    <ProjectListTable dictionary={dictionary} projects={projects} onOpenProject={onOpenProject} />
  )
)

export default ProjectCollectionView
