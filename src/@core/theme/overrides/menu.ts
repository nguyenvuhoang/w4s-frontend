// MUI Imports
import type { Theme } from '@mui/material/styles'

// Type Imports
import type { Skin } from '@core/types'

const menu = (skin: Skin): Theme['components'] => ({
  MuiMenu: {
    defaultProps: {
      ...(skin === 'bordered' && {
        slotProps: {
          paper: {
            elevation: 0
          }
        }
      })
    },
    styleOverrides: {
      paper: ({ theme }) => ({
        marginBlockStart: theme.spacing(0.5),
        ...(skin !== 'bordered' && {
          boxShadow: 'var(--mui-customShadows-lg)'
        })
      })
    }
  },
  MuiMenuItem: {
    styleOverrides: {
      root: ({ theme }) => ({
        paddingBlock: theme.spacing(2),
        paddingInline: theme.spacing(5),
        gap: theme.spacing(2),
        color: 'var(--mui-palette-text-primary)',
        '& i, & svg': {
          fontSize: '1.375rem'
        },
        '& .MuiListItemIcon-root': {
          minInlineSize: 0
        },
        '&.Mui-selected': {
          backgroundColor: 'rgba(0, 0, 0, 0.08)',
          color: 'var(--mui-palette-primary-main) !important',
          '& .MuiListItemIcon-root': {
            color: 'var(--mui-palette-success-main) !important'
          }
        },
        '&.Mui-selected:hover': {
          backgroundColor: 'rgba(0, 0, 0, 0.12)'
        },
        '&.Mui-focusVisible': {
          backgroundColor: 'rgba(0, 0, 0, 0.08)'
        },
        '&.Mui-disabled': {
          color: 'var(--mui-palette-text-disabled) !important',
          opacity: 1
        }
      })
    }
  }
})

export default menu
