// MUI Imports
import type { Theme } from '@mui/material/styles'
import type { CSSObject } from '@emotion/react'
import { horizontalNavClasses } from '@menu/utils/menuClasses'

const menuRootStyles = (theme: Theme): CSSObject => {
  const ulBase: CSSObject = {
    display: 'flex',
    flexWrap: 'nowrap',
    overflowX: 'auto',
    overflowY: 'hidden',
    whiteSpace: 'nowrap',
    scrollBehavior: 'smooth',
    WebkitOverflowScrolling: 'touch',
    msOverflowStyle: 'none',
    scrollbarWidth: 'none',
    '&::-webkit-scrollbar': { display: 'none' }
  }

  return {
    minWidth: 0,
    overflow: 'hidden',

    [`.${horizontalNavClasses.root}:has(&)`]: {
      padding: theme.spacing(2),
      margin: theme.spacing(-2),
      minWidth: 0
    } as CSSObject,

    '& > nav, & > ul, & [role="menubar"]': {
      minWidth: 0
    } as CSSObject,

    '& > nav > ul, & > ul, & [role="menubar"]': {
      ...ulBase,
      flexWrap: 'nowrap !important' as any
    } as CSSObject,

    '& > nav > ul > li, & > ul > li, & [role="menubar"] > li': {
      flex: '0 0 auto !important' as any,
      maxWidth: 'none'
    } as CSSObject,

    '& > nav > ul > li > *, & > ul > li > *, & [role="menubar"] > li > *': {
      whiteSpace: 'nowrap'
    } as CSSObject,

    '& > nav > ul > li:not(:last-of-type), & > ul > li:not(:last-of-type), & [role="menubar"] > li:not(:last-of-type)': {
      marginInlineEnd: theme.spacing(1)
    } as CSSObject
  } as CSSObject
}

export default menuRootStyles
