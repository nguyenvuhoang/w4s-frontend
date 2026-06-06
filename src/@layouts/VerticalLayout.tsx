// React Imports
import type { ReactNode } from 'react'

// Third-party Imports
import classnames from 'classnames'

// Type Imports
import type { ChildrenType } from '@core/types'

// Component Imports
import LayoutContent from './components/vertical/LayoutContent'

// Util Imports
import { verticalLayoutClasses } from './utils/layoutClasses'

// Styled Component Imports
import StyledContentWrapper from './styles/vertical/StyledContentWrapper'

type VerticalLayoutProps = ChildrenType & {
  navigation?: ReactNode
  navbar?: ReactNode
  footer?: ReactNode
  navBackground?: ReactNode
}

const VerticalLayout = (props: VerticalLayoutProps) => {
  // Props
  const { navbar, navBackground, footer, navigation, children } = props

  return (
    <div
      className={classnames(verticalLayoutClasses.root, 'flex flex-auto main-content z-[1]')}
      style={{ minHeight: '100vh', overflowX: 'clip' }}
    >
      {navigation || null}
      <StyledContentWrapper
        className={classnames(verticalLayoutClasses.contentWrapper, 'flex flex-col flex-auto min-is-0 is-full')}
        style={{ minHeight: '100vh' }}
      >
        {navbar || null}
        {navBackground || null}
        {/* Content */}
        <LayoutContent>{children}</LayoutContent>
        {footer || null}
      </StyledContentWrapper>
    </div>
  )
}

export default VerticalLayout
