// Shared permission types built from the WF_BO_LOAD_MENU response tree.
// See src/shared/permissions/permissionUtils.ts for the parsing/resolution logic.
//
// Finalized backend contract (WF_BO_LOAD_MENU):
// - command_type="M" nodes always have action_code=null.
// - command_type="C" nodes carry a standard action_code: 'VIEW'|'DETAIL'|'ADD'|'MODIFY'|'DELETE'
//   |'IMPORT'|'EXPORT'|null. There is no action_code='APPROVE' — 'approve' is a separate boolean
//   field on the command (maker-checker authority), never an action type.
// - invoke/approve may come back as strings ("true"/"false") — normalize with toPermissionBoolean.
// - group_menu_visible="0" only affects sidebar visibility; it never gates action permission.

/**
 * Standard action set every screen can expose. Sourced from the backend's `action_code` — see
 * normalizePermissionAction in permissionUtils.ts. There is deliberately no 'APPROVE' entry here;
 * approval authority is tracked via the separate `approve` boolean on a command (see
 * NormalizedCommandNode.approve / ResolvedPermission.canApprove).
 */
export type PermissionAction =
  | 'VIEW'
  | 'DETAIL'
  | 'ADD'
  | 'MODIFY'
  | 'DELETE'
  | 'IMPORT'
  | 'EXPORT'

/**
 * Loosely typed raw node coming from WF_BO_LOAD_MENU. Field names/casing are
 * not fully consistent across the tree, so every accessor here must be
 * defensive (see getRawCommandId/getRawCommandType/etc in permissionUtils.ts).
 */
export interface RawMenuCommandNode {
  command_id?: unknown
  commandId?: unknown
  id?: unknown
  parent_id?: unknown
  parentId?: unknown
  command_type?: unknown
  commandType?: unknown
  /** Primary source of truth for action classification on command_type="C" nodes. */
  action_code?: unknown
  actionCode?: unknown
  command_name?: unknown
  command_name_language?: unknown
  label?: unknown
  title?: unknown
  href?: unknown
  command_uri?: unknown
  commandUri?: unknown
  commandURI?: unknown
  CommandURI?: unknown
  command_url?: unknown
  commandUrl?: unknown
  commandURL?: unknown
  CommandURL?: unknown
  invoke?: unknown
  approve?: unknown
  group_menu_visible?: unknown
  groupMenuVisible?: unknown
  display_order?: unknown
  displayOrder?: unknown
  sort_order?: unknown
  sortOrder?: unknown
  children?: RawMenuCommandNode[]
  items?: RawMenuCommandNode[]
  submenus?: RawMenuCommandNode[]
  utilities?: RawMenuCommandNode[]
  [key: string]: unknown
}

/** A single normalized node (either a menu/screen "M" node or a command/action "C" node). */
export interface NormalizedCommandNode {
  commandId: string
  parentId: string | null
  commandType: string
  /** Route this node points to (normalized, locale-stripped), or null if it isn't a link. */
  route: string | null
  invoke: boolean
  /** Approval authority flag on this specific command. Never substituted for invoke or an action. */
  approve: boolean
  groupMenuVisible: boolean
  /**
   * Only set for command_type === 'C'. Sourced from `action_code` (see resolveNodeAction in
   * permissionUtils.ts); null when action_code is missing/empty and no legacy label match applies,
   * or when action_code is present but not a recognized PermissionAction (deny-by-default).
   */
  action: PermissionAction | null
  raw: RawMenuCommandNode
}

/** All permission data owned by one screen (one menu route). */
export interface ScreenPermissionEntry {
  route: string
  menuNode: NormalizedCommandNode | null
  commands: NormalizedCommandNode[]
}

export interface PermissionRegistry {
  byRoute: Map<string, ScreenPermissionEntry>
  byCommandId: Map<string, NormalizedCommandNode>
  /** Registered screen routes, sorted by length descending for longest-prefix matching. */
  routes: string[]
}

export interface ResolvedPermission {
  /** False while the menu tree hasn't loaded yet — callers must not render actions in this state. */
  resolved: boolean
  canView: boolean
  canDetail: boolean
  canAdd: boolean
  canModify: boolean
  canDelete: boolean
  canImport: boolean
  canExport: boolean
  /**
   * Minimal, explicit rule (there is no action_code='APPROVE'): true when the screen is enabled
   * and at least one command under it has `approve=true`, regardless of that command's action_code.
   * Does not attempt to model per-action or per-record approval workflows — see resolvePermission
   * in permissionUtils.ts for the exact computation.
   */
  canApprove: boolean
  can: (action: PermissionAction) => boolean
}
