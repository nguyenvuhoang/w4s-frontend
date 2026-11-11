'use client'

import ApartmentIcon from '@mui/icons-material/Apartment'
import { Box, Chip, Typography } from '@mui/material'
import { alpha, useTheme } from '@mui/material/styles'

import { useWorkingProject } from '@/@core/stores/useWorkingProjectStore'
import { formatProjectLabel } from '@/shared/services/projectLookupService'

const headerText = (dictionary: any, key: string, fallback: string) => dictionary?.header?.[key] ?? fallback

type Props = {
  dictionary?: any
}

/**
 * Only ever rendered by ProjectContextGate once status is READY, so `project` is guaranteed —
 * the null branch here is just defense in depth, not a state this component should drive.
 */
const ProjectContextBanner = ({ dictionary }: Props) => {
  const theme = useTheme()
  const project = useWorkingProject()

  if (!project) return null

  const accentColor = theme.palette.primary.main

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        px: 2,
        py: 0.75,
        mb: 3,
        borderRadius: 2,
        border: `1px solid ${alpha(accentColor, 0.2)}`,
        backgroundColor: alpha(accentColor, 0.06)
      }}
    >
      <ApartmentIcon sx={{ fontSize: 18, color: accentColor, flexShrink: 0 }} />
      <Typography variant='body2' sx={{ color: 'text.secondary' }} noWrap>
        {headerText(dictionary, 'project_context_banner_prefix', 'Bạn đang tương tác với dữ liệu của dự án:')}
      </Typography>
      <Chip label={formatProjectLabel(project)} size='small' color='primary' sx={{ fontWeight: 600 }} />
    </Box>
  )
}

export default ProjectContextBanner
