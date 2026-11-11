export interface CodeListItem {
  id: number
  code_id: string
  code_name: string
  caption?: string | null
  m_caption?: string | null
  code_group: string
  code_index: number
  code_value?: string | null
  visible: boolean
}
