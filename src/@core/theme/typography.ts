// MUI Imports
import type { Theme } from '@mui/material/styles'

const typography = (fontFamilyProp: string): Theme['typography'] => {
  const fontFamily = fontFamilyProp || 'Quicksand, sans-serif'

  return {
    fontFamily: fontFamily,
    fontWeightLight: 300,
    fontWeightRegular: 400,
    fontWeightMedium: 500,
    fontWeightBold: 700,
    h1: { fontSize: '2.875rem', fontWeight: 500, lineHeight: 1.478261, fontFamily: fontFamily },
    h2: { fontSize: '2.375rem', fontWeight: 500, lineHeight: 1.47368421, fontFamily: fontFamily },
    h3: { fontSize: '1.75rem', fontWeight: 500, lineHeight: 1.5, fontFamily: fontFamily },
    h4: { fontSize: '1.5rem', fontWeight: 500, lineHeight: 1.58334, fontFamily: fontFamily },
    h5: { fontSize: '1.125rem', fontWeight: 500, lineHeight: 1.5556, fontFamily: fontFamily },
    h6: { fontSize: '0.9375rem', fontWeight: 500, lineHeight: 1.46667, fontFamily: fontFamily },
    subtitle1: { fontSize: '0.9375rem', lineHeight: 1.46667, fontFamily: fontFamily },
    subtitle2: { fontSize: '0.8125rem', fontWeight: 400, lineHeight: 1.53846154, fontFamily: fontFamily },
    body1: { fontSize: '0.9375rem', lineHeight: 1.46667, fontFamily: fontFamily },
    body2: { fontSize: '0.8125rem', lineHeight: 1.53846154, fontFamily: fontFamily },
    button: { fontSize: '0.9375rem', lineHeight: 1.46667, textTransform: 'none', fontFamily: fontFamily },
    caption: { fontSize: '0.8125rem', lineHeight: 1.38462, letterSpacing: '0.4px', fontFamily: fontFamily },
    overline: { fontSize: '0.75rem', lineHeight: 1.16667, letterSpacing: '0.8px', fontFamily: fontFamily }
  } as Theme['typography']
}

export default typography
