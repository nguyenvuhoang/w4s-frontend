'use client'

import { useState } from 'react'
import type { ReactNode } from 'react'

import MoreVertIcon from '@mui/icons-material/MoreVert'
import { Box, IconButton, ListItemIcon, ListItemText, Menu, MenuItem, Tooltip } from '@mui/material'
import Swal from 'sweetalert2'

export type RowActionConfirmConfig = {
  title?: string
  text?: string
  icon?: 'warning' | 'question' | 'info' | 'error' | 'success'
  confirmButtonText?: string
  cancelButtonText?: string
}

export type RowActionConfig<T> = {
  key: string
  label: string
  icon?: ReactNode
  /** MUI palette key used for the menu item/icon color, e.g. 'error' for a destructive action. */
  color?: 'inherit' | 'error' | 'primary' | 'warning' | 'success'
  /**
   * Pre-resolved once from the user's current permissions (e.g. via hasEffectiveScreenActionAccess
   * at the list/content level). Never fetch permission per item. Defaults to true (no restriction).
   */
  permission?: boolean
  /** Item-level opt-out driven by data already on the item (e.g. an invalid id) — never an API call. */
  visibleWhen?: (row: T) => boolean
  disabledWhen?: (row: T) => boolean
  /**
   * Shown as a tooltip on the disabled menu item, e.g. "Assign is unavailable because the request
   * is already closed." Ignored when the action isn't disabled. Omit for a plain disabled item
   * with no explanation.
   */
  disabledReason?: string | ((row: T) => string | undefined)
  /** Shows a confirm dialog (sweetalert2) before invoking onClick when the user confirms. */
  confirm?: RowActionConfirmConfig
  onClick: (row: T) => void | Promise<void>
}

type Props<T> = {
  row: T
  actions: RowActionConfig<T>[]
  ariaLabel?: string
}

// Shared with useSearchTableRowConfig (and any other caller) so "does this item have any visible
// action" is answered identically everywhere: whether it's this menu deciding to render, or a
// container (a table's actions column, a card's header) deciding whether its own "..." trigger
// should exist at all — e.g. hide it when the user has no permission for any action on any item
// of the current page.
export const resolveVisibleRowActions = <T,>(row: T, actions: RowActionConfig<T>[]) => (
  actions.filter(action => (
    (action.permission ?? true) && (action.visibleWhen ? action.visibleWhen(row) : true)
  ))
)

/**
 * Shared "..." action menu — the business-action engine (permission, visible/disabled + reason,
 * confirm, i18n labels) behind both `RowActionMenu` (table rows) and any card/list-item action
 * trigger. Resolves visibility from `permission` (checked once, centrally, by the caller) and
 * `visibleWhen(row)` (pure, item-local) — never issues a per-item permission/API call. The whole
 * trigger+menu is wrapped so any click/keydown inside it (opening the menu, picking an item,
 * dismissing the backdrop) never reaches the underlying item's own click/navigation handler,
 * whatever that happens to be (row double-click, card click, or nothing at all).
 */
function ActionMenu<T>({ row, actions, ariaLabel = 'Actions' }: Props<T>) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)
  const open = Boolean(anchorEl)

  const resolvedActions = resolveVisibleRowActions(row, actions)

  if (resolvedActions.length === 0) return null

  const closeMenu = () => setAnchorEl(null)

  const runAction = (action: RowActionConfig<T>) => {
    if (!action.confirm) {
      void action.onClick(row)
      return
    }

    void Swal.fire({
      title: action.confirm.title,
      text: action.confirm.text,
      icon: action.confirm.icon ?? 'warning',
      showCancelButton: true,
      confirmButtonText: action.confirm.confirmButtonText,
      cancelButtonText: action.confirm.cancelButtonText
    }).then(result => {
      if (result.isConfirmed) void action.onClick(row)
    })
  }

  return (
    // Stops every click/keydown originating from the trigger button or the (portaled) menu —
    // including a backdrop click to dismiss — from bubbling into whatever click/navigation
    // handler the container (table row, card) has on itself.
    <Box
      component="span"
      onClick={event => event.stopPropagation()}
      onDoubleClick={event => event.stopPropagation()}
      onKeyDown={event => event.stopPropagation()}
      data-prevent-row-navigation
    >
      <IconButton
        size="small"
        aria-label={ariaLabel}
        aria-haspopup="menu"
        aria-expanded={open ? 'true' : undefined}
        onClick={event => setAnchorEl(event.currentTarget)}
      >
        <MoreVertIcon fontSize="small" />
      </IconButton>
      <Menu anchorEl={anchorEl} open={open} onClose={closeMenu} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }} transformOrigin={{ vertical: 'top', horizontal: 'right' }}>
        {resolvedActions.map(action => {
          const disabled = action.disabledWhen ? action.disabledWhen(row) : false
          const reason = disabled
            ? (typeof action.disabledReason === 'function' ? action.disabledReason(row) : action.disabledReason)
            : undefined

          const menuItem = (
            <MenuItem
              key={action.key}
              disabled={disabled}
              onClick={() => { closeMenu(); runAction(action) }}
              sx={action.color ? { color: `${action.color}.main` } : undefined}
            >
              {action.icon && (
                <ListItemIcon sx={action.color ? { color: `${action.color}.main` } : undefined}>
                  {action.icon}
                </ListItemIcon>
              )}
              <ListItemText>{action.label}</ListItemText>
            </MenuItem>
          )

          // Menu inspects its direct children and rejects Fragments. A keyed MenuItem keeps the
          // menu's keyboard/focus behavior intact without inserting an unsupported wrapper.
          if (!reason) return menuItem

          // A disabled MenuItem swallows pointer events, so Tooltip needs the extra <span> to
          // still detect hover — same wrapper the hand-rolled action menus already relied on.
          return (
            <Tooltip key={action.key} title={reason}>
              <span>{menuItem}</span>
            </Tooltip>
          )
        })}
      </Menu>
    </Box>
  )
}

export default ActionMenu
