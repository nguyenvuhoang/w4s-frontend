'use client'

import { TableCell } from '@mui/material'

import type { RowInteractionConfig } from '@/shared/utils/rowInteraction'
import { useRowInteraction } from '@/shared/utils/rowInteraction'

import ActionMenu, { resolveVisibleRowActions } from './ActionMenu'
import type { RowActionConfig } from './ActionMenu'
import RowInteractionTip from './RowInteractionTip'

const DEFAULT_ACTIONS_COLUMN_WIDTH = 56

type SearchTableDictionary = { common?: Record<string, string | undefined> } | null | undefined

export type SearchTableRowConfig<T> = {
  /** Same shape UserRolesTable/StaffTable already pass to useRowInteraction. Omit for the existing double-click default. */
  rowInteraction?: RowInteractionConfig<T>
  /** Omit entirely to keep the table with no "..." action column — this is what makes every other, unmigrated table unaffected. */
  rowActions?: (row: T) => RowActionConfig<T>[]
  /**
   * Current page's rows. Optional, but pass it so the "..." column itself auto-hides when no row
   * has any visible+permitted action (e.g. a viewer with neither MODIFY nor DELETE) — without it,
   * the column still renders (empty) whenever `rowActions` is provided at all.
   */
  rows?: T[]
  /** Needed only to localize the actions column header and the interaction tip via the shared `common.*` keys. */
  dictionary?: SearchTableDictionary
  actionsColumnWidth?: number
}

/**
 * Shared engine behind row interaction (single/double-click/none, hover, copy/select safety) and
 * the row action "..." menu (permission, visible/disabled-by-status, i18n, confirm, stopPropagation,
 * auto-hidden column) for hand-rolled Search Table implementations (UserRolesTable, StaffTable, ...).
 *
 * This is deliberately a hook, not a `<SearchTable columns={...} />` component: today's tables still
 * render their own bespoke column set (avatars, chips, truncation...), so there is no shared column
 * config yet to build a full generic table around. Once one exists, a config-driven `<SearchTable>`
 * can be implemented on top of this same hook without changing this contract — feature tables would
 * stop rendering rows by hand entirely and just declare `{ rowInteraction, rowActions }`.
 *
 * A table that never calls this hook is completely unaffected — this is purely additive.
 */
export function useSearchTableRowConfig<T>({
  rowInteraction,
  rowActions,
  rows,
  dictionary,
  actionsColumnWidth = DEFAULT_ACTIONS_COLUMN_WIDTH
}: SearchTableRowConfig<T>) {
  const interaction = useRowInteraction<T>(rowInteraction ?? {})
  const hasActionsColumn = Boolean(rowActions) && (
    rows === undefined || rows.some(row => resolveVisibleRowActions(row, rowActions!(row)).length > 0)
  )
  const actionsHeaderLabel = dictionary?.common?.table_actions_header ?? 'Actions'

  const renderActionsCol = () => (
    hasActionsColumn ? <col style={{ width: actionsColumnWidth }} /> : null
  )

  const renderActionsHeaderCell = () => (
    hasActionsColumn ? (
      <TableCell align="center" sx={{ bgcolor: 'primary.main', color: 'common.white', fontWeight: 800 }}>
        {actionsHeaderLabel}
      </TableCell>
    ) : null
  )

  const renderActionsCell = (row: T) => (
    hasActionsColumn && rowActions ? (
      <TableCell align="center">
        <ActionMenu row={row} actions={rowActions(row)} />
      </TableCell>
    ) : null
  )

  const renderInteractionTip = () => <RowInteractionTip mode={interaction.mode} dictionary={dictionary} />

  return {
    mode: interaction.mode,
    getRowProps: interaction.getRowProps,
    hasActionsColumn,
    actionsColumnWidth,
    renderActionsCol,
    renderActionsHeaderCell,
    renderActionsCell,
    renderInteractionTip
  }
}
