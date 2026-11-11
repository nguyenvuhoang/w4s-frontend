'use client'

import type { ReactNode } from 'react'

import { usePermission } from './usePermission'
import type { PermissionAction } from './permissionTypes'

type PermissionGuardProps = {
  /** Screen route to check. Defaults to the current pathname. */
  href?: string
  action: PermissionAction
  children: ReactNode
  /** Rendered instead of children when access is denied. Defaults to nothing. */
  fallback?: ReactNode
}

/**
 * <PermissionGuard href='/properties/project' action='ADD'>
 *   <Button>Thêm mới</Button>
 * </PermissionGuard>
 *
 * Renders nothing while the menu hasn't loaded yet (avoids a flash of buttons), nothing (or
 * `fallback`) when the user lacks the action, and children when allowed.
 */
export function PermissionGuard({ href, action, children, fallback = null }: PermissionGuardProps) {
  const permission = usePermission({ href })

  if (!permission.resolved) return null
  if (!permission.can(action)) return <>{fallback}</>

  return <>{children}</>
}

export default PermissionGuard
