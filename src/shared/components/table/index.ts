// Shared "Search Table" kit: row interaction (single/double-click/none) + action menu ("..."),
// reusable across feature tables (User Roles, Staffs, ...), non-table item lists (e.g. a card
// grid), and eventually a config-driven <SearchTable> for dynamic pages. The action-menu engine
// (ActionMenu, RowActionConfig, resolveVisibleRowActions) is UI-container-agnostic — RowActionMenu
// is the same component, exported under a table-flavored name for existing call sites. Import from
// here rather than the individual files so future consumers get one stable surface.

export { default as ActionMenu, resolveVisibleRowActions } from './ActionMenu'
export type { RowActionConfig, RowActionConfirmConfig } from './ActionMenu'

// Table-specific alias — same component as ActionMenu, kept for existing table call sites.
export { default as RowActionMenu } from './RowActionMenu'

export { default as RowInteractionTip } from './RowInteractionTip'

export { useSearchTableRowConfig } from './useSearchTableRowConfig'
export type { SearchTableRowConfig } from './useSearchTableRowConfig'

export { useRowInteraction, shouldTriggerRowNavigation, getRowInteractionTip, resolveRowInteractionMode } from '@/shared/utils/rowInteraction'
export type { RowInteractionMode, RowInteractionConfig, RowInteractionRowProps } from '@/shared/utils/rowInteraction'
