import type { Locale } from '@/configs/i18n'
import { workflowService } from '@/servers/system-service'
import { AssetWorkflowError } from '../types'

import type {
  AssetDetailRequest,
  CreateAssetRequest,
  CreateAssetResponse,
  DeleteAssetRequest,
  DeleteAssetResponse,
  AssetFilterModel,
  AssetItem,
  AssetProjectOption,
  AssetSearchRequest,
  AssetSearchResponse,
  UpdateAssetRequest,
  UpdateAssetResponse
} from '../types'

export const ASSETS_SEARCH_WORKFLOW_ID = 'WF_BO_SIMPLE_SEARCH_ASSETS'
export const ASSET_DETAIL_WORKFLOW_ID = 'WF_BO_GET_ASSET_BY_ID'
export const ASSET_CREATE_WORKFLOW_ID = 'WF_BO_CREATE_ASSET'
export const ASSET_UPDATE_WORKFLOW_ID = 'WF_BO_UPDATE_ASSET'
export const ASSET_DELETE_WORKFLOW_ID = 'WF_BO_DELETE_ASSET'
export const ASSET_PROJECTS_SEARCH_WORKFLOW_ID = 'WF_BO_SIMPLE_SEARCH_PROJECTS'

const emptyAssetResponse: AssetSearchResponse = {
  items: [],
  page_index: 0,
  page_size: 10,
  total_count: 0,
  total_pages: 0,
  has_previous_page: false,
  has_next_page: false
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

const toNumber = (value: any, fallback: number) => {
  const numberValue = Number(value)

  return Number.isFinite(numberValue) ? numberValue : fallback
}

const toNullableNumber = (value: any) => {
  if (value === null || value === undefined || value === '') return null

  if (typeof value === 'string') {
    const trimmed = value.trim()
    const separatorMatch = trimmed.match(/^(\d{1,3})([.,])(\d{6,})$/)

    if (separatorMatch && separatorMatch[3].length % 3 === 0) {
      const groupedNumber = Number(`${separatorMatch[1]}${separatorMatch[3]}`)

      return Number.isFinite(groupedNumber) ? groupedNumber : null
    }
  }

  const numberValue = Number(value)

  return Number.isFinite(numberValue) ? numberValue : null
}

const toBoolean = (value: any) => (
  value === true || value === 1 || value === '1' || value === 'true' || value === 'T' || value === 'Y'
)

const normalizeResponsePage = (value: any, requestPageIndex: number) => {
  const pageIndex = toNumber(value, requestPageIndex + 1)

  return pageIndex <= 0 ? pageIndex + 1 : pageIndex
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

const getWorkflowExecutionId = (response: any): string | undefined => {
  const dataresponse = response?.payload?.dataresponse ?? response?.dataresponse
  const data = dataresponse?.data ?? response?.payload?.data ?? response?.data
  const errors = dataresponse?.errors ?? response?.payload?.errors ?? response?.errors ?? []
  const firstError = Array.isArray(errors) ? errors[0] : undefined
  const executionId = firstError?.execution_id
    ?? firstError?.executionId
    ?? firstError?.execute_id
    ?? dataresponse?.execution_id
    ?? dataresponse?.executionId
    ?? data?.execution_id
    ?? data?.executionId
    ?? response?.payload?.execution_id
    ?? response?.payload?.executionId
    ?? response?.execution_id
    ?? response?.executionId

  return typeof executionId === 'string' && executionId.trim() ? executionId : undefined
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
    throw new AssetWorkflowError(
      getWorkflowErrorMessage(response, fallback),
      getWorkflowExecutionId(response)
    )
  }
}

const mapAsset = (item: any): AssetItem => ({
  id: toNullableNumber(getField(item, ['id', 'asset_id', 'assetId'])),
  asset_code: String(getField(item, ['asset_code', 'assetCode', 'code']) ?? ''),
  project_id: toNumber(getField(item, ['project_id', 'projectId']), 0),
  project_code: String(getField(item, ['project_code', 'projectCode']) ?? ''),
  name: String(getField(item, ['name', 'asset_name', 'assetName']) ?? ''),
  category: String(getField(item, ['category']) ?? ''),
  location: getField(item, ['location']) ? String(getField(item, ['location'])) : null,
  qr_code: getField(item, ['qr_code', 'qrCode']) ? String(getField(item, ['qr_code', 'qrCode'])) : null,
  description: getField(item, ['description']) ? String(getField(item, ['description'])) : null,
  purchase_date: getField(item, ['purchase_date', 'purchaseDate']) ? String(getField(item, ['purchase_date', 'purchaseDate'])) : null,
  purchase_value: toNullableNumber(getField(item, ['purchase_value', 'purchaseValue'])),
  status: String(getField(item, ['status']) ?? '')
})

const mapProjectOption = (item: any): AssetProjectOption | null => {
  const id = toNullableNumber(getField(item, ['id', 'project_id', 'projectId', 'projectid']))

  if (id === null) return null

  const code = String(getField(item, ['project_code', 'projectCode', 'projectcode', 'code']) ?? '').trim()
  const name = String(getField(item, ['project_name', 'projectName', 'projectname', 'name', 'caption']) ?? (code || id)).trim()

  return { id, code, name }
}

const mapProjectOptions = (response: any): AssetProjectOption[] => {
  const root = pickDataRoot(response?.payload ?? response)
  const byId = new Map<number, AssetProjectOption>()

  pickItems(root).forEach(item => {
    const option = mapProjectOption(item)

    if (option) byId.set(option.id, option)
  })

  return Array.from(byId.values())
}

export const mapAssetsSearchResponse = (
  response: any,
  request: AssetSearchRequest
): AssetSearchResponse => {
  const root = pickDataRoot(response?.payload ?? response)
  const total_count = toNumber(getField(root, ['total_count', 'totalCount', 'total_items', 'totalItems']), 0)
  const page_size = toNumber(getField(root, ['page_size', 'pageSize']), request.page_size)
  const total_pages = toNumber(
    getField(root, ['total_pages', 'totalPages']),
    page_size > 0 ? Math.ceil(total_count / page_size) : 0
  )

  return {
    items: pickItems(root).map(mapAsset),
    page_index: normalizeResponsePage(getField(root, ['page_index', 'pageIndex']), request.page_index),
    page_size,
    total_count,
    total_pages,
    has_previous_page: toBoolean(getField(root, ['has_previous_page', 'hasPreviousPage'])),
    has_next_page: toBoolean(getField(root, ['has_next_page', 'hasNextPage']))
  }
}

export const mapAssetDetailResponse = (response: any): AssetItem | null => {
  const root = pickDataRoot(response?.payload ?? response)

  if (!root || typeof root !== 'object') return null

  return mapAsset(root)
}

export const mapUpdateAssetResponse = (response: any): UpdateAssetResponse => {
  const root = pickDataRoot(response?.payload ?? response)

  return {
    id: toNullableNumber(getField(root, ['id'])),
    status: String(getField(root, ['status']) ?? '')
  }
}

export const mapCreateAssetResponse = (response: any): CreateAssetResponse => {
  const root = pickDataRoot(response?.payload ?? response)

  return {
    id: toNullableNumber(getField(root, ['id'])),
    status: String(getField(root, ['status']) ?? '')
  }
}

export const mapDeleteAssetResponse = (response: any): DeleteAssetResponse => {
  const root = pickDataRoot(response?.payload ?? response)

  return {
    id: toNullableNumber(getField(root, ['id'])),
    status: String(getField(root, ['status']) ?? '')
  }
}

export const assetService = {
  getDefaultAssetResponse: (filter?: Partial<AssetFilterModel>): AssetSearchResponse => ({
    ...emptyAssetResponse,
    page_index: filter?.page_index ?? emptyAssetResponse.page_index,
    page_size: filter?.page_size ?? emptyAssetResponse.page_size
  }),

  simpleSearchAssets: async ({
    sessiontoken,
    language,
    filter,
    scope
  }: {
    sessiontoken?: string
    language?: Locale
    filter: AssetFilterModel
    scope?: string
  }): Promise<AssetSearchResponse> => {
    if (!sessiontoken) throw new AssetWorkflowError('Session is required.')

    const request: AssetSearchRequest = {
      page_size: filter.page_size,
      page_index: Math.max(filter.page_index - 1, 0),
      search_text: filter.search_text.trim(),
      project_id: filter.project_id,
      ...(filter.category ? { category: filter.category } : {}),
      ...(filter.status ? { status: filter.status } : {})
    }

    const response = await workflowService.runFODynamic({
      sessiontoken,
      workflowid: ASSETS_SEARCH_WORKFLOW_ID,
      input: request,
      language,
      scope
    })

    assertWorkflowSuccess(response, 'Unable to load assets.')

    return mapAssetsSearchResponse(response, request)
  },

  simpleSearchProjects: async ({
    sessiontoken,
    language,
    search_text = '',
    page_size = 100
  }: {
    sessiontoken?: string
    language?: Locale
    search_text?: string
    page_size?: number
  }): Promise<AssetProjectOption[]> => {
    if (!sessiontoken) return []

    const response = await workflowService.runFODynamic({
      sessiontoken,
      workflowid: ASSET_PROJECTS_SEARCH_WORKFLOW_ID,
      input: {
        search_text,
        page_index: 0,
        page_size
      },
      language
    })

    assertWorkflowSuccess(response, 'Unable to load projects.')

    return mapProjectOptions(response)
  },

  getAssetById: async ({
    sessiontoken,
    language,
    id
  }: {
    sessiontoken?: string
    language?: Locale
    id: number
  }): Promise<AssetItem | null> => {
    if (!sessiontoken || !Number.isInteger(id) || id <= 0) return null

    const request: AssetDetailRequest = { id }

    const response = await workflowService.runFODynamic({
      sessiontoken,
      workflowid: ASSET_DETAIL_WORKFLOW_ID,
      input: request,
      language
    })

    assertWorkflowSuccess(response, 'Unable to load asset detail.')

    return mapAssetDetailResponse(response)
  },

  createAsset: async ({
    sessiontoken,
    language,
    fields
  }: {
    sessiontoken?: string
    language?: Locale
    fields: CreateAssetRequest
  }): Promise<CreateAssetResponse> => {
    if (!sessiontoken) {
      throw new Error('Session is required.')
    }

    const response = await workflowService.runFODynamic({
      sessiontoken,
      workflowid: ASSET_CREATE_WORKFLOW_ID,
      input: fields,
      language
    })

    assertWorkflowSuccess(response, 'Unable to create asset.')

    return mapCreateAssetResponse(response)
  },

  updateAsset: async ({
    sessiontoken,
    language,
    fields
  }: {
    sessiontoken?: string
    language?: Locale
    fields: UpdateAssetRequest
  }): Promise<UpdateAssetResponse> => {
    if (!sessiontoken) {
      throw new Error('Session is required.')
    }

    const response = await workflowService.runFODynamic({
      sessiontoken,
      workflowid: ASSET_UPDATE_WORKFLOW_ID,
      input: fields,
      language
    })

    assertWorkflowSuccess(response, 'Unable to update asset.')

    return mapUpdateAssetResponse(response)
  },

  deleteAsset: async ({
    sessiontoken,
    language,
    fields
  }: {
    sessiontoken?: string
    language?: Locale
    fields: DeleteAssetRequest
  }): Promise<DeleteAssetResponse> => {
    if (!sessiontoken) {
      throw new Error('Session is required.')
    }

    const response = await workflowService.runFODynamic({
      sessiontoken,
      workflowid: ASSET_DELETE_WORKFLOW_ID,
      input: fields,
      language
    })

    assertWorkflowSuccess(response, 'Unable to delete asset.')

    return mapDeleteAssetResponse(response)
  }
}
