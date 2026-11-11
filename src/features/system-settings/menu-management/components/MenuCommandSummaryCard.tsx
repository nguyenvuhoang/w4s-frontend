import EditRounded from '@mui/icons-material/EditRounded'
import LinkRounded from '@mui/icons-material/LinkRounded'
import { Chip, Paper, Stack, Typography } from '@mui/material'
import { alpha, useTheme } from '@mui/material/styles'

import type { MenuManagementDictionary } from '../types'
import { getCommandTypeMeta, getMenuVisibleHeaderMeta, menuManagementText } from './menuCommandHelpers'
import MenuCommandIconPreview from './MenuCommandIconPreview'

type Props = {
  dictionary: MenuManagementDictionary
  caption: string
  commandId: string
  commandType: string | null
  groupMenuVisible: string | null
  actionCode: string | null
  href: string | null
  icon: string | null
  editing?: boolean
}

// The "glance card" at the top of the detail page — on its own, without reading anything below
// it, a user should be able to tell what this record is (Menu vs. Feature), whether it's visible,
// and where it points. Takes primitives rather than a full MenuCommandItem so it can double as a
// live preview of in-progress edit-mode form values (see MenuCommandDetailContent).
const MenuCommandSummaryCard = ({
  dictionary,
  caption,
  commandId,
  commandType,
  groupMenuVisible,
  actionCode,
  href,
  icon,
  editing = false
}: Props) => {
  const theme = useTheme()
  const typeMeta = getCommandTypeMeta(dictionary, commandType)
  const isMenu = commandType === 'M'
  const visibleMeta = isMenu ? getMenuVisibleHeaderMeta(dictionary, groupMenuVisible) : null
  const actionBadge = !isMenu && actionCode ? actionCode : null

  return (
    <Paper
      sx={{
        p: { xs: 2, sm: 3 },
        borderRadius: 3,
        border: '1px solid',
        borderColor: editing ? alpha(theme.palette.warning.main, 0.5) : 'divider',
        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.14 : 0.07)} 0%, transparent 65%)`,
        transition: theme.transitions.create(['border-color'], { duration: 150 })
      }}
    >
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} gap={2}>
        <Stack direction="row" spacing={2} alignItems="center" sx={{ minWidth: 0 }}>
          <MenuCommandIconPreview icon={icon} boxSize={52} iconSize={26} />
          <Stack spacing={0.4} sx={{ minWidth: 0 }}>
            <Typography variant="h5" sx={{ fontWeight: 800, lineHeight: 1.25, wordBreak: 'break-word' }}>
              {caption}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
              {commandId}
            </Typography>
            {href && (
              <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mt: 0.25 }}>
                <LinkRounded sx={{ fontSize: 14, color: 'text.disabled' }} />
                <Typography
                  variant="caption"
                  sx={{ fontFamily: 'monospace', color: 'text.secondary', wordBreak: 'break-all' }}
                >
                  {href}
                </Typography>
              </Stack>
            )}
          </Stack>
        </Stack>

        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap alignItems="center" sx={{ flexShrink: 0 }}>
          {editing && (
            <Chip
              size="small"
              color="warning"
              variant="outlined"
              icon={<EditRounded sx={{ fontSize: 15 }} />}
              label={menuManagementText(dictionary, 'editing_badge', 'Đang chỉnh sửa')}
              sx={{ fontWeight: 700 }}
            />
          )}
          <Chip size="small" color={typeMeta.color} label={typeMeta.label} sx={{ fontWeight: 700 }} />
          {visibleMeta && (
            <Chip
              size="small"
              color={visibleMeta.color}
              variant={visibleMeta.color === 'success' ? 'filled' : 'outlined'}
              label={visibleMeta.label}
            />
          )}
          {actionBadge && (
            <Chip size="small" color="info" variant="outlined" label={actionBadge} sx={{ fontFamily: 'monospace', fontWeight: 700 }} />
          )}
        </Stack>
      </Stack>
    </Paper>
  )
}

export default MenuCommandSummaryCard
