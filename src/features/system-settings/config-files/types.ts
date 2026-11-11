import type { getDictionary } from '@/shared/utils/getDictionary'

export type ConfigFilesDictionary = Awaited<ReturnType<typeof getDictionary>>

export type JsonValidationResult =
  | {
      valid: true
      parsed: unknown
      error: null
    }
  | {
      valid: false
      parsed: null
      error: string
    }

export type StaticConfigFileItem = {
  file_name: string
  relative_path: string
  size_bytes?: number
  last_modified_utc?: string
}

export type StaticConfigFileSearchResult = {
  items: StaticConfigFileItem[]
  totalCount: number
  totalPages: number
  pageIndex: number
  pageSize: number
  hasPreviousPage: boolean
  hasNextPage: boolean
}
