import type { Locale } from '@/configs/i18n'
import { SIMPLE_SEARCH_PROJECTS_WORKFLOW_ID } from '@/features/resident/services/residentWorkflowIds'
import { workflowService } from '@/servers/system-service'

export type ProjectLookupOption = {
  id: number
  code: string
  name: string
  status?: string | null
  displayLabel: string
  raw: unknown
}

export const formatProjectLabel = (project: { code?: string | null; name: string }) => (
  project.code ? `[${project.code}] ${project.name}` : project.name
)

export type ProjectSelectorOption = {
  id: number
  code: string
  name: string
  status?: string | null
  address?: string | null
}

export type ProjectLookupFilter = {
  search_text: string
  page_index: number
  page_size: number
  project_name ?: string
}

export type ProjectLookupResult = {
  items: ProjectLookupOption[]
  total_count: number
  page_index: number
  page_size: number
}

const normalizeKey = (key: string) => key.toLowerCase().replace(/[_\-\s]/g, '')

const getField = (item: any, keys: string[]) => {
  if (!item || typeof item !== 'object') return undefined

  for (const key of keys) {
    if (item[key] !== undefined && item[key] !== null) return item[key]
  }

  const normalizedMap = Object.keys(item).reduce<Record<string, any>>((acc, key) => {
    acc[normalizeKey(key)] = item[key]

    return acc
  }, {})

  for (const key of keys) {
    const value = normalizedMap[normalizeKey(key)]

    if (value !== undefined && value !== null) return value
  }

  return undefined
}

const pickDataRoot = (payload: any) => {
  const dataresponse = payload?.dataresponse ?? payload?.payload?.dataresponse
  const data = dataresponse?.data ?? payload?.data ?? payload

  return data?.data ?? data?.input ?? data
}

const pickItems = (root: any): any[] => {
  if (Array.isArray(root)) return root
  if (Array.isArray(root?.items)) return root.items
  if (Array.isArray(root?.data)) return root.data
  if (Array.isArray(root?.input?.items)) return root.input.items
  if (Array.isArray(root?.input?.data)) return root.input.data

  return []
}

const toNumber = (value: unknown, fallback: number) => {
  const parsed = Number(value)

  return Number.isFinite(parsed) ? parsed : fallback
}

const normalizePageSize = (value: unknown, fallback: number) => {
  const pageSize = toNumber(value, fallback)

  return [5, 10, 20, 50].includes(pageSize) ? pageSize : fallback
}

const getWorkflowErrorMessage = (response: any, fallback: string) => {
  const dataresponse = response?.payload?.dataresponse ?? response?.dataresponse
  const errors = dataresponse?.errors ?? response?.payload?.errors ?? response?.errors ?? []

  if (Array.isArray(errors) && errors.length > 0) {
    return errors[0]?.info ?? errors[0]?.message ?? errors[0]?.description ?? fallback
  }

  return dataresponse?.message
    ?? dataresponse?.data?.message
    ?? response?.payload?.message
    ?? response?.message
    ?? fallback
}

const assertWorkflowSuccess = (response: any, fallback: string) => {
  const dataresponse = response?.payload?.dataresponse ?? response?.dataresponse
  const data = dataresponse?.data ?? response?.payload?.data ?? response?.data
  const errors = dataresponse?.errors ?? response?.payload?.errors ?? response?.errors ?? []
  const failed = response?.success === false
    || dataresponse?.success === false
    || data?.success === false
    || dataresponse?.code === 'failed'
    || data?.code === 'failed'

  if ((Array.isArray(errors) && errors.length > 0) || failed) {
    throw new Error(getWorkflowErrorMessage(response, fallback))
  }
}

const mapProjectOption = (item: any): ProjectLookupOption | null => {
  const id = toNumber(getField(item, ['id', 'project_id', 'projectId', 'projectid']), 0)

  if (id <= 0) return null

  const code = String(getField(item, ['project_code', 'projectCode', 'projectcode', 'code']) ?? '').trim()
  const name = String(getField(item, ['project_name', 'projectName', 'projectname', 'name', 'caption']) ?? '').trim()
  const status = getField(item, ['status', 'project_status', 'projectStatus'])
  const displayLabel = [code, name].filter(Boolean).join(' - ') || code || name || String(id)

  return {
    id,
    code,
    name,
    status: status === undefined ? null : String(status),
    displayLabel,
    raw: item
  }
}

const uniqueOptions = (items: ProjectLookupOption[]) => {
  const seen = new Set<number>()

  return items.filter(item => {
    if (seen.has(item.id)) return false

    seen.add(item.id)

    return true
  })
}

export const projectLookupService = {
  searchProjects: async ({
    sessiontoken,
    language,
    filter
  }: {
    sessiontoken?: string
    language?: Locale | string
    filter: ProjectLookupFilter
  }): Promise<ProjectLookupResult> => {
    if (!sessiontoken) {
      return {
        items: [],
        total_count: 0,
        page_index: filter.page_index,
        page_size: filter.page_size
      }
    }

    const request = {
      search_text: filter.search_text.trim(),
      page_index: Math.max(filter.page_index, 0),
      page_size: normalizePageSize(filter.page_size, 10),
      project_name: filter.project_name?.trim() || ''
    }

    const response = await workflowService.runFODynamic({
      sessiontoken,
      workflowid: SIMPLE_SEARCH_PROJECTS_WORKFLOW_ID,
      input: request,
      language: language as Locale
    })

    assertWorkflowSuccess(response, 'Unable to load projects.')

    const root = pickDataRoot(response?.payload ?? response)
    const items = uniqueOptions(
      pickItems(root)
        .map(mapProjectOption)
        .filter((item): item is ProjectLookupOption => item !== null)
    )

    return {
      items,
      total_count: toNumber(getField(root, ['total_count', 'totalCount', 'total_items', 'totalItems', 'total']), items.length),
      page_index: request.page_index,
      page_size: request.page_size
    }
  }
}
