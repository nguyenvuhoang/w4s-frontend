import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

import {
  getStaticRouteAccessPolicy,
  hasStaticRouteAccess,
  SYSTEM_SETTINGS_BASE_PATH
} from './staticRouteAccess'

const SETTINGS_DIR = fileURLToPath(new URL('../app/[locale]/(dashboard)/system-settings', import.meta.url))

// Every base module actually present in the app router (a new module is covered automatically).
const BASE_MODULES = readdirSync(SETTINGS_DIR)
  .filter(name => statSync(join(SETTINGS_DIR, name)).isDirectory())
  .map(name => (name.startsWith('[') ? 'security' : name)) // [module] serves hub cards such as /system-settings/security

const CHILD_ROUTES = [
  '/system-settings/projects/create',
  '/system-settings/projects/1',
  '/system-settings/projects/1/edit',
  '/system-settings/provinces/create',
  '/system-settings/provinces/1',
  '/system-settings/provinces/1/edit',
  '/system-settings/user-roles/create',
  '/system-settings/user-roles/ROLE_1',
  '/system-settings/menu-management/create',
  '/system-settings/menu-management/CMD_1',
  '/system-settings/audit-logs/EXEC-1',
  '/system-settings/workflows/WF_BO_X/designer',
  '/system-settings/config-files/svc/detail',
  '/system-settings/integrations/payment',
  '/system-settings/general/create'
]

const access = (route: string, isSuperAdmin: boolean, action: 'VIEW' | 'ADD' | 'MODIFY' | 'DELETE' = 'VIEW') => (
  hasStaticRouteAccess({ route, action, isSuperAdmin })
)

describe('System Settings direct URL access (static super-admin policy)', () => {
  it('audits the real route folders (hub modules present)', () => {
    for (const moduleName of ['projects', 'provinces', 'user-roles', 'menu-management', 'application-logs', 'audit-logs', 'workflows', 'integrations', 'config-files', 'service-settings', 'general']) {
      expect(BASE_MODULES).toContain(moduleName)
    }
  })

  it('SUPER ADMIN: the hub and every base module are allowed', () => {
    expect(access(SYSTEM_SETTINGS_BASE_PATH, true)).toBe(true)
    for (const moduleName of BASE_MODULES) expect(access(`/system-settings/${moduleName}`, true)).toBe(true)
  })

  it('NON ADMIN: the hub, every base module and create / detail / edit children are denied', () => {
    expect(access(SYSTEM_SETTINGS_BASE_PATH, false)).toBe(false)
    for (const moduleName of BASE_MODULES) expect(access(`/system-settings/${moduleName}`, false)).toBe(false)
    for (const route of CHILD_ROUTES) {
      expect(access(route, false)).toBe(false)
      expect(access(route, false, 'ADD')).toBe(false)
      expect(access(route, false, 'MODIFY')).toBe(false)
    }
  })

  it('SUPER ADMIN keeps create / edit / delete in the modules; application logs stay view-only', () => {
    for (const route of CHILD_ROUTES) expect(access(route, true, 'MODIFY')).toBe(true)
    expect(access('/system-settings/projects', true, 'ADD')).toBe(true)
    expect(access('/system-settings/provinces/1', true, 'DELETE')).toBe(true)
    expect(access('/system-settings/application-logs', true, 'VIEW')).toBe(true)
    expect(access('/system-settings/application-logs', true, 'MODIFY')).toBe(false)
  })

  it('locale-prefixed URLs are covered too', () => {
    expect(access('/vi/system-settings/provinces/1/edit', false)).toBe(false)
    expect(access('/en/system-settings', false)).toBe(false)
    expect(access('/la/system-settings/projects', false)).toBe(false)
    expect(access('/vi/system-settings/provinces/1/edit', true)).toBe(true)
  })

  it('business routes are not affected (segment-safe matching)', () => {
    for (const route of ['/properties/project', '/properties/project/1/edit', '/resident/list', '/roles-profile', '/users/staffs', '/system-settings-x']) {
      expect(getStaticRouteAccessPolicy(route)).toBeUndefined()
    }
  })

  it('the whole segment goes through AuthorizedLayout with that policy (layout), which checks static policies before menu rights', () => {
    const layout = readFileSync(join(SETTINGS_DIR, 'layout.tsx'), 'utf8')
    const authorized = readFileSync(fileURLToPath(new URL('../shared/components/layout/AuthorizedLayout.tsx', import.meta.url)), 'utf8')

    expect(layout).toContain('<AuthorizedLayout requiredPath={SYSTEM_SETTINGS_BASE_PATH} params={{ locale }}>')
    expect(layout).toContain('{() => <>{children}</>}')
    expect(authorized).toMatch(/const staticPolicy = getStaticRouteAccessPolicy\(accessHref\)[\s\S]*if \(staticPolicy\) \{\s*hasAccess = hasStaticRouteAccess\(/)
    expect(authorized).toContain("unauthorizedBehavior = 'forbidden'")
  })
})
