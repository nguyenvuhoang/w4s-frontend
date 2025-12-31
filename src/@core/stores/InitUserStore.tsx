// components/InitUserStore.tsx
'use client'

import { useEffect } from 'react'
import { useUserStore } from '@/@core/stores/useUserStore'
import type { UserInRole } from '@/types/systemTypes'

export const InitUserStore = ({
  name,
  avatar,
  role
}: {
  name: string
  avatar: string
  role: UserInRole[]
}) => {
  useEffect(() => {
    useUserStore.setState({ name, avatar, role })
  }, [name, avatar, role])

  return null
}
