// stores/useUserStore.ts
import { UserInRole } from '@shared/types/systemTypes'
import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

type UserStore = {
  name: string
  role: UserInRole[]
  avatar: string
  setUser: (user: { name: string, role: UserInRole[], avatar: string }) => void
  setName: (name: string) => void
  setRole: (role: UserInRole[]) => void
  setAvatar: (avatar: string) => void
}

export const useUserStore = create<UserStore>()(
  devtools(
    (set) => ({
      name: '',
      role: [],
      avatar: '',
      setUser: (user) => set(user, false, 'setUser'),
      setName: (name) => set({ name }, false, 'setName'),
      setRole: (role) => set({ role }, false, 'setRole'),
      setAvatar: (avatar) => set({ avatar }, false, 'setAvatar')
    }),
    { name: 'UserStore' }
  )
)

// Optimized selectors for better performance
export const useUserName = () => useUserStore((state) => state.name)
export const useUserRole = () => useUserStore((state) => state.role)
export const useUserAvatar = () => useUserStore((state) => state.avatar)

