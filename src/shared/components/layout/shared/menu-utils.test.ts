import { describe, expect, it } from 'vitest'

import {
  findMenuNodeByCommandId,
  flattenMenus,
  getCommandId,
  getFirstDescendantMenuRoute,
  getMenuRoute,
  getModuleCommandIdFromPath,
  isMenuActive
} from './menu-utils'

describe('menu-utils', () => {
  it('maps backend CommandURI variants into a route', () => {
    expect(getMenuRoute({ CommandURI: '/meter-reading/water' })).toBe('/meter-reading/water')
    expect(getMenuRoute({ commandURI: '/fees/fee-type' })).toBe('/fees/fee-type')
    expect(getMenuRoute({ commandUri: '/resident/list' })).toBe('/resident/list')
  })

  it('keeps a command_type="M" leaf without route so module launcher can render it', () => {
    const flattened = flattenMenus([
      {
        command_id: '014001',
        command_type: 'M',
        command_name_language: '{"vi":"Ghi ch\\u1ec9 s\\u1ed1 n\\u01b0\\u1edbc","en":"Water Meter Reading"}',
        href: null,
        command_uri: null,
        command_url: null,
        children: []
      } as any
    ], [], 'vi')

    expect(flattened).toHaveLength(1)
    expect(flattened[0]).toMatchObject({
      id: '014001',
      title: 'Ghi ch\u1ec9 s\u1ed1 n\u01b0\u1edbc',
      route: undefined,
      commandCode: '014001'
    })
  })

  it('does not expose command_type="C" action nodes in flattened launcher items', () => {
    const flattened = flattenMenus([
      {
        command_id: '014001001',
        command_type: 'C',
        action_code: 'VIEW',
        invoke: 'true',
        children: []
      } as any
    ], [], 'vi')

    expect(flattened).toEqual([])
  })

  it('finds the first usable descendant route without using a placeholder href', () => {
    expect(
      getFirstDescendantMenuRoute({
        children: [
          { href: '#', children: [{ href: '/resident/import' }] },
          { href: '/resident/list' }
        ]
      })
    ).toBe('/resident/import')
  })

  it('matches only a route and its path descendants', () => {
    expect(isMenuActive('/resident', '/vi/resident/import')).toBe(true)
    expect(isMenuActive('/resident', '/vi/residential')).toBe(false)
  })

  describe('getCommandId', () => {
    it('prefers command_id, then commandId, then id', () => {
      expect(getCommandId({ command_id: '003', id: '999' })).toBe('003')
      expect(getCommandId({ commandId: '004' })).toBe('004')
      expect(getCommandId({ id: '005' })).toBe('005')
    })

    it('returns undefined when no usable identifier is present', () => {
      expect(getCommandId({})).toBeUndefined()
      expect(getCommandId({ command_id: '' })).toBeUndefined()
      expect(getCommandId(null)).toBeUndefined()
    })
  })

  describe('findMenuNodeByCommandId', () => {
    const tree = [
      {
        command_id: '003',
        command_name_language: '{"vi":"Hợp đồng"}',
        children: [
          { command_id: '003001', href: '/company' },
          { command_id: '003002', href: '/contract' }
        ]
      },
      {
        command_id: '004',
        command_name_language: '{"vi":"Tài sản"}',
        children: [
          {
            command_id: '004001',
            children: [{ command_id: '004001001', href: '/assets/laptop' }]
          }
        ]
      }
    ] as any[]

    it('finds a top-level menu node by command_id', () => {
      expect(findMenuNodeByCommandId(tree, '003')).toBe(tree[0])
    })

    it('finds a nested menu node at any depth', () => {
      expect(findMenuNodeByCommandId(tree, '004001001')).toBe((tree[1].children[0] as any).children[0])
    })

    it('returns null for an unknown or missing command_id', () => {
      expect(findMenuNodeByCommandId(tree, '999')).toBeNull()
      expect(findMenuNodeByCommandId(tree, '')).toBeNull()
      expect(findMenuNodeByCommandId(null, '003')).toBeNull()
    })
  })

  describe('getModuleCommandIdFromPath', () => {
    it('extracts the command_id from a localized module hub path', () => {
      expect(getModuleCommandIdFromPath('/vi/module/003')).toBe('003')
      expect(getModuleCommandIdFromPath('/en/module/003')).toBe('003')
    })

    it('decodes a command_id containing special characters', () => {
      expect(getModuleCommandIdFromPath('/vi/module/H%E1%BB%A3p%20%C4%91%E1%BB%93ng')).toBe('Hợp đồng')
    })

    it('ignores child paths and unrelated routes', () => {
      expect(getModuleCommandIdFromPath('/vi/module/003/edit')).toBe('003')
      expect(getModuleCommandIdFromPath('/vi/resident/detail/19397')).toBeNull()
      expect(getModuleCommandIdFromPath(null)).toBeNull()
    })
  })
})
