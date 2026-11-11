'use client'

import { useMemo } from 'react'

import { usePathname } from 'next/navigation'

import { usePermissionContext } from './PermissionProvider'
import { resolvePermission } from './permissionUtils'
import type { PermissionAction, ResolvedPermission } from './permissionTypes'

export type UsePermissionOptions = {
  /** Screen route to resolve permissions for. Defaults to the current pathname. */
  href?: string
}

/**
 * Resolves the standardized permission set (canView/canAdd/canModify/...) for a screen.
 *
 * const permission = usePermission({ href: '/properties/project' })
 * if (!permission.resolved) return null // menu not loaded yet — avoid a flash of buttons
 * {permission.canAdd && <Button>Thêm mới</Button>}
 */
export function usePermission(options: UsePermissionOptions = {}): ResolvedPermission {
  const pathname = usePathname()
  const { registry, isLoaded } = usePermissionContext()
  const targetPath = options.href ?? pathname ?? '/'

  return useMemo(
    () => resolvePermission(registry, targetPath, isLoaded),
    [registry, targetPath, isLoaded]
  )
}

/** Convenience form: const canDelete = useCanAction('/properties/project', 'DELETE') */
export function useCanAction(href: string, action: PermissionAction): boolean {
  return usePermission({ href }).can(action)
}
