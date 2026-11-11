import { getMenuChildren, normalizeMenuPath } from '@shared/components/layout/shared/menu-utils'
import type {
  NormalizedCommandNode,
  PermissionAction,
  PermissionRegistry,
  RawMenuCommandNode,
  ResolvedPermission,
  ScreenPermissionEntry
} from './permissionTypes'

/**
 * Normalizes invoke/approve style flags coming back as string/number/boolean from the backend.
 * `Boolean('false')` is `true` in JS, which is exactly the bug this exists to avoid — never use
 * the native Boolean() coercion on these fields.
 */
export const toPermissionBoolean = (value: unknown): boolean => {
  if (value === true || value === 1) return true

  if (typeof value === 'string') {
    return ['true', '1', 't', 'yes', 'y'].includes(value.trim().toLowerCase())
  }

  return false
}

/**
 * All valid PermissionAction values, used by isPermissionAction/normalizePermissionAction below.
 * Kept in sync with the PermissionAction union in permissionTypes.ts.
 */
const PERMISSION_ACTIONS: readonly PermissionAction[] = ['VIEW', 'DETAIL', 'ADD', 'MODIFY', 'DELETE', 'IMPORT', 'EXPORT']

export const isPermissionAction = (value: string): value is PermissionAction =>
  (PERMISSION_ACTIONS as readonly string[]).includes(value)

/**
 * Normalizes a raw `action_code` value into a PermissionAction. This is the primary — and, absent
 * the legacy fallback below, only — source of action classification per the finalized backend
 * contract. Unrecognized values (e.g. "PUBLISH") return null (deny-by-default), they do NOT fall
 * through to label matching, since a present-but-unknown action_code means the contract was
 * violated, not that action_code is missing.
 */
export const normalizePermissionAction = (value: unknown): PermissionAction | null => {
  if (typeof value !== 'string') return null

  const action = value.trim().toUpperCase()

  return isPermissionAction(action) ? action : null
}

/**
 * LEGACY COMPATIBILITY ONLY — action keyword mapping used to classify a command from its English
 * label text. Per the finalized WF_BO_LOAD_MENU contract, command_type="C" nodes always carry
 * `action_code`, so this path should no longer be exercised in production. It is kept, isolated to
 * resolveLegacyActionFromLabel below, solely to avoid hard-breaking on older/incomplete menu
 * payloads where `action_code` is null/empty. Do not use this to override a present action_code,
 * and do not add new callers of this map outside resolveLegacyActionFromLabel.
 */
const LEGACY_ACTION_KEYWORDS: Record<PermissionAction, string[]> = {
  VIEW: ['view'],
  DETAIL: ['detail'],
  ADD: ['add', 'create', 'new'],
  MODIFY: ['modify', 'edit', 'update'],
  DELETE: ['delete', 'remove'],
  IMPORT: ['import'],
  EXPORT: ['export']
}

const LEGACY_ACTION_PRIORITY: PermissionAction[] = ['VIEW', 'DETAIL', 'ADD', 'MODIFY', 'DELETE', 'IMPORT', 'EXPORT']

const getRawCommandId = (raw: RawMenuCommandNode): unknown => raw.command_id ?? raw.commandId ?? raw.id

const getRawParentId = (raw: RawMenuCommandNode): string | null => {
  const parentId = raw.parent_id ?? raw.parentId

  if (parentId === undefined || parentId === null || parentId === '') return null

  const normalized = String(parentId)

  return normalized === '0' ? null : normalized
}

const getRawActionCode = (raw: RawMenuCommandNode): unknown => raw.action_code ?? raw.actionCode

const getRawCommandType = (raw: RawMenuCommandNode): string => {
  const type = raw.command_type ?? raw.commandType

  return type === undefined || type === null || type === '' ? 'M' : String(type).toUpperCase()
}

const getRawRoute = (raw: RawMenuCommandNode): string | undefined => {
  const route = raw.href ?? raw.command_uri ?? raw.commandUri ?? raw.commandURI ?? raw.CommandURI ?? raw.command_url ?? raw.commandUrl ?? raw.commandURL ?? raw.CommandURL

  return typeof route === 'string' && route.length > 0 ? route : undefined
}

const getRawGroupMenuVisible = (raw: RawMenuCommandNode): unknown => raw.group_menu_visible ?? raw.groupMenuVisible

const getRawDisplayOrder = (raw: RawMenuCommandNode): number | null => {
  const value = raw.display_order ?? raw.displayOrder ?? raw.sort_order ?? raw.sortOrder
  const order = typeof value === 'number' ? value : typeof value === 'string' ? Number(value.trim()) : NaN

  return Number.isFinite(order) ? order : null
}

/**
 * LEGACY COMPATIBILITY ONLY — see resolveLegacyActionFromLabel. Extracts the English command text
 * used for label-based action classification. Priority:
 * 1. `command_name` (system name — NOTE: may be translated when the menu is loaded with language=vi;
 *    resolveLegacyActionFromLabel therefore tries `command_name_language.en` before this)
 * 2. `label` when it is a plain string (some trees carry the English text directly here)
 * 3. `command_name_language` JSON, `.en`/`.EN` key — fallback only, may contain encoding issues.
 */
export const extractCommandText = (raw: RawMenuCommandNode): string => {
  const commandName = raw.command_name

  if (typeof commandName === 'string' && commandName.trim().length > 0) return commandName

  const label = raw.label

  if (typeof label === 'string' && label.trim().length > 0) return label

  const localized = raw.command_name_language

  if (typeof localized === 'object' && localized !== null) {
    const map = localized as Record<string, unknown>
    const en = map.en ?? map.EN

    if (typeof en === 'string') return en

    const firstString = Object.values(map).find(v => typeof v === 'string') as string | undefined

    return firstString ?? ''
  }

  if (typeof localized === 'string' && localized.trim().length > 0) {
    try {
      const parsed = JSON.parse(localized)

      if (parsed && typeof parsed === 'object') return extractCommandText({ command_name_language: parsed })
    } catch {
      return localized
    }
  }

  return ''
}

/**
 * LEGACY COMPATIBILITY ONLY. Classifies a command's English text into one of the known actions, or
 * null when unrecognized. Do not call this directly to resolve a node's action — go through
 * resolveNodeAction, which only invokes this when action_code is missing/empty.
 */
export const classifyAction = (text: string): PermissionAction | null => {
  const normalized = text.trim().toLowerCase()

  if (!normalized) return null

  for (const action of LEGACY_ACTION_PRIORITY) {
    if (LEGACY_ACTION_KEYWORDS[action].some(keyword => normalized.includes(keyword))) return action
  }

  return null
}

/**
 * LEGACY COMPATIBILITY ONLY — label-based action classification, used solely as a fallback for
 * menu payloads that predate the `action_code` contract. See resolveNodeAction for the gating
 * rule (only used when action_code is null/empty; never overrides a present action_code, even an
 * unrecognized one).
 */
const readEnglishCommandName = (localized: unknown): string | null => {
  if (typeof localized === 'string' && localized.trim().length > 0) {
    try {
      return readEnglishCommandName(JSON.parse(localized))
    } catch {
      return null
    }
  }

  if (typeof localized !== 'object' || localized === null) return null
  const map = localized as Record<string, unknown>
  const en = map.en ?? map.EN

  return typeof en === 'string' && en.trim().length > 0 ? en : null
}

/**
 * Candidate texts for the legacy fallback, most locale-independent first. WF_BO_LOAD_MENU is
 * requested with the UI `language`, so `command_name`/`label` can come back translated (e.g.
 * "Sửa" on /vi) and would never match the English keywords — which silently denied MODIFY/ADD/
 * DELETE on Vietnamese routes only. The multilingual `command_name_language.en` is identical in
 * every locale's payload, so it is tried first; a stable `command_code` is the last resort.
 */
const legacyCommandTexts = (raw: RawMenuCommandNode): string[] =>
  [readEnglishCommandName(raw.command_name_language), extractCommandText(raw), raw.command_code]
    .filter((text): text is string => typeof text === 'string' && text.trim().length > 0)

export const resolveLegacyActionFromLabel = (raw: RawMenuCommandNode): PermissionAction | null => {
  for (const text of legacyCommandTexts(raw)) {
    const action = classifyAction(text)

    if (action) return action
  }

  return null
}

/**
 * Resolves a command node's action. `action_code` (or camelCase `actionCode`) is the sole source
 * of truth per the finalized backend contract:
 * - present and recognized  -> use it
 * - present but unrecognized (e.g. "PUBLISH") -> null (deny-by-default; contract violation, not
 *   "missing data", so no fallback)
 * - null/undefined/empty string -> legacy label-based fallback for backward compatibility with
 *   older payloads
 */
const resolveNodeAction = (raw: RawMenuCommandNode): PermissionAction | null => {
  const rawActionCode = getRawActionCode(raw)
  const normalized = normalizePermissionAction(rawActionCode)

  if (normalized) return normalized

  const isActionCodeEmpty =
    rawActionCode === null ||
    rawActionCode === undefined ||
    (typeof rawActionCode === 'string' && rawActionCode.trim() === '')

  return isActionCodeEmpty ? resolveLegacyActionFromLabel(raw) : null
}

let syntheticIdCounter = 0

const buildCommandId = (raw: RawMenuCommandNode, parentId: string | null): string => {
  const id = getRawCommandId(raw)

  if (id !== undefined && id !== null && String(id).length > 0) return String(id)

  syntheticIdCounter += 1

  return `synthetic:${parentId ?? 'root'}:${syntheticIdCounter}`
}

const normalizeNode = (raw: RawMenuCommandNode, parentId: string | null): NormalizedCommandNode => {
  const commandType = getRawCommandType(raw)
  const commandId = buildCommandId(raw, parentId)
  const rawRoute = getRawRoute(raw)
  const groupMenuVisibleRaw = getRawGroupMenuVisible(raw)

  return {
    commandId,
    parentId,
    commandType,
    route: rawRoute ? normalizeMenuPath(rawRoute) : null,
    invoke: toPermissionBoolean(raw.invoke),
    approve: toPermissionBoolean(raw.approve),
    // Absent group_menu_visible defaults to visible (structural display flag, not an auth gate).
    // An explicit falsy value ("0", false, ...) still hides it. This mirrors requirement #9/#12.
    groupMenuVisible: groupMenuVisibleRaw === undefined || groupMenuVisibleRaw === null
      ? true
      : toPermissionBoolean(groupMenuVisibleRaw),
    action: commandType === 'C' ? resolveNodeAction(raw) : null,
    raw
  }
}

const ensureEntry = (registry: PermissionRegistry, route: string): ScreenPermissionEntry => {
  let entry = registry.byRoute.get(route)

  if (!entry) {
    entry = { route, menuNode: null, commands: [] }
    registry.byRoute.set(route, entry)
  }

  return entry
}

const getRawChildren = (raw: RawMenuCommandNode): RawMenuCommandNode[] => [
  ...getMenuChildren(raw),
  ...(Array.isArray(raw.utilities) ? raw.utilities : [])
] as RawMenuCommandNode[]

type MenuHierarchyEntry = {
  key: string
  node: RawMenuCommandNode
  parentId: string | null
  parentKey: string | null
  order: number
}

const stripRawChildren = (raw: RawMenuCommandNode): RawMenuCommandNode => {
  const clone = { ...raw }

  delete clone.children
  delete clone.items
  delete clone.submenus

  return clone
}

const flattenMenuEntries = (
  nodes: RawMenuCommandNode[] | null | undefined,
  inferredParentId: string | null = null,
  inferredParentKey: string | null = null,
  entries: MenuHierarchyEntry[] = []
): MenuHierarchyEntry[] => {
  if (!Array.isArray(nodes)) return entries

  nodes.forEach(raw => {
    if (!raw || typeof raw !== 'object') return

    const rawId = getRawCommandId(raw)
    const commandId = rawId === undefined || rawId === null || String(rawId).length === 0 ? null : String(rawId)
    const parentId = getRawParentId(raw) ?? inferredParentId
    const parentKey = getRawParentId(raw) ? null : inferredParentKey
    const children = getMenuChildren(raw) as RawMenuCommandNode[]
    const key = `${commandId ?? 'synthetic'}:${entries.length}`

    entries.push({
      key,
      node: stripRawChildren(raw),
      parentId,
      parentKey,
      order: entries.length
    })

    flattenMenuEntries(children, commandId ?? parentId, key, entries)
  })

  return entries
}

/**
 * WF_BO_LOAD_MENU can arrive either as a nested tree or a flat list linked by parent_id. Normalize
 * it once before permission/sidebar filtering so parent menu nodes do not lose their children.
 */
export const normalizeMenuHierarchy = (nodes: RawMenuCommandNode[] | null | undefined): RawMenuCommandNode[] => {
  const entries = flattenMenuEntries(nodes)
  const byKey = new Map<string, RawMenuCommandNode>()
  const firstKeyByCommandId = new Map<string, string>()
  const parentByKey = new Map<string, string | null>()
  const orderByNode = new WeakMap<RawMenuCommandNode, number>()
  const roots: RawMenuCommandNode[] = []

  entries.forEach(entry => {
    const rawId = getRawCommandId(entry.node)
    const commandId = rawId === undefined || rawId === null || String(rawId).length === 0 ? null : String(rawId)
    const clone: RawMenuCommandNode = { ...entry.node, children: [] }

    orderByNode.set(clone, entry.order)
    byKey.set(entry.key, clone)
    parentByKey.set(entry.key, entry.parentKey ?? entry.parentId)

    if (commandId && !firstKeyByCommandId.has(commandId)) firstKeyByCommandId.set(commandId, entry.key)
  })

  byKey.forEach((node, key) => {
    const parentRef = parentByKey.get(key) ?? null
    const parent = parentRef ? byKey.get(parentRef) ?? byKey.get(firstKeyByCommandId.get(parentRef) ?? '') : undefined

    if (parent) {
      parent.children = [...(parent.children ?? []), node]
    } else {
      roots.push(node)
    }
  })

  const sortMenuLevel = (items: RawMenuCommandNode[]): RawMenuCommandNode[] => {
    items.sort((left, right) => {
      const leftOrder = getRawDisplayOrder(left)
      const rightOrder = getRawDisplayOrder(right)

      if (leftOrder !== null && rightOrder !== null && leftOrder !== rightOrder) return leftOrder - rightOrder
      if (leftOrder !== null && rightOrder === null) return -1
      if (leftOrder === null && rightOrder !== null) return 1

      return (orderByNode.get(left) ?? 0) - (orderByNode.get(right) ?? 0)
    })

    items.forEach(item => {
      if (Array.isArray(item.children)) item.children = sortMenuLevel(item.children)
    })

    return items
  }

  return sortMenuLevel(roots)
}

const walk = (
  nodes: RawMenuCommandNode[] | undefined,
  parentId: string | null,
  parentRoute: string | null,
  registry: PermissionRegistry
): void => {
  if (!Array.isArray(nodes)) return

  for (const raw of nodes) {
    if (!raw || typeof raw !== 'object') continue

    const node = normalizeNode(raw, parentId)

    registry.byCommandId.set(node.commandId, node)

    let nextParentRoute = parentRoute

    if (node.commandType === 'M') {
      if (node.route) {
        const entry = ensureEntry(registry, node.route)

        entry.menuNode = node
        nextParentRoute = node.route
      }
    } else if (node.commandType === 'C') {
      if (parentRoute) {
        ensureEntry(registry, parentRoute).commands.push(node)
      }

      if (node.route) {
        const entry = ensureEntry(registry, node.route)

        entry.menuNode = node
        nextParentRoute = node.route
      }
    }

    walk(getRawChildren(raw), node.commandId, nextParentRoute, registry)
  }
}

const addCommandIfMissing = (entry: ScreenPermissionEntry, command: NormalizedCommandNode) => {
  if (!entry.commands.some(existing => existing.commandId === command.commandId)) {
    entry.commands.push(command)
  }
}

const attachSiblingCommandsToCommandRoutes = (registry: PermissionRegistry) => {
  const commandsByParentId = new Map<string | null, NormalizedCommandNode[]>()

  registry.byCommandId.forEach(node => {
    if (node.commandType !== 'C') return

    const commands = commandsByParentId.get(node.parentId) ?? []

    commands.push(node)
    commandsByParentId.set(node.parentId, commands)
  })

  registry.byRoute.forEach(entry => {
    if (entry.menuNode?.commandType !== 'C') return

    const siblingCommands = commandsByParentId.get(entry.menuNode.parentId) ?? []

    siblingCommands.forEach(command => addCommandIfMissing(entry, command))
  })
}

/**
 * Builds the full permission registry from the raw WF_BO_LOAD_MENU tree (usercommand).
 * Safe against null/undefined children, missing href, malformed command_name_language, etc.
 */
export const buildPermissionRegistry = (menuData: RawMenuCommandNode[] | null | undefined): PermissionRegistry => {
  const registry: PermissionRegistry = {
    byRoute: new Map(),
    byCommandId: new Map(),
    routes: []
  }

  walk(normalizeMenuHierarchy(menuData), null, null, registry)
  attachSiblingCommandsToCommandRoutes(registry)

  registry.routes = Array.from(registry.byRoute.keys()).sort((a, b) => b.length - a.length)

  return registry
}

/**
 * Longest-prefix route match, so a dynamic child route like
 * `/properties/project/5/edit` resolves to the registered parent screen `/properties/project`.
 */
export const resolveScreenRoute = (registry: PermissionRegistry, pathname: string): string | null => {
  const normalized = normalizeMenuPath(pathname)

  if (registry.byRoute.has(normalized)) return normalized

  for (const route of registry.routes) {
    if (route === '/') continue
    if (normalized === route || normalized.startsWith(`${route}/`)) return route
  }

  return null
}

const denyAllPermission = (resolved: boolean): ResolvedPermission => ({
  resolved,
  canView: false,
  canDetail: false,
  canAdd: false,
  canModify: false,
  canDelete: false,
  canImport: false,
  canExport: false,
  canApprove: false,
  can: () => false
})

/**
 * Resolves the standardized permission set for one screen route.
 * `isLoaded=false` (menu not fetched yet) always denies without flipping `resolved` to true, so
 * consumers can distinguish "still loading" from "loaded, no access" and avoid a flash of buttons.
 */
export const resolvePermission = (
  registry: PermissionRegistry,
  pathname: string,
  isLoaded: boolean
): ResolvedPermission => {
  if (!isLoaded) return denyAllPermission(false)

  const route = resolveScreenRoute(registry, pathname)
  const entry = route ? registry.byRoute.get(route) : undefined

  if (!entry) return denyAllPermission(true)

  // An action requires BOTH the parent screen and the specific command to have invoke=true. If
  // the screen's own invoke is revoked, every action under it is denied even when the individual
  // command still carries invoke=true.
  const screenInvoke = Boolean(entry.menuNode?.invoke)

  const hasInvoke = (action: PermissionAction): boolean => {
    if (!screenInvoke) return false

    return entry.commands.some(command => command.action === action && command.invoke)
  }

  const explicitViewCommand = entry.commands.some(command => command.action === 'VIEW')
  const canView = explicitViewCommand ? hasInvoke('VIEW') : screenInvoke

  // canApprove: there is no action_code='APPROVE'. `approve` is a separate authority flag carried
  // by any command — true here when the screen is enabled and at least one command under it has
  // approve=true, regardless of that command's action_code. This is a deliberately minimal rule;
  // it does not model per-action or per-record approval workflows.
  const canApprove = screenInvoke && entry.commands.some(command => command.approve)

  const permission: ResolvedPermission = {
    resolved: true,
    canView,
    canDetail: hasInvoke('DETAIL'),
    canAdd: hasInvoke('ADD'),
    canModify: hasInvoke('MODIFY'),
    canDelete: hasInvoke('DELETE'),
    canImport: hasInvoke('IMPORT'),
    canExport: hasInvoke('EXPORT'),
    canApprove,
    can: () => false
  }

  permission.can = (action: PermissionAction) => {
    switch (action) {
      case 'VIEW': return permission.canView
      case 'DETAIL': return permission.canDetail
      case 'ADD': return permission.canAdd
      case 'MODIFY': return permission.canModify
      case 'DELETE': return permission.canDelete
      case 'IMPORT': return permission.canImport
      case 'EXPORT': return permission.canExport
      default: return false
    }
  }

  return permission
}

/**
 * Looks up a command node's screen-relative info by command_id (e.g. for menu-management screens
 * or debugging), regardless of type.
 */
export const getCommandByAny = (
  registry: PermissionRegistry,
  commandId: string
): NormalizedCommandNode | undefined => registry.byCommandId.get(commandId)

/**
 * Returns the raw maker-checker `approve` flag on the command matching a specific action for a
 * screen (e.g. "can this user approve MODIFY requests"). More granular than
 * ResolvedPermission.canApprove, which is a blanket "any command has approve=true" check. Kept
 * separate from the primary canX booleans — `approve` never substitutes for `invoke`.
 */
export const getCommandApproveFlag = (
  registry: PermissionRegistry,
  pathname: string,
  action: PermissionAction
): boolean => {
  const route = resolveScreenRoute(registry, pathname)
  const entry = route ? registry.byRoute.get(route) : undefined

  if (!entry) return false

  return entry.commands.some(command => command.action === action && command.approve)
}

/**
 * Recursively filters a raw menu tree down to what the sidebar should render:
 * - only command_type "M" nodes (command_type "C" never appears in a sidebar)
 * - only nodes with invoke=true and group_menu_visible visible
 * - groups left with zero valid children (and no href of their own) are dropped
 * - backend-provided leaf menus with children=[] are kept
 */
export const filterMenuForSidebar = (nodes: RawMenuCommandNode[] | null | undefined): RawMenuCommandNode[] => {
  const normalizedNodes = normalizeMenuHierarchy(nodes)

  if (!Array.isArray(normalizedNodes)) return []

  const result: RawMenuCommandNode[] = []

  normalizedNodes.forEach((raw, index) => {
    if (!raw || typeof raw !== 'object') return

    const commandType = getRawCommandType(raw)

    if (commandType !== 'M') return

    const invoke = toPermissionBoolean(raw.invoke)
    const groupMenuVisibleRaw = getRawGroupMenuVisible(raw)
    const groupMenuVisible = groupMenuVisibleRaw === undefined || groupMenuVisibleRaw === null
      ? true
      : toPermissionBoolean(groupMenuVisibleRaw)

    if (!invoke || !groupMenuVisible) return

    const rawChildren = getMenuChildren(raw) as RawMenuCommandNode[]
    const filteredChildren = filterMenuForSidebar(rawChildren)
    const filteredUtilities = Array.isArray(raw.utilities) ? filterMenuForSidebar(raw.utilities) : undefined
    const hasOwnRoute = Boolean(getRawRoute(raw))
    const hadMenuChildren = rawChildren.some(child => child && typeof child === 'object' && getRawCommandType(child) === 'M')

    // A group that became empty after filtering its menu children is not a real screen. A screen
    // menu with children=[] or only command/action children is still a visible menu entry.
    if (!hasOwnRoute && hadMenuChildren && filteredChildren.length === 0) return

    result.push({
      ...raw,
      children: filteredChildren,
      __sidebarOriginalIndex: index,
      ...(filteredUtilities ? { utilities: filteredUtilities } : {})
    })
  })

  return result
    .sort((left, right) => {
      const leftOrder = getRawDisplayOrder(left)
      const rightOrder = getRawDisplayOrder(right)

      if (leftOrder !== null && rightOrder !== null && leftOrder !== rightOrder) return leftOrder - rightOrder
      if (leftOrder !== null && rightOrder === null) return -1
      if (leftOrder === null && rightOrder !== null) return 1

      return Number(left.__sidebarOriginalIndex ?? 0) - Number(right.__sidebarOriginalIndex ?? 0)
    })
    .map(({ __sidebarOriginalIndex, ...item }) => item)
}
