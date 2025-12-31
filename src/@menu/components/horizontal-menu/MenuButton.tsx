// React Imports
import { cloneElement, createElement, forwardRef } from 'react'
import type { ForwardRefRenderFunction } from 'react'

// Third-party Imports
import classnames from 'classnames'
import { css } from '@emotion/react'

// Type Imports
import type { ChildrenType, MenuButtonProps } from '../../types'

// Component Imports
import { RouterLink } from '../RouterLink'

// Util Imports
import { menuClasses } from '../../utils/menuClasses'

type MenuButtonStylesProps = Partial<ChildrenType> & {
  level: number
  disabled?: boolean
}

export const menuButtonStyles = (props: MenuButtonStylesProps) => {
  const { level, disabled, children } = props

  return css({
    display: 'flex',
    alignItems: 'center',
    minBlockSize: '30px',
    textDecoration: 'none',
    color: 'inherit',
    boxSizing: 'border-box',
    cursor: 'pointer',
    paddingInline: '20px',

    '&:hover': { backgroundColor: '#f3f3f3' },
    '&:focus-visible': { outline: 'none', backgroundColor: '#f3f3f3' },

    ...(disabled && {
      pointerEvents: 'none',
      cursor: 'default',
      color: '#adadad'
    }),

    [`&.${menuClasses.active}`]: {
      ...(level === 0
        ? { color: '#f3f3f3 !important' }
        : children
        ? { backgroundColor: '#f3f3f3' }
        : { color: 'white !important' })
    }
  })
}

// props that should NOT reach the DOM
const stripProps = <T extends Record<string, any>>(rest: T) => {
  const {
    // custom / non-DOM props
    level,
    is_agreement,
    disabled, // not valid on <a>
    // add more here if needed (e.g., prefix, suffix, etc.)
    ...domSafe
  } = rest

  // If you still want to expose them for testing/analytics:
  const dataProps: Record<string, any> = {}
  if (typeof is_agreement !== 'undefined') dataProps['data-is-agreement'] = String(is_agreement)
  if (typeof level !== 'undefined') dataProps['data-level'] = String(level)
  if (disabled) dataProps['aria-disabled'] = true // accessibility-friendly replacement

  return { domSafe, dataProps }
}

const MenuButton: ForwardRefRenderFunction<HTMLAnchorElement, MenuButtonProps> = (
  { className, component, children, ...rest },
  ref
) => {
  const { domSafe, dataProps } = stripProps(rest)

  if (component) {
    if (typeof component === 'string') {
      // Creating a host element like 'button' / 'a' / 'div'
      return createElement(
        component,
        {
          className: classnames(className),
          ...domSafe,
          ...dataProps,
          ref
        },
        children
      )
    } else {
      // Cloning a React element: avoid forwarding non-DOM props
      const { className: classNameProp, ...props } = (component.props as { className?: string })

      return cloneElement(
        component as React.ReactElement<any>,
        {
          ...props,
          ...domSafe,
          ...dataProps,
          className: classnames(className, classNameProp),
          ...(ref ? { ref } : {})
        },
        children
      )
    }
  } else {
    if (domSafe.href) {
      // RouterLink eventually renders an <a>, so keep props DOM-safe
      return (
        <RouterLink ref={ref} className={className} href={domSafe.href} {...domSafe} {...dataProps}>
          {children}
        </RouterLink>
      )
    }

    // Plain <a> fallback — only pass DOM-safe props
    return (
      <a ref={ref} className={className} {...domSafe} {...dataProps}>
        {children}
      </a>
    )
  }
}

export default forwardRef(MenuButton)
