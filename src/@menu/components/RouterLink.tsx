'use client'

// React Imports
import { forwardRef } from 'react'

// Next Imports
import Link from 'next/link'
import type { LinkProps } from 'next/link'

// Type Imports
import type { ChildrenType } from '../types'

type RouterLinkProps = LinkProps &
  Partial<ChildrenType> & {
    className?: string
    is_agreement?: boolean | string
  }

// eslint-disable-next-line react/display-name
export const RouterLink = forwardRef((props: RouterLinkProps, ref: any) => {
  // Props
  const { href, className, is_agreement,...other } = props

  return (
    <Link ref={ref} href={href} className={className} {...other}>
      {props.children}
    </Link>
  )
})
