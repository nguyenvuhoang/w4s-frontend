import { readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'

import { buildPermissionRegistry, resolveLegacyActionFromLabel, resolvePermission } from './permissionUtils'
import type { RawMenuCommandNode } from './permissionTypes'

/**
 * Regression for "Thêm trường / + / Lưu thay đổi disabled on UAT /vi only" in Resident Detail →
 * Thông tin mở rộng. Those buttons are gated by usePermission({ href: '/resident/list' }).canModify.
 * WF_BO_LOAD_MENU is requested with the UI language, so the same account gets a different payload
 * per locale. Where a command has no action_code (legacy data), the action used to be inferred
 * only from command_name/label — translated on /vi — so MODIFY was silently denied there.
 */

type Locale = 'vi' | 'en'
type Environment = 'DEV' | 'UAT'

const NAMES = {
    ADD: { vi: 'Thêm mới', en: 'Add' },
    MODIFY: { vi: 'Sửa', en: 'Modify' },
    DELETE: { vi: 'Xóa', en: 'Delete' },
    VIEW: { vi: 'Xem', en: 'View' }
} as const

const command = (id: string, action: keyof typeof NAMES, env: Environment, locale: Locale, invoke = 'true'): RawMenuCommandNode => ({
    command_id: id,
    command_type: 'C',
    // DEV data carries action_code; UAT data was configured before the action_code contract.
    action_code: env === 'DEV' ? action : null,
    command_name: NAMES[action][locale],
    label: NAMES[action][locale],
    command_name_language: JSON.stringify({ vi: NAMES[action].vi, en: NAMES[action].en }),
    invoke
})

const residentMenu = (env: Environment, locale: Locale, invoke: { modify?: string; screen?: string } = {}): RawMenuCommandNode[] => [{
    command_id: 'RESIDENT',
    command_type: 'M',
    command_name: locale === 'vi' ? 'Cư dân' : 'Residents',
    href: `/${locale}/resident/list`,
    invoke: invoke.screen ?? 'true',
    children: [
        command('RESIDENT_VIEW', 'VIEW', env, locale),
        command('RESIDENT_ADD', 'ADD', env, locale),
        command('RESIDENT_MODIFY', 'MODIFY', env, locale, invoke.modify ?? 'true'),
        command('RESIDENT_DELETE', 'DELETE', env, locale)
    ]
}]

const resolveResident = (menu: RawMenuCommandNode[]) => {
    const permission = resolvePermission(buildPermissionRegistry(menu), '/resident/list', true)

    return { canView: permission.canView, canAdd: permission.canAdd, canModify: permission.canModify, canDelete: permission.canDelete }
}

// Same rule the Thông tin mở rộng tab uses (ResidentRelatedMembersTab: busy || loading || !canModify || !available).
const addFieldDisabled = (canModify: boolean, editState: { busy: boolean; loading: boolean; available: boolean }) =>
    editState.busy || editState.loading || !canModify || !editState.available

describe('permission does not depend on locale (DEV/UAT × vi/en)', () => {
    const matrix: Array<[Environment, Locale]> = [['DEV', 'vi'], ['DEV', 'en'], ['UAT', 'vi'], ['UAT', 'en']]

    it.each(matrix)('%s / %s grants the configured resident actions', (env, locale) => {
        expect(resolveResident(residentMenu(env, locale))).toEqual({ canView: true, canAdd: true, canModify: true, canDelete: true })
    })

    it.each(matrix)('%s / %s still denies MODIFY when the backend revokes it', (env, locale) => {
        expect(resolveResident(residentMenu(env, locale, { modify: 'false' })).canModify).toBe(false)
        expect(resolveResident(residentMenu(env, locale, { screen: 'false' }))).toEqual({ canView: false, canAdd: false, canModify: false, canDelete: false })
    })

    it('same account, resident, permission and edit state → identical button state in every environment/locale', () => {
        const editStates = [
            { busy: false, loading: false, available: true },
            { busy: true, loading: false, available: true },
            { busy: false, loading: true, available: true },
            { busy: false, loading: false, available: false }
        ]

        for (const revoked of [false, true]) {
            for (const editState of editStates) {
                const results = matrix.map(([env, locale]) =>
                    addFieldDisabled(resolveResident(residentMenu(env, locale, revoked ? { modify: 'false' } : {})).canModify, editState))

                expect(new Set(results).size).toBe(1)
            }
        }

        // Concretely: the UAT /vi case from the bug report is enabled again.
        expect(addFieldDisabled(resolveResident(residentMenu('UAT', 'vi')).canModify, editStates[0])).toBe(false)
    })
})

describe('legacy fallback prefers locale-independent fields', () => {
    it('uses command_name_language.en over a translated command_name/label', () => {
        expect(resolveLegacyActionFromLabel({ command_name: 'Sửa', label: 'Sửa', command_name_language: { vi: 'Sửa', en: 'Modify' }, action_code: null })).toBe('MODIFY')
        expect(resolveLegacyActionFromLabel({ command_name: 'Xóa', command_name_language: '{"vi":"Xóa","en":"Delete"}', action_code: '' })).toBe('DELETE')
    })

    it('falls back to a stable command_code when no English name is present', () => {
        expect(resolveLegacyActionFromLabel({ command_name: 'Sửa', command_code: 'RESIDENT_EDIT', action_code: null })).toBe('MODIFY')
    })

    it('keeps existing English-only payloads working and stays deny-by-default for unknown text', () => {
        expect(resolveLegacyActionFromLabel({ command_name: 'Add', action_code: null })).toBe('ADD')
        expect(resolveLegacyActionFromLabel({ command_name: 'Sửa', action_code: null })).toBeNull()
        expect(resolveLegacyActionFromLabel({ command_name_language: 'not json', action_code: null })).toBeNull()
    })

    it('never overrides a present action_code with label text', () => {
        const registry = buildPermissionRegistry([{
            command_id: 'S', command_type: 'M', href: '/vi/screen', invoke: 'true',
            children: [{ command_id: 'C', command_type: 'C', action_code: 'VIEW', command_name_language: { en: 'Modify' }, invoke: 'true' }]
        }])

        expect(resolvePermission(registry, '/en/screen', true).canModify).toBe(false)
        expect(resolvePermission(registry, '/en/screen', true).canView).toBe(true)
    })
})

describe('Thông tin mở rộng permission wiring is locale-free', () => {
    const hook = readFileSync(new URL('../../features/resident/hooks/useResidentRelatedMembersForm.ts', import.meta.url), 'utf8')
    const tab = readFileSync(new URL('../../features/resident/components/resident-detail/ResidentRelatedMembersTab.tsx', import.meta.url), 'utf8')

    it('resolves permission from a fixed, locale-less screen route', () => {
        expect(hook).toContain("usePermission({ href: '/resident/list' })")
    })

    it('never gates actions on translated text or locale', () => {
        for (const source of [hook, tab]) {
            expect(source).not.toMatch(/(language|locale)\s*===/)
            expect(source).not.toMatch(/disabled=\{[^}]*\btext\(/)
        }
    })
})
