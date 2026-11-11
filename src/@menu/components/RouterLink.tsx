'use client'

// React Imports
import { forwardRef } from 'react'
import type { AnchorHTMLAttributes } from 'react'

// Next Imports
import Link from 'next/link'
import type { LinkProps } from 'next/link'
import { formatUrl } from 'next/dist/shared/lib/router/utils/format-url'
import { useRouter } from '@shared/hooks/useRouter'

// Type Imports
import type { ChildrenType } from '@shared/types'

type RouterLinkProps = LinkProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof LinkProps> &
  Partial<ChildrenType> & {
    className?: string
    is_agreement?: boolean | string
  }

// eslint-disable-next-line react/display-name
export const RouterLink = forwardRef((props: RouterLinkProps, ref: any) => {
  // Props
  const { href, className, is_agreement, onNavigate, ...other } = props
  const router = useRouter()

  return (
    <Link
      ref={ref}
      href={href}
      className={className}
      {...other}
      data-prevent-progress="true"
      onNavigate={event => {
        let prevented = false

        onNavigate?.({ preventDefault: () => { prevented = true; event.preventDefault() } })
        if (prevented) return
        event.preventDefault()
        const options = { scroll: other.scroll }
        const url = other.as ?? href
        const destination = typeof url === 'string' ? url : formatUrl(url)

        if (other.replace) router.replace(destination, options)
        else router.push(destination, options)
      }}
    >
      {props.children}
    </Link>
  )
})
