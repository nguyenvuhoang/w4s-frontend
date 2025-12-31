'use client'

// React Imports
import type { ForwardRefRenderFunction, HTMLAttributes, MutableRefObject } from 'react'
import { forwardRef, useEffect, useState } from 'react'

// Third-party Imports

// Type Imports
import type { ChildrenType, RootStylesType } from '../../types'
import type { VerticalMenuContextProps } from './Menu'

// Hooks Imports


// Styled Component Imports
import { useTheme } from '@mui/material/styles'

// Style Imports
import navigationCustomStyles from '@/@core/styles/vertical/navigationCustomStyles'
import useVerticalNav from '@/@menu/hooks/useVerticalNav'
import VerticalNav from './VerticalNav'

export type SubMenuContentProps = HTMLAttributes<HTMLDivElement> &
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



const SubMenuContent: ForwardRefRenderFunction<HTMLDivElement, SubMenuContentProps> = (props, ref) => {
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

  // States
  const [mounted, setMounted] = useState(false)

  // Refs
  const SubMenuContentRef = ref as MutableRefObject<HTMLDivElement>

  useEffect(() => {
    if (mounted) {
      if (open || (open && isHovered)) {
        const target = SubMenuContentRef?.current

        if (target) {
          target.style.display = 'block'
          target.style.overflow = 'hidden'
          target.style.blockSize = 'auto'
          const height = target.offsetHeight

          target.style.blockSize = '0px'
          target.offsetHeight

          target.style.blockSize = `${height}px`

          setTimeout(() => {
            target.style.overflow = 'auto'
            target.style.blockSize = 'auto'
          }, transitionDuration)
        }
      } else {
        const target = SubMenuContentRef?.current

        if (target) {
          target.style.overflow = 'hidden'
          target.style.blockSize = `${target.offsetHeight}px`
          target.offsetHeight
          target.style.blockSize = '0px'

          setTimeout(() => {
            target.style.overflow = 'auto'
            target.style.display = 'none'
          }, transitionDuration)
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mounted, SubMenuContentRef])

  useEffect(() => {
    setMounted(true)
  }, [isHovered])

  const verticalNavOptions = useVerticalNav()
  const theme = useTheme()

  return (
    <VerticalNav
      customStyles={navigationCustomStyles(verticalNavOptions, theme)}
      collapsedWidth={71}
      backgroundColor='#FFFFFF'
    >
    </VerticalNav>
  )
}

export default forwardRef(SubMenuContent)
