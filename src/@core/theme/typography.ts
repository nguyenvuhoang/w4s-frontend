// MUI Imports
import type { Theme } from '@mui/material/styles'

const typography = (fontFamily: string): Theme['typography'] =>
  (({
    fontFamily:
      typeof fontFamily === 'undefined' || fontFamily === ''
        ? [
          'var(--font-quicksand-sans)',
          'Quicksand',
          'sans-serif',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          '"Helvetica Neue"',
          'Arial',
          'sans-serif',
          '"Apple Color Emoji"',
          '"Segoe UI Emoji"',
          '"Segoe UI Symbol"'
        ].join(',')
        : fontFamily,

    fontSize: 13.125,

    h1: {
      fontSize: '2.875rem',
      fontWeight: 500,
      lineHeight: 1.478261,
      fontFamily: "var(--font-quicksand-sans), Quicksand, sans-serif"
    },

    h2: {
      fontSize: '2.375rem',
      fontWeight: 500,
      lineHeight: 1.47368421,
      fontFamily: "var(--font-quicksand-sans), Quicksand, sans-serif"
    },

    h3: {
      fontSize: '1.75rem',
      fontWeight: 500,
      lineHeight: 1.5,
      fontFamily: "var(--font-quicksand-sans), Quicksand, sans-serif"
    },

    h4: {
      fontSize: '1.5rem',
      fontWeight: 500,
      lineHeight: 1.58334,
      fontFamily: "var(--font-quicksand-sans), Quicksand, sans-serif"
    },

    h5: {
      fontSize: '1.125rem',
      fontWeight: 500,
      lineHeight: 1.5556,
      fontFamily: "var(--font-quicksand-sans), Quicksand, sans-serif"
    },

    h6: {
      fontSize: '0.9375rem',
      fontWeight: 500,
      lineHeight: 1.46667,
      fontFamily: "var(--font-quicksand-sans), Quicksand, sans-serif"
    },

    subtitle1: {
      fontSize: '0.9375rem',
      lineHeight: 1.46667,
      fontFamily: "var(--font-quicksand-sans), Quicksand, sans-serif"
    },

    subtitle2: {
      fontSize: '0.8125rem',
      fontWeight: 400,
      lineHeight: 1.53846154,
      fontFamily: "var(--font-quicksand-sans), Quicksand, sans-serif"
    },

    body1: {
      fontSize: '0.9375rem',
      lineHeight: 1.46667,
      fontFamily: "var(--font-quicksand-sans), Quicksand, sans-serif"
    },

    body2: {
      fontSize: '0.8125rem',
      lineHeight: 1.53846154,
      fontFamily: "var(--font-quicksand-sans), Quicksand, sans-serif"
    },

    button: {
      fontSize: '0.9375rem',
      lineHeight: 1.46667,
      textTransform: 'none'
    },

    caption: {
      fontSize: '0.8125rem',
      lineHeight: 1.38462,
      letterSpacing: '0.4px'
    },

    overline: {
      fontSize: '0.75rem',
      lineHeight: 1.16667,
      letterSpacing: '0.8px'
    }
  }) as Theme['typography'])

export default typography
