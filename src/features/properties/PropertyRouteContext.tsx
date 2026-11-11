'use client'

import { createContext, useContext } from 'react'
import type { ComponentProps, ReactNode } from 'react'

import { PermissionGuard } from '@/shared/permissions/PermissionGuard'

const AdminPropertyContext = createContext(false)

export const useAdminPropertyContext = () => useContext(AdminPropertyContext)

export function PropertyRouteProvider({ admin, children }: { admin: boolean; children: ReactNode }) {
  return <AdminPropertyContext.Provider value={admin}>{children}</AdminPropertyContext.Provider>
}

export function PropertyActionGuard(props: ComponentProps<typeof PermissionGuard>) {
  const admin = useAdminPropertyContext()

  return admin ? <>{props.children}</> : <PermissionGuard {...props} />
}
