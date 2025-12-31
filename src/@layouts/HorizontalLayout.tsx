'use client'

// Context Imports
import { HorizontalNavProvider } from '@menu/contexts/horizontalNavContext';
// Type Imports
import type { ChildrenType } from '@core/types';
// React Imports
import type { ReactNode } from 'react';
// Third-party Imports
import classnames from 'classnames';
import { Box } from '@mui/material';

// Styled Component Imports
import StyledContentWrapper from './styles/horizontal/StyledContentWrapper';
// Component Imports
import LayoutContent from './components/horizontal/LayoutContent';
// Util Imports
import { horizontalLayoutClasses } from './utils/layoutClasses';


type HorizontalLayoutProps = ChildrenType & {
  header?: ReactNode
  footer?: ReactNode
}

const HorizontalLayout = (props: HorizontalLayoutProps) => {
  // Props
  const { header, footer, children } = props

  return (
    <Box className={classnames(horizontalLayoutClasses.root, 'flex flex-auto')}>
      <HorizontalNavProvider>
        <StyledContentWrapper className={classnames(horizontalLayoutClasses.contentWrapper, 'flex flex-col is-full')}>
          {header || null}
          <LayoutContent>{children}</LayoutContent>
          {footer || null}
        </StyledContentWrapper>
      </HorizontalNavProvider>
    </Box>
  )
}

export default HorizontalLayout
