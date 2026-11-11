import type { getDictionary } from '@/shared/utils/getDictionary'

export type ServiceSettingsDictionary = Awaited<ReturnType<typeof getDictionary>>
export type ServiceSettingItem = {
  /** Backend record id, required by the update contract. */
  id?: number | string | null
  name: string
  value: unknown
  organization?: string
  /** Raw `organization_id` from the backend record, forwarded unchanged on update. */
  organizationId?: number | string | null
}

export type ServiceSettingUpdatePayload = {
  name: string
  value: string
  organization_id: number | string | null
  id: number | string
}

