'use client'

import type { ReactNode } from 'react'

import { Box } from '@mui/material'

import SyncOverlay from '@/views/components/SyncOverlay'

type Props = {
  /** Refresh/re-fetch state only — NOT the initial-load state. Initial load must keep using the
   * screen's existing Skeleton (`return <ExistingPageSkeleton />` before reaching this wrapper). */
  loading: boolean
  message?: string
  description?: string
  minHeight?: number | string
  children: ReactNode
}

/**
 * Scoped "content still visible underneath, lightly dimmed" loading wrapper for management
 * screens — refresh, project switch, or any refetch that happens once a screen already has data.
 *
 * Do NOT use this for a screen's first load (no data yet): keep using that screen's existing
 * Skeleton for that case. Wiring `loading` to a first-load flag here would double up with the
 * Skeleton or replace it outright — see the caller pattern this component expects:
 *
 *   if (showInitialSkeleton) return <ExistingPageSkeleton />
 *
 *   return (
 *     <ManagementContentLoading loading={showContentOverlay}>
 *       {content}
 *     </ManagementContentLoading>
 *   )
 */
const ManagementContentLoading = ({ loading, message, description, minHeight = 300, children }: Props) => (
  <Box sx={{ position: 'relative', minHeight }}>
    <SyncOverlay open={loading} mode="content" message={message} description={description} />
    {children}
  </Box>
)

export default ManagementContentLoading
