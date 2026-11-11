'use client'

import { useEffect, useState, useTransition } from 'react'

import { usePathname, useRouter } from 'next/navigation'
import Box from '@mui/material/Box'
import LinearProgress from '@mui/material/LinearProgress'

import type { Locale } from '@/configs/i18n'
import DetailTabs from '@/shared/components/detail-tabs/DetailTabs'
import { getLocalizedUrl } from '@/shared/utils/i18n'
import { useAdminPropertyContext } from './PropertyRouteContext'
import { propertyPath } from './propertyPaths'
import { PROJECT_MANAGEMENT_BASE_PATH } from './project/projectListHelpers'

type Props = {
  admin?: boolean
  locale: Locale
  labels: { project: string; building: string; floor: string; apartment: string; unitTab?: string }
  ariaLabel: string
}

/**
 * Dự án / Tháp / Tầng / Căn tabs. Rendered once by the `properties` layouts (so they stay mounted while
 * switching tabs) and by the System Settings project list. Each tab is still its own route, with its own
 * server-side access check; the bar only makes the switch feel immediate:
 * - the clicked tab is highlighted and a progress bar shows at once (React transition, no fake delay);
 * - the other tab routes are prefetched, so the route `loading.tsx` skeleton can show without waiting.
 */
export default function PropertyManagementTabs({ admin: adminOverride, locale, labels, ariaLabel }: Props) {
  const routeAdmin = useAdminPropertyContext()
  const admin = adminOverride ?? routeAdmin
  const pathname = usePathname()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [pendingHref, setPendingHref] = useState<string | null>(null)
  const tabs = [
    { value: PROJECT_MANAGEMENT_BASE_PATH, label: labels.project },
    { value: propertyPath('building', admin), label: labels.building },
    { value: propertyPath('floor', admin), label: labels.floor },
    { value: propertyPath('unit', admin), label: labels.unitTab ?? labels.apartment }
  ].map(tab => ({ ...tab, value: getLocalizedUrl(tab.value, locale) }))
  const tabHrefs = tabs.map(tab => tab.value).join('|')

  const active = tabs.find(tab => tab.value === pathname.replace(/\/$/, ''))
  const activeHref = active?.value ?? null

  // Prefetch the sibling tab routes once the bar is shown (production: up to their loading boundary).
  useEffect(() => {
    if (!activeHref) return

    tabHrefs.split('|').filter(href => href !== activeHref).forEach(href => router.prefetch(href))
  }, [activeHref, router, tabHrefs])

  // The navigation finished (or was abandoned): show the real route again.
  useEffect(() => {
    if (!isPending) setPendingHref(null)
  }, [isPending, pathname])

  if (!active) return null

  const navigate = (href: string) => {
    if (href === active.value) return

    setPendingHref(href)
    startTransition(() => router.push(href))
  }

  return (
    <Box
      className="mx-6"
      sx={{ position: 'relative', bgcolor: 'background.paper', borderRadius: '12px', my: '12px', p: '8px 16px', minWidth: 0, overflow: 'hidden' }}
      aria-busy={isPending}
    >
      <DetailTabs tabs={tabs} value={(isPending && pendingHref) || active.value} onChange={navigate} ariaLabel={ariaLabel} />
      {isPending && (
        <LinearProgress sx={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 3 }} />
      )}
    </Box>
  )
}
