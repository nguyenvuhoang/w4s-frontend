export type ManagementStatus = 'active' | 'inactive'

export type ManagementFieldType = 'text' | 'number' | 'date' | 'select' | 'boolean' | 'currency'

export type ManagementField = {
  key: string
  label: string
  type?: ManagementFieldType
  required?: boolean
  table?: boolean
  form?: boolean
  options?: { label: string; value: string | boolean }[]
}

export type ManagementRecord = {
  id: string
  status?: ManagementStatus | string
  createdAt?: string
  updatedAt?: string
  [key: string]: unknown
}

export type ManagementScreenConfig = {
  key: string
  title: string
  route: string
  endpointTodo: string
  fields: ManagementField[]
}

export type ManagementListParams = {
  keyword?: string
  status?: 'all' | ManagementStatus
  page: number
  pageSize: number
}

export type ManagementListResult = {
  data: ManagementRecord[]
  total: number
}
