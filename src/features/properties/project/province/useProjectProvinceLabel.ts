'use client'

import { useEffect, useState } from 'react'

import { useSession } from 'next-auth/react'

import { formatProvinceLabel, type ProvinceLookupItem } from '@/shared/services/provinceLookupService'

import { resolveProjectProvince } from './projectProvinceValue'

// Stored value → master row (null = not found); shared by every card/preview so a code is looked up once.
const resolvedCache = new Map<string, Promise<ProvinceLookupItem | null>>()

/**
 * Display name of a Project's stored `province` (province_code, or a legacy name) for screens that only
 * have the raw value (project context card, list hover preview). Shows the raw value until / unless it is
 * resolved; display only, never changes the value.
 */
export const useProjectProvinceLabel = (value: string | null | undefined, locale: string) => {
  const { data: session } = useSession()
  const sessiontoken = session?.user?.token ?? undefined
  const stored = value?.trim() ?? ''
  const key = `${locale}|${stored}`
  // Resolved row tagged with the value it belongs to, so a changed value never shows a stale name.
  const [resolved, setResolved] = useState<{ key: string; province: ProvinceLookupItem | null } | null>(null)

  useEffect(() => {
    if (!stored || !sessiontoken) return

    let current = true
    let pending = resolvedCache.get(key)

    if (!pending) {
      pending = resolveProjectProvince({ sessiontoken, language: locale, value: stored }).catch(() => {
        resolvedCache.delete(key)

        return null
      })
      resolvedCache.set(key, pending)
    }

    void pending.then(result => {
      if (current) setResolved({ key, province: result })
    })

    return () => { current = false }
  }, [key, locale, sessiontoken, stored])

  const province = resolved?.key === key ? resolved.province : null

  return province ? formatProvinceLabel(province, locale) : stored
}
