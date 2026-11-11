import type { ReactNode } from 'react'

// The Dự án / Tháp / Tầng / Căn tabs belong to the System Settings property tree only
// (see `system-settings/properties/layout.tsx`); the business Properties screens render without them.
export default function PropertiesLayout({ children }: { children: ReactNode }) {
  return <>{children}</>
}
