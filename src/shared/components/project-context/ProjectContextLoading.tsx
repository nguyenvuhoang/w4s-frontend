'use client'

import { useEffect } from 'react'

import SyncOverlay from '@/views/components/SyncOverlay'
import { navTraceLoader } from '@/shared/utils/navigationDebug'

const headerText = (dictionary: any, key: string, fallback: string) => dictionary?.header?.[key] ?? fallback

type Props = {
  dictionary?: any
}

/**
 * Only ever rendered by DashboardContent BEFORE DashboardShell mounts (projectStatus !== READY —
 * no Header/Sidebar exist yet), so `mode="standalone"` is correct here. Never reuse this component
 * once the shell is mounted — a project-dependent screen inside the dashboard must use
 * `<SyncOverlay mode="content">` in its own content wrapper instead (see RequireWorkingProject).
 */
const ProjectContextLoading = ({ dictionary }: Props) => {
  useEffect(() => {
    navTraceLoader('ProjectContextLoading', true)

    return () => navTraceLoader('ProjectContextLoading', false)
  }, [])

  return (
    <SyncOverlay
      open
      mode="standalone"
      message={headerText(dictionary, 'working_project_boot_title', 'Đang kết nối hệ thống')}
      description={headerText(dictionary, 'working_project_boot_description', 'Đang tải thông tin dự án và thiết lập phiên làm việc...')}
    />
  )
}

export default ProjectContextLoading
