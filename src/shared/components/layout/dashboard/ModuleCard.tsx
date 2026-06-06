'use client'

import DashboardRounded from '@mui/icons-material/DashboardRounded'
import InfoOutlined from '@mui/icons-material/InfoOutlined'
import StarRounded from '@mui/icons-material/StarRounded'
import { Box, IconButton, Tooltip, Typography } from '@mui/material'
import { alpha, useTheme } from '@mui/material/styles'

import { MenuIcon } from '@components/GenerateMenu'
import type { SearchableMenuItem } from '../shared/menu-utils'

type ModuleCardProps = {
  item: SearchableMenuItem
  onClick: () => void
}

const ModuleCard = ({ item, onClick }: ModuleCardProps) => {
  const theme = useTheme()

  return (
    <Box
      onClick={onClick}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 1.35,
        p: 2.25,
        minHeight: 150,
        borderRadius: 3,
        backgroundColor: alpha(theme.palette.background.paper, 0.92),
        border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
        boxShadow: `0 10px 28px ${alpha(theme.palette.primary.main, 0.08)}`,
        transition: theme.transitions.create(['transform', 'box-shadow', 'border-color', 'background-color'], {
          duration: 200
        }),
        cursor: 'pointer',
        '&:hover': {
          transform: 'translateY(-3px)',
          borderColor: alpha(theme.palette.primary.main, 0.25),
          boxShadow: `0 16px 40px ${alpha(theme.palette.primary.main, 0.14)}`,
          backgroundColor: alpha(theme.palette.background.paper, 0.98),
          '& .card-actions': { opacity: 1 }
        }
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1.25 }}>
        <Box
          sx={{
            flexShrink: 0,
            inlineSize: 46,
            blockSize: 46,
            borderRadius: 2,
            display: 'grid',
            placeItems: 'center',
            color: theme.palette.primary.main,
            backgroundColor: alpha(theme.palette.primary.main, 0.09)
          }}
        >
          {item.icon ? (
            <MenuIcon icon={item.icon} size={24} color={theme.palette.primary.main} />
          ) : (
            <DashboardRounded sx={{ fontSize: 24, color: theme.palette.primary.main }} />
          )}
        </Box>

        <Box
          className='card-actions'
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.35,
            opacity: item.favorite ? 1 : 0,
            transition: theme.transitions.create('opacity', { duration: 200 })
          }}
        >
          {item.favorite && <StarRounded sx={{ fontSize: 14, color: '#E6A700' }} />}
          {(item.commandCode || item.route) && (
            <Tooltip title={item.commandCode ?? item.route ?? ''}>
              <IconButton size='small' sx={{ color: alpha(theme.palette.primary.main, 0.72), p: 0.3 }}>
                <InfoOutlined sx={{ fontSize: 14 }} />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Box>

      <Box sx={{ flex: 1, minHeight: 0 }}>
        <Typography variant='subtitle2' sx={{ fontWeight: 600, lineHeight: 1.35, color: 'text.primary' }}>
          {item.title}
        </Typography>
        <Typography variant='caption' sx={{ mt: 0.7, color: 'text.secondary', lineHeight: 1.5, display: 'block' }}>
          {item.description || item.breadcrumb}
        </Typography>
      </Box>

      {item.route && (
        <Typography
          variant='caption'
          sx={{
            color: alpha(theme.palette.primary.main, 0.8),
            letterSpacing: '0.01em',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}
        >
          {item.route}
        </Typography>
      )}
    </Box>
  )
}

export default ModuleCard
