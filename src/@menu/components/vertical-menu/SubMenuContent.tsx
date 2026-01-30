'use client'

// React Imports
import type { ForwardRefRenderFunction, HTMLAttributes, MutableRefObject } from 'react'
import { forwardRef, useEffect, useState } from 'react'

// Third-party Imports

// Type Imports
import type { ChildrenType, RootStylesType } from '@shared/types'
import type { VerticalMenuContextProps } from './Menu'

// Hooks Imports


// Styled Component Imports
import { useTheme } from '@mui/material/styles'

// Style Imports
import navigationCustomStyles from '@/@core/styles/vertical/navigationCustomStyles'
import useVerticalNav from '@/@menu/hooks/useVerticalNav'
import VerticalNav from './VerticalNav'

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

  // Extract non-DOM props to prevent React warnings
  const { rootStyles, className, ...domProps } = rest as any

  return (
    <ul
      ref={ref}
      className={className}
      style={{
        display: open ? 'block' : 'none',
        listStyle: 'none',
        padding: 0,
        margin: 0,
        ...(typeof rootStyles === 'object' ? rootStyles : {})
      }}
    >
      {children}
    </ul>
  )
}

export default forwardRef(SubMenuContent)
