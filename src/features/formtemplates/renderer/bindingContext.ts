import type { Locale } from '@/configs/i18n'

import type { DefaultBindingKey } from '../formSchema.types'

/**
 * Giá trị mẫu cho preview/print — KHÔNG cho phép nhập JS/expression tuỳ ý,
 * chỉ resolve theo allowlist DefaultBindingKey.
 */
export const buildDemoBindingContext = (locale: Locale | string, projectName?: string | null): Record<DefaultBindingKey, string> => ({
  'current_user.full_name': 'Nguyễn Văn A',
  'current_user.phone': '0901 234 567',
  'current_user.identity_number': '079123456789',
  'current_resident.id': 'RES-0001',
  'current_apartment.id': 'APT-0001',
  'current_apartment.code': 'A-12.05',
  'current_project.id': 'PRJ-0001',
  'current_project.name': projectName?.trim() || 'Dự án mẫu',
  'current_datetime': new Date().toLocaleString(locale === 'vi' ? 'vi-VN' : 'en-US')
})

export const resolveDefaultValue = (
  bindingContext: Record<DefaultBindingKey, string>,
  defaultBinding?: DefaultBindingKey | null,
  fallback?: unknown
) => {
  if (defaultBinding && bindingContext[defaultBinding] !== undefined) return bindingContext[defaultBinding]

  return fallback ?? ''
}
