// MUI Imports
import type { Theme } from '@mui/material/styles'

// Type Imports
import type { Skin } from '@core/types'

const dialog = (skin: Skin): Theme['components'] => ({
  MuiDialog: {
    styleOverrides: {
      paper: ({ theme }) => ({
        ...(skin !== 'bordered'
          ? {
              boxShadow: 'var(--mui-customShadows-lg)'
            }
          : {
              boxShadow: 'none'
            }),
        [theme.breakpoints.down('sm')]: {
          '&:not(.MuiDialog-paperFullScreen)': {
            margin: theme.spacing(6)
          }
        }
      })
    }
  },
  MuiDialogTitle: {
    defaultProps: {
      variant: 'h5'
    },
    styleOverrides: {
      root: ({ theme }) => ({
        padding: theme.spacing(5),
        '& + .MuiDialogActions-root': {
          paddingBlockStart: 0
        }
      })
    }
  },
  MuiDialogContent: {
    styleOverrides: {
      root: ({ theme }) => ({
        padding: theme.spacing(5),
        '& + .MuiDialogContent-root, & + .MuiDialogActions-root': {
          paddingBlockStart: 0
        },

        // Footer Actions convention: when the footer is visually separated from the content
        // (content `dividers` or actions `dialog-actions-bordered`), keep 16px above/below the buttons
        // so they never touch the separator line. Higher specificity than feature-level `sx` padding.
        '&.MuiDialogContent-dividers + .MuiDialogActions-root, & + .MuiDialogActions-root.dialog-actions-bordered': {
          paddingBlockStart: theme.spacing(4),
          paddingBlockEnd: theme.spacing(4)
        }
      })
    }
  },
  MuiDialogActions: {
    styleOverrides: {
      root: ({ theme }) => ({
        padding: theme.spacing(5),

        // Footer Actions convention: 12px between action buttons (also when wrapping on mobile).
        '&.MuiDialogActions-root': {
          gap: theme.spacing(3)
        },
        '& .MuiButtonBase-root:not(:first-of-type)': {
          marginInlineStart: theme.spacing(4)
        },

        // Direct-child buttons are spaced by `gap`; nested button groups keep their margin.
        '& > .MuiButtonBase-root:not(:first-of-type)': {
          marginInlineStart: 0
        },
        '&:where(.dialog-actions-bordered)': {
          borderBlockStart: '1px solid var(--mui-palette-divider)'
        },
        '&:where(.dialog-actions-dense)': {
          padding: theme.spacing(2.5),
          '& .MuiButton-text': {
            paddingInline: theme.spacing(2.5)
          }
        }
      })
    }
  }
})

export default dialog
