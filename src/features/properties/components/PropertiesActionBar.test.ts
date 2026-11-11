import { readFileSync } from 'node:fs'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@mui/material', () => ({ Stack: () => null }))

describe('Properties detail action bar (compact 36px buttons)', () => {
  it('sizes every button in the bar the same: 36px desktop (38px touch on xs), 14px padding, 14px text, 18px icon', async () => {
    const { propertiesActionButtonSx } = await import('./PropertiesActionBar')
    const sx = propertiesActionButtonSx as Record<string, any>

    expect(sx['& .MuiButton-root']).toMatchObject({
      height: { xs: 38, md: 36 },
      minHeight: { xs: 38, md: 36 },
      paddingBlock: 0,
      paddingInline: '14px',
      fontSize: '0.875rem',
      whiteSpace: 'nowrap'
    })
    expect(sx['& .MuiButton-startIcon']).toMatchObject({ marginInlineEnd: '6px', '& > *:nth-of-type(1)': { fontSize: 18 } })
    // dimensions only: no color / border / radius / width overrides
    expect(JSON.stringify(sx)).not.toMatch(/color|border|radius|"width"/i)
  })

  it('Project / Tower / Floor / Apartment detail headers use the shared bar (wraps; no global MuiButton change)', () => {
    for (const file of ['../project/ProjectDetailPage.tsx', '../building/BuildingDetailPage.tsx', '../floor/FloorDetailPage.tsx', '../unit/ApartmentDetailPage.tsx']) {
      const source = readFileSync(new URL(file, import.meta.url), 'utf8')

      expect(source).toContain('<PropertiesActionBar>')
      expect(source).toContain('</PropertiesActionBar>')
    }
    expect(readFileSync(new URL('./PropertiesActionBar.tsx', import.meta.url), 'utf8')).toContain('flexWrap="wrap"')
  })
})
