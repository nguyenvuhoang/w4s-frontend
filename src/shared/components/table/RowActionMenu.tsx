// Presentational alias kept for the table call sites: `RowActionMenu` is `ActionMenu` — the
// business-action engine (RowActionConfig, permission/visible/disabled+reason/confirm,
// resolveVisibleRowActions) is shared verbatim with any other "..." action trigger (e.g. a card).
// Table-specific code should keep importing `RowActionMenu` for clarity; new non-table call sites
// should import `ActionMenu` directly from './ActionMenu' (or the `@/shared/components/table` barrel).
export { default, resolveVisibleRowActions } from './ActionMenu'
export type { RowActionConfig, RowActionConfirmConfig } from './ActionMenu'
