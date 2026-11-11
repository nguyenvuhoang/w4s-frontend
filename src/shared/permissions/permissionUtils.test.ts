import { describe, expect, it } from 'vitest'

import {
  buildPermissionRegistry,
  classifyAction,
  filterMenuForSidebar,
  isPermissionAction,
  normalizeMenuHierarchy,
  normalizePermissionAction,
  resolveLegacyActionFromLabel,
  resolvePermission,
  resolveScreenRoute,
  toPermissionBoolean
} from './permissionUtils'
import type { RawMenuCommandNode } from './permissionTypes'

// A representative WF_BO_LOAD_MENU-shaped tree per the finalized action_code contract: one screen
// ("Project") with VIEW/ADD/MODIFY/DELETE commands sourced from `action_code` (not label), one
// command hidden from the sidebar via group_menu_visible="0", and a nested dynamic-route child to
// exercise longest-prefix matching. Labels are intentionally present but irrelevant/misleading on
// some nodes to prove action_code always wins.
const buildSampleMenu = (): RawMenuCommandNode[] => [
  {
    command_id: 'M001',
    command_type: 'M',
    command_name: 'Properties',
    action_code: null,
    invoke: 'true',
    group_menu_visible: '1',
    children: [
      {
        command_id: 'M002',
        command_type: 'M',
        command_name: 'Project',
        href: '/properties/project',
        action_code: null,
        invoke: 'true',
        group_menu_visible: '1',
        children: [
          { command_id: 'C001', command_type: 'C', command_name: 'View', action_code: 'VIEW', invoke: 'true', approve: 'false' },
          { command_id: 'C002', command_type: 'C', command_name: 'Add', action_code: 'ADD', invoke: 'true', approve: 'false' },
          {
            command_id: 'C003',
            command_type: 'C',
            command_name: 'Modify',
            action_code: 'MODIFY',
            invoke: 'false',
            approve: 'false',
            group_menu_visible: '1'
          },
          {
            command_id: 'C004',
            command_type: 'C',
            command_name: 'Delete',
            action_code: 'DELETE',
            invoke: 'true',
            approve: 'true',
            // Hidden from sidebar display, but must still be usable for permission resolution.
            group_menu_visible: '0'
          }
        ]
      }
    ]
  }
]

describe('toPermissionBoolean', () => {
  it('parses the string "true" as true', () => {
    expect(toPermissionBoolean('true')).toBe(true)
  })

  it('parses the string "false" as false', () => {
    expect(toPermissionBoolean('false')).toBe(false)
  })

  it('never matches native Boolean() coercion behavior on "false"', () => {
    expect(Boolean('false')).toBe(true) // the bug this helper exists to avoid
    expect(toPermissionBoolean('false')).toBe(false)
  })

  it('accepts 1/yes/y/t/T case- and whitespace-insensitively (sidebar visibility flags), defaults everything else to false', () => {
    expect(toPermissionBoolean(' 1 ')).toBe(true)
    expect(toPermissionBoolean('YES')).toBe(true)
    expect(toPermissionBoolean('y')).toBe(true)
    expect(toPermissionBoolean('T')).toBe(true)
    expect(toPermissionBoolean(true)).toBe(true)
    expect(toPermissionBoolean(1)).toBe(true)
    expect(toPermissionBoolean(0)).toBe(false)
    expect(toPermissionBoolean(undefined)).toBe(false)
    expect(toPermissionBoolean(null)).toBe(false)
    expect(toPermissionBoolean('no')).toBe(false)
    expect(toPermissionBoolean({})).toBe(false)
  })
})

describe('isPermissionAction / normalizePermissionAction', () => {
  it('accepts the 7 standard action codes, case/whitespace-insensitively', () => {
    expect(normalizePermissionAction('ADD')).toBe('ADD')
    expect(normalizePermissionAction(' modify ')).toBe('MODIFY')
    expect(normalizePermissionAction('delete')).toBe('DELETE')
    expect(isPermissionAction('VIEW')).toBe(true)
    expect(isPermissionAction('DETAIL')).toBe(true)
    expect(isPermissionAction('IMPORT')).toBe(true)
    expect(isPermissionAction('EXPORT')).toBe(true)
  })

  it('does not accept APPROVE as an action code (there is no action_code="APPROVE" in the contract)', () => {
    expect(isPermissionAction('APPROVE')).toBe(false)
    expect(normalizePermissionAction('APPROVE')).toBeNull()
  })

  it('rejects unknown action codes and non-string values', () => {
    expect(normalizePermissionAction('PUBLISH')).toBeNull()
    expect(normalizePermissionAction(null)).toBeNull()
    expect(normalizePermissionAction(undefined)).toBeNull()
    expect(normalizePermissionAction(123)).toBeNull()
    expect(normalizePermissionAction({})).toBeNull()
  })
})

describe('action resolution priority (buildPermissionRegistry)', () => {
  it('action_code always wins over a conflicting label — label="Delete", action_code="MODIFY" resolves to MODIFY', () => {
    const menu: RawMenuCommandNode[] = [
      {
        command_id: 'M100',
        command_type: 'M',
        href: '/priority-screen',
        invoke: 'true',
        children: [
          { command_id: 'C100', command_type: 'C', command_name: 'Delete', label: 'Delete', action_code: 'MODIFY', invoke: 'true' }
        ]
      }
    ]
    const registry = buildPermissionRegistry(menu)
    const command = registry.byCommandId.get('C100')

    expect(command?.action).toBe('MODIFY')

    const permission = resolvePermission(registry, '/priority-screen', true)

    expect(permission.canModify).toBe(true)
    expect(permission.canDelete).toBe(false)
  })

  it('does not infer action from the command_id suffix — identical suffixes across screens resolve purely from action_code', () => {
    const menu: RawMenuCommandNode[] = [
      {
        command_id: 'MA', command_type: 'M', href: '/screen-a', invoke: 'true',
        children: [{ command_id: '001', command_type: 'C', action_code: 'ADD', invoke: 'true' }]
      },
      {
        command_id: 'MB', command_type: 'M', href: '/screen-b', invoke: 'true',
        children: [{ command_id: '001', command_type: 'C', action_code: 'DELETE', invoke: 'true' }]
      }
    ]
    const registry = buildPermissionRegistry(menu)

    expect(resolvePermission(registry, '/screen-a', true).canAdd).toBe(true)
    expect(resolvePermission(registry, '/screen-a', true).canDelete).toBe(false)
    expect(resolvePermission(registry, '/screen-b', true).canDelete).toBe(true)
    expect(resolvePermission(registry, '/screen-b', true).canAdd).toBe(false)
  })

  it('an unrecognized action_code (e.g. "PUBLISH") denies rather than falling back to label matching', () => {
    const menu: RawMenuCommandNode[] = [
      {
        command_id: 'M101',
        command_type: 'M',
        href: '/publish-screen',
        invoke: 'true',
        children: [
          // label says "Add" but action_code is a contract violation — must not silently become ADD.
          { command_id: 'C101', command_type: 'C', command_name: 'Add', action_code: 'PUBLISH', invoke: 'true' }
        ]
      }
    ]
    const registry = buildPermissionRegistry(menu)
    const command = registry.byCommandId.get('C101')

    expect(command?.action).toBeNull()
    expect(resolvePermission(registry, '/publish-screen', true).canAdd).toBe(false)
  })

  it('action_code=null on a command_type="M" node is valid and does not affect the node', () => {
    const registry = buildPermissionRegistry(buildSampleMenu())
    const screenNode = registry.byCommandId.get('M002')

    expect(screenNode?.commandType).toBe('M')
    expect(screenNode?.action).toBeNull()
  })

  describe('legacy label fallback (action_code missing/empty only)', () => {
    it('classifies known English command text when action_code is null', () => {
      expect(resolveLegacyActionFromLabel({ command_name: 'Add', action_code: null })).toBe('ADD')
      expect(classifyAction('  edit  ')).toBe('MODIFY')
      expect(classifyAction('Export to Excel')).toBe('EXPORT')
    })

    it('returns null for unrecognized legacy text', () => {
      expect(classifyAction('Refresh')).toBeNull()
      expect(classifyAction('')).toBeNull()
    })

    it('is only used by buildPermissionRegistry when action_code is null/undefined/empty string', () => {
      const menu: RawMenuCommandNode[] = [
        {
          command_id: 'M102',
          command_type: 'M',
          href: '/legacy-screen',
          invoke: 'true',
          children: [
            { command_id: 'C102', command_type: 'C', command_name: 'Add', action_code: '', invoke: 'true' }
          ]
        }
      ]
      const registry = buildPermissionRegistry(menu)

      // action_code is an empty string -> legacy fallback kicks in -> label "Add" -> ADD.
      expect(registry.byCommandId.get('C102')?.action).toBe('ADD')
    })
  })
})

describe('filterMenuForSidebar', () => {
  it('never includes command_type "C" nodes', () => {
    const filtered = filterMenuForSidebar(buildSampleMenu())
    const project = filtered[0]?.children?.[0]

    expect(project?.children ?? []).toEqual([])
  })

  it('drops menu nodes with invoke=false', () => {
    const menu: RawMenuCommandNode[] = [
      { command_id: 'M010', command_type: 'M', command_name: 'Hidden', href: '/hidden', invoke: 'false', group_menu_visible: '1' }
    ]

    expect(filterMenuForSidebar(menu)).toEqual([])
  })

  it('drops menu nodes with group_menu_visible not visible even when invoke=true, and normalizes visibility beyond a bare "1"', () => {
    const menu: RawMenuCommandNode[] = [
      { command_id: 'M011', command_type: 'M', command_name: 'NotInMenu', href: '/not-in-menu', invoke: 'true', group_menu_visible: '0' },
      { command_id: 'M012', command_type: 'M', command_name: 'VisibleTrueString', href: '/visible-true', invoke: 'true', group_menu_visible: 'true' },
      { command_id: 'M013', command_type: 'M', command_name: 'VisibleUpperT', href: '/visible-t', invoke: 'true', group_menu_visible: 'T' },
      { command_id: 'M014', command_type: 'M', command_name: 'VisibleNumeric', href: '/visible-numeric', invoke: 1, group_menu_visible: 1 },
      { command_id: 'M015', command_type: 'M', command_name: 'VisibleBoolean', href: '/visible-boolean', invoke: true, group_menu_visible: true }
    ]

    const filtered = filterMenuForSidebar(menu)
    const hrefs = filtered.map(item => item.href)

    expect(hrefs).not.toContain('/not-in-menu')
    expect(hrefs).toEqual(['/visible-true', '/visible-t', '/visible-numeric', '/visible-boolean'])
  })

  it('prunes a parent left with no valid children and no href of its own', () => {
    const menu: RawMenuCommandNode[] = [
      {
        command_id: 'M020',
        command_type: 'M',
        command_name: 'EmptyGroup',
        invoke: 'true',
        group_menu_visible: '1',
        children: [
          { command_id: 'M021', command_type: 'M', command_name: 'Child', href: '/child', invoke: 'false', group_menu_visible: '1' }
        ]
      }
    ]

    expect(filterMenuForSidebar(menu)).toEqual([])
  })

  it('keeps a valid screen and its visible children', () => {
    const filtered = filterMenuForSidebar(buildSampleMenu())

    expect(filtered).toHaveLength(1)
    expect(filtered[0].children?.[0]?.href).toBe('/properties/project')
  })

  it('keeps a visible command_type="M" menu leaf with children=[] and sorts by display_order', () => {
    const menu: RawMenuCommandNode[] = [
      {
        command_id: '020',
        command_type: 'M',
        label: 'Later',
        invoke: 'true',
        group_menu_visible: '1',
        display_order: 20,
        children: []
      },
      {
        parent_id: '0',
        command_id: '014',
        label: 'Ghi ch\u1ec9 s\u1ed1',
        command_type: 'M',
        invoke: 'true',
        approve: 'true',
        icon: 'Speed',
        group_menu_visible: '1',
        command_name_language: '{"vi":"Ghi ch\\u1ec9 s\\u1ed1","en":"Meter Reading"}',
        display_order: 14,
        children: []
      }
    ]

    const filtered = filterMenuForSidebar(menu)

    expect(filtered).toHaveLength(2)
    expect(filtered[0].command_id).toBe('014')
    expect(filtered[0].label).toBe('Ghi ch\u1ec9 s\u1ed1')
    expect(filtered[0].icon).toBe('Speed')
    expect(filtered[0].children).toEqual([])
  })

  it('builds a flat parent_id payload before sidebar filtering and keeps screens with only command children', () => {
    const menu: RawMenuCommandNode[] = [
      {
        command_id: '013',
        parent_id: '0',
        command_type: 'M',
        label: 'Fees',
        invoke: 'true',
        group_menu_visible: '1',
        display_order: 13
      },
      {
        command_id: '013001',
        parent_id: '013',
        command_type: 'M',
        label: 'Fee Type',
        href: '/fees/fee-type',
        invoke: 'true',
        group_menu_visible: '1',
        display_order: 1
      },
      {
        command_id: '014',
        parent_id: '0',
        command_type: 'M',
        command_name_language: '{"vi":"Ghi ch\\u1ec9 s\\u1ed1","en":"Meter Reading"}',
        invoke: 'true',
        approve: 'true',
        icon: 'Speed',
        group_menu_visible: '1',
        display_order: 14
      },
      {
        command_id: '014001',
        parent_id: '014',
        command_type: 'C',
        action_code: 'VIEW',
        invoke: 'true',
        approve: 'true',
        group_menu_visible: '0'
      }
    ]

    const tree = normalizeMenuHierarchy(menu)
    const fees = tree.find(item => item.command_id === '013')
    const meterReading = tree.find(item => item.command_id === '014')
    const filtered = filterMenuForSidebar(menu)

    expect(fees?.children?.map(child => child.command_id)).toEqual(['013001'])
    expect(meterReading?.children?.map(child => child.command_id)).toEqual(['014001'])
    expect(filtered.map(item => item.command_id)).toEqual(['013', '014'])
    expect(filtered.find(item => item.command_id === '014')?.children).toEqual([])
  })

  it('keeps nested 014 -> 014001 when child menu has no route and only VIEW action child', () => {
    const menu: RawMenuCommandNode[] = [
      {
        command_id: '014',
        parent_id: '0',
        command_type: 'M',
        command_name_language: '{"vi":"Ghi ch\\u1ec9 s\\u1ed1","en":"Meter Reading"}',
        invoke: 'true',
        approve: 'true',
        icon: 'Speed',
        group_menu_visible: '1',
        display_order: 14,
        children: [
          {
            command_id: '014001',
            parent_id: '014',
            command_type: 'M',
            command_name_language: '{"vi":"Ghi ch\\u1ec9 s\\u1ed1 n\\u01b0\\u1edbc","en":"Water Meter Reading"}',
            href: null,
            command_uri: null,
            command_url: null,
            invoke: 'true',
            group_menu_visible: '1',
            display_order: 1,
            children: [
              {
                command_id: '014001001',
                parent_id: '014001',
                command_type: 'C',
                action_code: 'VIEW',
                invoke: 'true',
                approve: 'true',
                group_menu_visible: '0'
              }
            ]
          }
        ]
      }
    ]

    const filtered = filterMenuForSidebar(menu)
    const meterReading = filtered.find(item => item.command_id === '014')
    const waterReading = meterReading?.children?.find(item => item.command_id === '014001')

    expect(meterReading).toBeDefined()
    expect(waterReading).toBeDefined()
    expect(waterReading?.children).toEqual([])
  })

  it('does not use a command_type="C" node\'s own group_menu_visible to decide action permission (only sidebar display)', () => {
    // C004 (Delete) has group_menu_visible="0" in buildSampleMenu — filterMenuForSidebar correctly
    // drops it from any sidebar listing (it's never type "M" anyway, see the first test above), but
    // resolvePermission must still grant DELETE — covered in the resolvePermission suite below.
    const registry = buildPermissionRegistry(buildSampleMenu())
    const deleteCommand = registry.byCommandId.get('C004')

    expect(deleteCommand?.groupMenuVisible).toBe(false)
    expect(deleteCommand?.invoke).toBe(true)
    expect(resolvePermission(registry, '/properties/project', true).canDelete).toBe(true)
  })
})

describe('resolvePermission', () => {
  it('returns resolved=false and denies everything while the menu has not loaded', () => {
    const registry = buildPermissionRegistry(buildSampleMenu())
    const permission = resolvePermission(registry, '/properties/project', false)

    expect(permission.resolved).toBe(false)
    expect(permission.canAdd).toBe(false)
    expect(permission.canView).toBe(false)
  })

  it('denies every action when the screen has no matching command at all', () => {
    const registry = buildPermissionRegistry(buildSampleMenu())
    const permission = resolvePermission(registry, '/does/not/exist', true)

    expect(permission.resolved).toBe(true)
    expect(permission.canView).toBe(false)
    expect(permission.canAdd).toBe(false)
    expect(permission.canDelete).toBe(false)
  })

  it('grants canAdd/canView/canDelete and denies canModify per invoke, independent of group_menu_visible', () => {
    const registry = buildPermissionRegistry(buildSampleMenu())
    const permission = resolvePermission(registry, '/properties/project', true)

    expect(permission.canView).toBe(true)
    expect(permission.canAdd).toBe(true)
    expect(permission.canModify).toBe(false) // invoke=false
    // Delete command has group_menu_visible=0 (hidden from sidebar) but invoke=true —
    // permission resolution must still honor it.
    expect(permission.canDelete).toBe(true)
    expect(permission.can('ADD')).toBe(true)
    expect(permission.can('MODIFY')).toBe(false)
  })

  it('denies an action when the parent screen invoke is false, even though the command invoke is true', () => {
    const menu: RawMenuCommandNode[] = [
      {
        command_id: 'M060',
        command_type: 'M',
        href: '/revoked-screen',
        invoke: 'false', // screen itself has been revoked
        children: [
          { command_id: 'C060', command_type: 'C', action_code: 'ADD', invoke: 'true' },
          { command_id: 'C061', command_type: 'C', action_code: 'VIEW', invoke: 'true' }
        ]
      }
    ]
    const registry = buildPermissionRegistry(menu)
    const permission = resolvePermission(registry, '/revoked-screen', true)

    expect(permission.canAdd).toBe(false)
    expect(permission.canView).toBe(false)
  })

  it('canApprove is computed from the approve flag on any command (not an action_code), gated by screen invoke', () => {
    const registry = buildPermissionRegistry(buildSampleMenu())

    // C004 (Delete) has approve="true" in buildSampleMenu; no command has action_code="APPROVE"
    // because that value does not exist in the contract.
    expect(resolvePermission(registry, '/properties/project', true).canApprove).toBe(true)

    const revokedScreenMenu: RawMenuCommandNode[] = [
      {
        command_id: 'M061',
        command_type: 'M',
        href: '/revoked-approve-screen',
        invoke: 'false',
        children: [{ command_id: 'C062', command_type: 'C', action_code: 'MODIFY', invoke: 'true', approve: 'true' }]
      }
    ]
    const revokedRegistry = buildPermissionRegistry(revokedScreenMenu)

    // approve=true on the command, but the screen itself is revoked -> still denied.
    expect(resolvePermission(revokedRegistry, '/revoked-approve-screen', true).canApprove).toBe(false)
  })

  it('maps a dynamic child route to its nearest registered parent screen (longest-prefix match)', () => {
    const registry = buildPermissionRegistry(buildSampleMenu())

    expect(resolveScreenRoute(registry, '/properties/project/5/edit')).toBe('/properties/project')

    const permission = resolvePermission(registry, '/properties/project/5/edit', true)

    expect(permission.canAdd).toBe(true)
  })

  it('does NOT resolve a sibling route via prefix matching — this is exactly why AuthorizedLayout needs an explicit permissionHref', () => {
    // /resident/import and /resident/list share no path prefix; the IMPORT command lives under
    // /resident/list. Resolving by the page's own pathname must fail...
    const menu: RawMenuCommandNode[] = [
      {
        command_id: 'M070',
        command_type: 'M',
        href: '/resident/list',
        invoke: 'true',
        children: [{ command_id: 'C070', command_type: 'C', action_code: 'IMPORT', invoke: 'true' }]
      }
    ]
    const registry = buildPermissionRegistry(menu)

    expect(resolvePermission(registry, '/resident/import', true).canImport).toBe(false)

    // ...while resolving via the explicit permissionHref (what AuthorizedLayout now passes as
    // `accessHref = permissionHref ?? requiredPath`) correctly grants it.
    expect(resolvePermission(registry, '/resident/list', true).canImport).toBe(true)
  })

  it('resolves hidden command routes from raw menu C nodes and uses sibling operation actions', () => {
    const menu: RawMenuCommandNode[] = [
      {
        command_id: '018',
        command_type: 'M',
        href: '/contact-info',
        invoke: 'true',
        group_menu_visible: '1',
        children: [
          {
            command_id: '018001',
            parent_id: '018',
            command_type: 'C',
            href: '/contact-info-view-detail',
            group_menu_visible: '0',
            action_code: 'VIEW',
            invoke: 'true',
            approve: 'true'
          },
          { command_id: '018002', parent_id: '018', command_type: 'C', action_code: 'MODIFY', invoke: 'true' },
          { command_id: '018003', parent_id: '018', command_type: 'C', action_code: 'DELETE', invoke: 'true' },
          { command_id: '018004', parent_id: '018', command_type: 'C', action_code: 'DETAIL', invoke: 'true' },
          { command_id: '018005', parent_id: '018', command_type: 'C', action_code: 'ADD', invoke: 'true' },
          { command_id: '018006', parent_id: '018', command_type: 'C', action_code: 'EXPORT', invoke: 'true' },
          { command_id: '018007', parent_id: '018', command_type: 'C', action_code: 'IMPORT', invoke: 'true' }
        ]
      }
    ]
    const registry = buildPermissionRegistry(menu)

    expect(resolveScreenRoute(registry, '/vi/contact-info-view-detail?id=31')).toBe('/contact-info-view-detail')

    const permission = resolvePermission(registry, '/vi/contact-info-view-detail?id=31', true)

    expect(permission.canView).toBe(true)
    expect(permission.canModify).toBe(true)
    expect(permission.canDelete).toBe(true)
    expect(permission.canDetail).toBe(true)
    expect(permission.canAdd).toBe(true)
    expect(permission.canExport).toBe(true)
    expect(permission.canImport).toBe(true)
    expect(permission.canApprove).toBe(true)
  })

  it('falls back to the menu node invoke for canView when there is no explicit VIEW command', () => {
    const menu: RawMenuCommandNode[] = [
      {
        command_id: 'M030',
        command_type: 'M',
        command_name: 'NoViewCommand',
        href: '/no-view-command',
        invoke: 'true',
        children: [
          { command_id: 'C030', command_type: 'C', action_code: 'ADD', invoke: 'true' }
        ]
      }
    ]
    const registry = buildPermissionRegistry(menu)
    const permission = resolvePermission(registry, '/no-view-command', true)

    expect(permission.canView).toBe(true)
  })

  it('is deny-by-default when a command is entirely missing for a screen', () => {
    const menu: RawMenuCommandNode[] = [
      { command_id: 'M040', command_type: 'M', command_name: 'ViewOnly', href: '/view-only', invoke: 'true' }
    ]
    const registry = buildPermissionRegistry(menu)
    const permission = resolvePermission(registry, '/view-only', true)

    expect(permission.canDelete).toBe(false)
    expect(permission.canImport).toBe(false)
  })

  it('handles malformed input defensively: null children, missing href, bad JSON in command_name_language, and a wrong-typed action_code', () => {
    const menu = [
      {
        command_id: 'M050',
        command_type: 'M',
        command_name_language: '{not-json',
        href: '',
        invoke: 'true',
        children: null
      },
      {
        command_id: 'M051',
        command_type: 'M',
        href: '/m051',
        invoke: 'true',
        children: [
          // action_code sent as a number instead of a string — must not throw, must deny.
          { command_id: 'C051', command_type: 'C', action_code: 42, invoke: 'true' }
        ]
      }
    ] as unknown as RawMenuCommandNode[]

    expect(() => buildPermissionRegistry(menu)).not.toThrow()

    const registry = buildPermissionRegistry(menu)

    // No href means this node never becomes a resolvable screen.
    expect(resolveScreenRoute(registry, '/m050')).toBeNull()
    expect(registry.byCommandId.get('C051')?.action).toBeNull()
    expect(resolvePermission(registry, '/m051', true).canAdd).toBe(false)
  })

  it('does not leak permissions between independently built registries (equivalent to a logout/role change reset — see PermissionProvider identityKey)', () => {
    const adminRegistry = buildPermissionRegistry(buildSampleMenu())
    const restrictedRegistry = buildPermissionRegistry([
      { command_id: 'M002', command_type: 'M', command_name: 'Project', href: '/properties/project', invoke: 'true' }
    ])

    expect(resolvePermission(adminRegistry, '/properties/project', true).canAdd).toBe(true)
    expect(resolvePermission(restrictedRegistry, '/properties/project', true).canAdd).toBe(false)
  })
})
