import type { CodeListItem } from '@/shared/types/codeList'
import { parseMultilingualCaption } from './parseMultilingualCaption'

export type CodeListOption = {
  value: string
  label: string
}

export const buildCodeListOptions = (items: CodeListItem[], locale: string): CodeListOption[] => (
  [...items]
    .filter(item => item.visible !== false)
    .sort((a, b) => a.code_index - b.code_index)
    .map(item => {
      const value =
        item.code_value?.trim() ||
        item.code_id?.trim() ||
        ''

      const label =
        parseMultilingualCaption(item.m_caption, locale) ||
        item.caption?.trim() ||
        item.code_value?.trim() ||
        item.code_id?.trim() ||
        '-'

      return { value, label }
    })
    .filter(option => Boolean(option.value))
)
