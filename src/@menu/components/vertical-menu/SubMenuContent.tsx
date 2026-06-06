'use client'

// React Imports
import type { ForwardRefRenderFunction, HTMLAttributes } from 'react'
import { forwardRef } from 'react'

// Third-party Imports
import styled from '@emotion/styled'

// Type Imports
import type { ChildrenType, RootStylesType } from '@shared/types'
import type { VerticalMenuContextProps } from './Menu'

export type SubMenuContentProps = HTMLAttributes<HTMLUListElement> &
  RootStylesType &
  Partial<ChildrenType> & {
    open?: boolean
    openWhenCollapsed?: boolean
    openWhenHovered?: boolean
    transitionDuration?: VerticalMenuContextProps['transitionDuration']
    isPopoutWhenCollapsed?: boolean
    level?: number
    isCollapsed?: boolean
    isHovered?: boolean
    browserScroll?: boolean
  }



const StyledSubMenuContent = styled('ul')<{
  open?: boolean
  transitionDuration?: number
}>`
  display: block;
  list-style: none;
  padding: 0;
  margin: 0;
  overflow: hidden;
  max-block-size: ${({ open }) => (open ? '1200px' : '0px')};
  opacity: ${({ open }) => (open ? 1 : 0)};
  transform: translateY(${({ open }) => (open ? '0' : '-4px')});
  transition:
    max-block-size ${({ transitionDuration }) => `${transitionDuration ?? 300}ms`} ease-in-out,
    opacity ${({ transitionDuration }) => `${transitionDuration ?? 300}ms`} ease-in-out,
    transform ${({ transitionDuration }) => `${transitionDuration ?? 300}ms`} ease-in-out;
`

const SubMenuContent: ForwardRefRenderFunction<HTMLUListElement, SubMenuContentProps> = (props, ref) => {
  // Props
  const {
    children,
    open,
    level,
    isCollapsed,
    isHovered,
    transitionDuration,
    isPopoutWhenCollapsed,
    openWhenCollapsed,
    browserScroll,
    ...rest
  } = props

  const { rootStyles, className, ...domProps } = rest as any
  const shouldOpen = Boolean(openWhenCollapsed || (open && !(isCollapsed && !isHovered)))

  return (
    <StyledSubMenuContent
      ref={ref}
      className={className}
      open={shouldOpen}
      transitionDuration={transitionDuration}
      style={{
        ...(typeof rootStyles === 'object' ? rootStyles : {})
      }}
      {...domProps}
    >
      {children}
    </StyledSubMenuContent>
  )
}

export default forwardRef(SubMenuContent)
