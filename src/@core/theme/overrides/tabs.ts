// MUI Imports
import type { Theme } from '@mui/material/styles'

const tabs: Theme['components'] = {
  MuiTabs: {
    styleOverrides: {
      root: ({ theme, ownerState }) => ({
        minBlockSize: 38,
        ...(ownerState.orientation === 'horizontal'
          ? {
            borderBlockEnd: '1px solid var(--mui-palette-divider)'
          }
          : {
            borderInlineEnd: '1px solid var(--mui-palette-divider)'
          }),
        '& .MuiTab-root:hover': {
          ...(ownerState.orientation === 'horizontal'
            ? {
              paddingBlockEnd: theme.spacing(1.5),
              ...(ownerState.textColor === 'secondary'
                ? {
                  borderBlockEnd: '2px solid var(--mui-palette-secondary-lightOpacity)'
                }
                : {
                  borderBlockEnd: '2px solid var(--mui-palette-primary-lightOpacity)'
                })
            }
            : {
              paddingInlineEnd: theme.spacing(5),
              ...(ownerState.textColor === 'secondary'
                ? {
                  borderInlineEnd: '2px solid var(--mui-palette-secondary-mainOpacity)'
                }
                : {
                  borderInlineEnd: '2px solid var(--mui-palette-primary-mainOpacity)'
                })
            }),
          '& .MuiTabScrollButton-root': {
            borderRadius: 'var(--mui-shape-customBorderRadius-lg)'
          }
        },
        '& ~ .MuiTabPanel-root': {
          ...(ownerState.orientation === 'horizontal'
            ? {
              paddingBlockStart: theme.spacing(5)
            }
            : {
              paddingInlineStart: theme.spacing(5)
            })
        }
      }),
      vertical: {
        minWidth: 131,
        '& .MuiTab-root': {
          minWidth: 130
        }
      }
    }
  },
  MuiTab: {
    styleOverrides: {
      root: ({ theme, ownerState }) => ({
        lineHeight: 1.4667,
        padding: theme.spacing(2, 5.5),
        minBlockSize: 38,
        // Remove fontFamily to inherit from dynamic theme

        '& > .MuiTab-iconWrapper': {
          fontSize: '1.125rem',
          ...(ownerState.iconPosition === 'top' && {
            marginBlockEnd: theme.spacing(2)
          }),
          ...(ownerState.iconPosition === 'bottom' && {
            marginBlockStart: theme.spacing(2)
          }),
          ...(ownerState.iconPosition === 'start' && {
            marginInlineEnd: theme.spacing(2)
          }),
          ...(ownerState.iconPosition === 'end' && {
            marginInlineStart: theme.spacing(2)
          })
        },
        '& > .MuiTab-selected': {
          backgroundColor: `white !important`,
        }

      })
    }
  },
  MuiTabPanel: {
    styleOverrides: {
      root: {
        padding: 0
      }
    }
  }
}

export default tabs
