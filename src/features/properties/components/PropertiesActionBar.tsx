import type { ReactNode } from 'react'

import { Stack } from '@mui/material'
import type { SxProps, Theme } from '@mui/material/styles'

/**
 * Compact sizing for the header action buttons of the Properties detail pages (back / refresh / edit /
 * delete...). Only dimensions change — variant, color, border radius, handlers and permissions stay with
 * each button. Scoped to this bar, so the global MuiButton theme (login, dialogs, forms) is untouched.
 */
export const propertiesActionButtonSx: SxProps<Theme> = {
  '& .MuiButton-root': {
    height: { xs: 38, md: 36 },
    minHeight: { xs: 38, md: 36 },
    paddingBlock: 0,
    paddingInline: '14px',
    fontSize: '0.875rem',
    lineHeight: 1.25,
    // One line: a long label ("Quay lại danh sách căn hộ") grows in width, never in height.
    whiteSpace: 'nowrap',
    alignItems: 'center'
  },
  '& .MuiButton-startIcon': {
    marginInlineEnd: '6px',
    '& > *:nth-of-type(1)': { fontSize: 18 }
  }
}

/** Header action bar of the Properties detail pages: wraps on small screens, same 36px buttons on desktop. */
const PropertiesActionBar = ({ children }: { children: ReactNode }) => (
  <Stack direction="row" gap={1} flexWrap="wrap" alignItems="center" sx={propertiesActionButtonSx}>
    {children}
  </Stack>
)

export default PropertiesActionBar
