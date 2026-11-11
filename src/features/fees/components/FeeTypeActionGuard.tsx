'use client'

import type { ReactNode } from 'react'

import { PermissionGuard } from '@shared/permissions/PermissionGuard'
import type { PermissionAction } from '@shared/permissions/permissionTypes'

import type { FeeTypeRouteConfig } from '../feeTypeRoutes'

/** Menu-rights guard on the legacy route; pass-through under System Settings (layout-enforced access). */
const FeeTypeActionGuard = ({
  routes,
  action,
  children
}: {
  routes: FeeTypeRouteConfig
  action: PermissionAction
  children: ReactNode
}) => {
  if (!routes.permissionHref) return <>{children}</>

  return (
    <PermissionGuard href={routes.permissionHref} action={action}>
      {children}
    </PermissionGuard>
  )
}

export default FeeTypeActionGuard
