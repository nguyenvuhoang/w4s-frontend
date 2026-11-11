import { existsSync, readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'

const read = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8')
const appRoot = '../../app/[locale]/(dashboard)/'

describe('Property tab navigation (Dự án / Tháp / Tầng / Căn)', () => {
  it('switches tabs inside a React transition with immediate feedback and prefetches the sibling tabs', () => {
    const tabs = read('./PropertyManagementTabs.tsx')

    expect(tabs).toContain('startTransition(() => router.push(href))')
    expect(tabs).toContain('(isPending && pendingHref) || active.value')
    expect(tabs).toContain('<LinearProgress')
    expect(tabs).toContain('router.prefetch(href)')
    // No artificial delay.
    expect(tabs).not.toMatch(/setTimeout|sleep\(/)
  })

  it('renders the tabs once per tree from a layout (kept mounted), not from each tab page', () => {
    const adminLayout = read(`${appRoot}system-settings/properties/layout.tsx`)

    expect(adminLayout).toContain('<PropertyManagementTabs')
    expect(adminLayout).toContain('admin={true}')

    // The business Properties tree (/properties/*) does not show the System Settings tabs.
    expect(read(`${appRoot}properties/layout.tsx`)).not.toContain('PropertyManagementTabs')

    for (const page of ['./building/BuildingPage.server.tsx', './floor/FloorPage.server.tsx', './unit/UnitPage.server.tsx']) {
      const source = read(page)

      expect(source).not.toContain('PropertyManagementTabs')
      // The server-side access check of each tab route is unchanged.
      expect(source).toContain('<AuthorizedLayout requiredPath=')
    }
  })

  it('every tab list route has a loading skeleton, in both the business and the System Settings trees', () => {
    for (const root of ['properties', 'system-settings/properties']) {
      for (const module of ['building', 'floor', 'unit']) {
        const path = new URL(`${appRoot}${root}/${module}/loading.tsx`, import.meta.url)

        expect(existsSync(path)).toBe(true)
        expect(readFileSync(path, 'utf8')).toContain('<PropertyListSkeleton />')
      }
    }
  })

  it('list hooks start in the loading state when they are about to load, so no empty state flashes first', () => {
    const condition = 'useState(() => Boolean(workingProject) && initialFilter.project_id !== workingProject?.id)'

    expect(read('./building/hooks/useBuildingSearch.ts')).toContain(`const [loading, setLoading] = ${condition}`)
    expect(read('./unit/hooks/useApartmentSearch.ts')).toContain(`const [loading, setLoading] = ${condition}`)
    expect(read('./floor/hooks/useFloorSearch.ts')).toContain(`const [buildingsLoading, setBuildingsLoading] = ${condition}`)
  })
})
