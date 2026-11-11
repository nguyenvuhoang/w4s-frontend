'use client'

import type { ReactElement } from 'react'

import { Tab, Tabs } from '@mui/material'

export type DetailTab<T extends string> = {
  value: T
  label: string
  icon?: ReactElement
}

type Props<T extends string> = {
  tabs: DetailTab<T>[]
  value: T
  onChange: (value: T) => void
  ariaLabel: string
}

/**
 * Light tab bar for detail pages (e.g. "Thông tin" / "Lịch sử thay đổi"): primary indicator, compact
 * height, scrollable on small screens. Page header actions stay outside the tabs.
 */
function DetailTabs<T extends string>({ tabs, value, onChange, ariaLabel }: Props<T>) {
  return (
    <Tabs
      value={value}
      onChange={(_, next: T) => onChange(next)}
      aria-label={ariaLabel}
      variant="scrollable"
      scrollButtons="auto"
      allowScrollButtonsMobile
      textColor="primary"
      indicatorColor="primary"
      sx={{
        minHeight: 44,
        borderBottom: 1,
        borderColor: 'divider',
        '& .MuiTab-root': { minHeight: 44, textTransform: 'none', fontWeight: 600, px: 1.5 },
        '& .MuiTab-root.Mui-selected': { fontWeight: 700 }
      }}
    >
      {tabs.map(tab => (
        <Tab
          key={tab.value}
          value={tab.value}
          label={tab.label}
          icon={tab.icon}
          iconPosition="start"
          id={`detail-tab-${tab.value}`}
          aria-controls={`detail-tabpanel-${tab.value}`}
        />
      ))}
    </Tabs>
  )
}

export default DetailTabs
