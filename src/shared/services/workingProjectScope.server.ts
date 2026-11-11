import 'server-only'

import { cookies } from 'next/headers'

import { WORKING_PROJECT_SCOPE_COOKIE } from '@/shared/constants/projectContext'

export const getServerWorkingProjectScope = async (): Promise<string | null> => {
  const scope = (await cookies()).get(WORKING_PROJECT_SCOPE_COOKIE)?.value?.trim()

  return scope || null
}
