// MUI Imports
import type { Theme } from '@mui/material/styles'

const formControlLabel: Theme['components'] = {
  MuiFormControlLabel: {
    styleOverrides: {
      root: ({ theme }) => ({
        marginInlineStart: theme.spacing(-2),
        fontFamily: "Quicksand"
      }),
      label: {
        '&, &.Mui-disabled': {
          color: 'rgb(12, 45, 28) !important',
          fontFamily: "Quicksand"
        },
        '&.Mui-disabled': {
          opacity: 0.45,
          fontFamily: "Quicksand"
        }
      }
    }
  }
}

export default formControlLabel
