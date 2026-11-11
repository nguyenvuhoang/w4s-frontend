import type { ProvincesDictionary } from '../types'
export const provinceText = (dictionary: ProvincesDictionary, key: string, fallback: string) => (dictionary as any).province_management?.[key] ?? fallback
export const displayProvinceValue = (value: unknown) => value === null || value === undefined || value === '' ? '-' : String(value)
export const provincePath = (locale: string) => `/${locale}/system-settings/provinces`
export const PROVINCE_CODE_LISTS = { status: { code_group: 'CTH', code_name: 'PROVINCE_STATUS' }, effectiveStatus: { code_group: 'CTH', code_name: 'PROVINCE_EFFECTIVE_STATUS' }, administrativeType: { code_group: 'CTH', code_name: 'PROVINCE_ADMIN_TYPE' } } as const
