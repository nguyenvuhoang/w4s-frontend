// MUI Imports
import type { Theme } from '@mui/material/styles'

const formControlLabel: Theme['components'] = {
  MuiFormControlLabel: {
    styleOverrides: {
      root: ({ theme }) => ({
        marginInlineStart: theme.spacing(-2),
        // Remove fontFamily to inherit from dynamic theme

      }),
      label: {
        '&, &.Mui-disabled': {
          color: 'rgb(12, 45, 28) !important',
          // Remove fontFamily to inherit from dynamic theme

        },
        '&.Mui-disabled': {
          opacity: 0.45,
          // Remove fontFamily to inherit from dynamic theme

        }
      }
    }
  }
}

export default formControlLabel
