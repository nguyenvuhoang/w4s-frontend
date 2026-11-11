import type { Locale } from '@/configs/i18n'
import { workflowService } from '@/servers/system-service'
import { buildingService } from '@/features/properties/building/buildingService'
import { WorkflowError } from '@/shared/utils/workflowError'

import {
  defaultFormPrintSchema,
  emptyFormDataSchema,
  emptyFormUiSchema,
  type FormPrintSchema,
  type FormTemplateVersionDetail,
  type FormTemplateVersionStatus,
  type FormTemplateVersionSummary
} from './formSchema.types'
import type {
  FormTemplateCreateVersionRequest,
  FormTemplateDetailModel,
  FormTemplateItem,
  FormTemplateProjectOption,
  FormTemplatePublishRequest,
  FormTemplateSaveDraftRequest,
  FormTemplateSearchFilter,
  FormTemplateSearchRequest,
  FormTemplateSearchResponse
} from './types'

export const FORM_TEMPLATES_SEARCH_WORKFLOW_ID = 'WF_BO_SIMPLE_SEARCH_FORM_TEMPLATES'
export const FORM_TEMPLATE_DETAIL_WORKFLOW_ID = 'WF_BO_GET_FORM_TEMPLATE'
export const FORM_TEMPLATE_VERSIONS_WORKFLOW_ID = 'WF_BO_GET_FORM_TEMPLATE_VERSIONS'
export const FORM_TEMPLATE_VERSION_DETAIL_WORKFLOW_ID = 'WF_BO_GET_FORM_TEMPLATE_VERSION'
export const FORM_TEMPLATE_SAVE_DRAFT_WORKFLOW_ID = 'WF_BO_SAVE_FORM_TEMPLATE_DRAFT'
export const FORM_TEMPLATE_PUBLISH_WORKFLOW_ID = 'WF_BO_PUBLISH_FORM_TEMPLATE'
export const FORM_TEMPLATE_CREATE_VERSION_WORKFLOW_ID = 'WF_BO_CREATE_FORM_TEMPLATE_VERSION'

const emptyFormTemplateResponse: FormTemplateSearchResponse = {
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
  const dataresponse = payload?.dataresponse ?? payload?.payload?.dataresponse ?? payload
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
  const numberValue = Number(value)

  return Number.isFinite(numberValue) ? numberValue : fallback
}

const toNullableNumber = (value: unknown) => {
  if (value === null || value === undefined || value === '') return null

  const numberValue = Number(value)

  return Number.isFinite(numberValue) ? numberValue : null
}

const toNullableString = (value: unknown) => {
  if (value === null || value === undefined || value === '') return null

  return String(value)
}

const toBoolean = (value: unknown, fallback = false) => {
  if (value === true || value === 'true' || value === 1 || value === '1') return true
  if (value === false || value === 'false' || value === 0 || value === '0') return false

  return fallback
}

const normalizeResponsePage = (value: unknown, requestPageIndex: number) => {
  const pageIndex = toNumber(value, requestPageIndex + 1)

  return pageIndex <= 0 ? pageIndex + 1 : pageIndex
}

const getExecutionId = (response: any) => {
  const dataresponse = response?.payload?.dataresponse ?? response?.dataresponse ?? response

  return String(
    dataresponse?.execution_id
    ?? dataresponse?.executionId
    ?? response?.payload?.execution_id
    ?? response?.payload?.executionId
    ?? response?.execution_id
    ?? response?.executionId
    ?? ''
  ).trim()
}

const getWorkflowErrorMessage = (response: any, fallback: string, language?: Locale | string) => {
  const dataresponse = response?.payload?.dataresponse ?? response?.dataresponse ?? response
  const errors = dataresponse?.errors ?? response?.payload?.errors ?? response?.errors ?? []
  const message = String(
    (Array.isArray(errors) && errors.length > 0
      ? errors[0]?.info ?? errors[0]?.message ?? errors[0]?.description
      : undefined)
    ?? dataresponse?.message
    ?? dataresponse?.data?.message
    ?? response?.payload?.message
    ?? response?.message
    ?? fallback
  ).trim()
  const executionId = getExecutionId(response)
  const referenceLabel = language === 'vi' ? 'Mã tra cứu lỗi' : 'Error Reference'

  return executionId ? `${message} ${referenceLabel}: ${executionId}` : message
}

const assertWorkflowSuccess = (response: any, fallback: string, language?: Locale | string) => {
  const dataresponse = response?.payload?.dataresponse ?? response?.dataresponse ?? response
  const data = dataresponse?.data ?? response?.payload?.data ?? response?.data
  const errors = dataresponse?.errors ?? response?.payload?.errors ?? response?.errors ?? []
  const failed = response?.success === false
    || dataresponse?.success === false
    || data?.success === false
    || dataresponse?.code === 'failed'
    || data?.code === 'failed'

  if ((Array.isArray(errors) && errors.length > 0) || failed) {
    throw new Error(getWorkflowErrorMessage(response, fallback, language))
  }
}

const mapFormTemplate = (item: any): FormTemplateItem => ({
  id: toNumber(getField(item, ['id']), 0),
  form_code: String(getField(item, ['form_code', 'formCode']) ?? ''),
  project_id: toNumber(getField(item, ['project_id', 'projectId']), 0),
  name: String(getField(item, ['name']) ?? ''),
  description: toNullableString(getField(item, ['description'])),
  template_file_url: toNullableString(getField(item, ['template_file_url', 'templateFileUrl'])),
  schema_json: toNullableString(getField(item, ['schema_json', 'schemaJson'])),
  display_order: toNullableNumber(getField(item, ['display_order', 'displayOrder'])),
  status: String(getField(item, ['status']) ?? '')
})

const isPlainObject = (value: unknown): value is Record<string, any> => (
  Boolean(value) && typeof value === 'object' && !Array.isArray(value)
)

const toFormTemplateVersionStatus = (value: unknown): FormTemplateVersionStatus => {
  const normalized = String(value ?? '').toUpperCase()

  if (normalized === 'PUBLISHED') return 'PUBLISHED'
  if (normalized === 'ARCHIVED') return 'ARCHIVED'

  return 'DRAFT'
}

/** Merge phòng thủ với default: BE có thể trả print_schema thiếu field. */
const mergePrintSchema = (raw: unknown): FormPrintSchema => {
  const base = defaultFormPrintSchema()

  if (!isPlainObject(raw)) return base

  return {
    schema_version: String(raw.schema_version ?? base.schema_version),
    page: { ...base.page, ...(isPlainObject(raw.page) ? raw.page : {}) },
    header: { ...base.header, ...(isPlainObject(raw.header) ? raw.header : {}) },
    footer: { ...base.footer, ...(isPlainObject(raw.footer) ? raw.footer : {}) },
    options: { ...base.options, ...(isPlainObject(raw.options) ? raw.options : {}) }
  }
}

const mapFormTemplateVersionSummary = (item: any): FormTemplateVersionSummary => ({
  id: toNumber(getField(item, ['id']), 0),
  template_id: toNumber(getField(item, ['template_id', 'templateId']), 0),
  version_no: toNumber(getField(item, ['version_no', 'versionNo']), 0),
  schema_version: toNullableString(getField(item, ['schema_version', 'schemaVersion'])),
  status: toFormTemplateVersionStatus(getField(item, ['status'])),
  change_note: toNullableString(getField(item, ['change_note', 'changeNote'])),
  published_by: toNullableString(getField(item, ['published_by', 'publishedBy'])),
  published_on_utc: toNullableString(getField(item, ['published_on_utc', 'publishedOnUtc'])),
  row_version: toNullableString(getField(item, ['row_version', 'rowVersion']))
})

const mapFormTemplateVersionDetail = (item: any): FormTemplateVersionDetail => {
  const summary = mapFormTemplateVersionSummary(item)
  const rawDataSchema = getField(item, ['data_schema', 'dataSchema'])
  const rawUiSchema = getField(item, ['ui_schema', 'uiSchema'])
  const rawPrintSchema = getField(item, ['print_schema', 'printSchema'])

  return {
    ...summary,
    data_schema: isPlainObject(rawDataSchema)
      ? { schema_version: String(rawDataSchema.schema_version ?? '1.0'), fields: Array.isArray(rawDataSchema.fields) ? rawDataSchema.fields : [] }
      : emptyFormDataSchema(),
    ui_schema: isPlainObject(rawUiSchema)
      ? { schema_version: String(rawUiSchema.schema_version ?? '1.0'), components: Array.isArray(rawUiSchema.components) ? rawUiSchema.components : [] }
      : emptyFormUiSchema(),
    print_schema: mergePrintSchema(rawPrintSchema)
  }
}

/** Assertion riêng cho các workflow version: giữ execution_id tách biệt (WorkflowError) thay vì nối vào message, để UI dùng WorkflowErrorAlert. */
const assertVersionWorkflowSuccess = (response: any, fallback: string) => {
  const dataresponse = response?.payload?.dataresponse ?? response?.dataresponse ?? response
  const data = dataresponse?.data ?? response?.payload?.data ?? response?.data
  const errors = dataresponse?.errors ?? response?.payload?.errors ?? response?.errors ?? []
  const failed = response?.success === false
    || dataresponse?.success === false
    || data?.success === false
    || dataresponse?.code === 'failed'
    || data?.code === 'failed'

  if ((Array.isArray(errors) && errors.length > 0) || failed) {
    const firstError = Array.isArray(errors) ? errors[0] : null
    const message = String(
      firstError?.info
      ?? firstError?.message
      ?? firstError?.description
      ?? dataresponse?.message
      ?? data?.message
      ?? response?.payload?.message
      ?? response?.message
      ?? fallback
    ).trim()

    throw new WorkflowError(message, getExecutionId(response), errors)
  }
}

const extractVersionPayload = (response: any): any => {
  const root = pickDataRoot(response?.payload ?? response)
  const raw = getField(root, ['version']) ?? (Array.isArray(root) ? root[0] : root)

  return raw && typeof raw === 'object' ? raw : null
}

const mapFormTemplateDetail = (item: any): FormTemplateDetailModel | null => {
  const id = toNumber(getField(item, ['id']), NaN)

  if (!Number.isFinite(id)) return null

  return mapFormTemplate(item)
}

const mapFormTemplateSearchResponse = (
  response: any,
  request: FormTemplateSearchRequest
): FormTemplateSearchResponse => {
  const root = pickDataRoot(response?.payload ?? response)
  const total_count = toNumber(getField(root, ['total_count', 'totalCount', 'total_items', 'totalItems']), 0)
  const page_size = toNumber(getField(root, ['page_size', 'pageSize']), request.page_size)
  const total_pages = toNumber(
    getField(root, ['total_pages', 'totalPages']),
    page_size > 0 ? Math.ceil(total_count / page_size) : 0
  )

  return {
    items: pickItems(root).map(mapFormTemplate),
    page_index: normalizeResponsePage(getField(root, ['page_index', 'pageIndex']), request.page_index),
    page_size,
    total_count,
    total_pages,
    has_previous_page: toBoolean(getField(root, ['has_previous_page', 'hasPreviousPage'])),
    has_next_page: toBoolean(getField(root, ['has_next_page', 'hasNextPage']))
  }
}

export const formTemplateService = {
  getDefaultFormTemplateResponse: (filter?: Partial<FormTemplateSearchFilter>): FormTemplateSearchResponse => ({
    ...emptyFormTemplateResponse,
    page_index: filter?.page_index ?? emptyFormTemplateResponse.page_index,
    page_size: filter?.page_size ?? emptyFormTemplateResponse.page_size
  }),

  simpleSearchProjects: async ({
    sessiontoken,
    language
  }: {
    sessiontoken?: string
    language?: Locale
  }): Promise<FormTemplateProjectOption[]> => buildingService.simpleSearchProjects({ sessiontoken, language }),

  simpleSearchFormTemplates: async ({
    sessiontoken,
    language,
    filter
  }: {
    sessiontoken?: string
    language?: Locale
    filter: FormTemplateSearchFilter
  }): Promise<FormTemplateSearchResponse> => {
    if (!sessiontoken || !filter.project_id) return formTemplateService.getDefaultFormTemplateResponse(filter)

    const request: FormTemplateSearchRequest = {
      page_size: filter.page_size,
      page_index: Math.max(filter.page_index - 1, 0),
      search_text: filter.search_text.trim(),
      project_id: filter.project_id
    }

    const response = await workflowService.runFODynamic({
      sessiontoken,
      workflowid: FORM_TEMPLATES_SEARCH_WORKFLOW_ID,
      input: request,
      language
    })

    assertWorkflowSuccess(response, 'Unable to load form templates.', language)

    return mapFormTemplateSearchResponse(response, request)
  },

  getFormTemplateById: async ({
    sessiontoken,
    language,
    id
  }: {
    sessiontoken?: string
    language?: Locale
    id: number
  }): Promise<FormTemplateDetailModel | null> => {
    if (!sessiontoken || !id) return null

    const response = await workflowService.runFODynamic({
      sessiontoken,
      workflowid: FORM_TEMPLATE_DETAIL_WORKFLOW_ID,
      input: { form_template_id: id },
      language
    })

    assertWorkflowSuccess(response, 'Unable to load form template detail.', language)

    const root = pickDataRoot(response?.payload ?? response)

    const raw =
      getField(root, ['template', 'form_template', 'formTemplate', 'item'])
      ?? (Array.isArray(root) ? root[0] : root)

    return mapFormTemplateDetail(raw)
  },

  getFormTemplateVersions: async ({
    sessiontoken,
    language,
    template_id
  }: {
    sessiontoken?: string
    language?: Locale
    template_id: number
  }): Promise<FormTemplateVersionSummary[]> => {
    if (!sessiontoken || !Number.isInteger(template_id) || template_id <= 0) return []

    const response = await workflowService.runFODynamic({
      sessiontoken,
      workflowid: FORM_TEMPLATE_VERSIONS_WORKFLOW_ID,
      input: { template_id },
      language
    })

    assertVersionWorkflowSuccess(response, 'Unable to load form template versions.')

    const root = pickDataRoot(response?.payload ?? response)

    return pickItems(root).map(mapFormTemplateVersionSummary)
  },

  getFormTemplateVersion: async ({
    sessiontoken,
    language,
    template_id,
    version_no
  }: {
    sessiontoken?: string
    language?: Locale
    template_id: number
    version_no: number
  }): Promise<FormTemplateVersionDetail | null> => {
    if (
      !sessiontoken
      || !Number.isInteger(template_id) || template_id <= 0
      || !Number.isInteger(version_no) || version_no <= 0
    ) return null

    const response = await workflowService.runFODynamic({
      sessiontoken,
      workflowid: FORM_TEMPLATE_VERSION_DETAIL_WORKFLOW_ID,
      input: { template_id, version_no },
      language
    })

    assertVersionWorkflowSuccess(response, 'Unable to load form template version detail.')

    const raw = extractVersionPayload(response)

    return raw ? mapFormTemplateVersionDetail(raw) : null
  },

  saveFormTemplateDraft: async ({
    sessiontoken,
    language,
    data
  }: {
    sessiontoken?: string
    language?: Locale
    data: FormTemplateSaveDraftRequest
  }): Promise<FormTemplateVersionDetail | null> => {
    if (!sessiontoken || !Number.isInteger(data.template_id) || !Number.isInteger(data.version_id)) {
      throw new Error('Invalid template or version id.')
    }

    const response = await workflowService.runFODynamic({
      sessiontoken,
      workflowid: FORM_TEMPLATE_SAVE_DRAFT_WORKFLOW_ID,
      input: {
        template_id: data.template_id,
        version_id: data.version_id,
        data_schema: data.data_schema,
        ui_schema: data.ui_schema,
        print_schema: data.print_schema,
        change_note: data.change_note ?? ''
      },
      language
    })

    assertVersionWorkflowSuccess(response, 'Unable to save form template draft.')

    const raw = extractVersionPayload(response)

    return raw ? mapFormTemplateVersionDetail(raw) : null
  },

  publishFormTemplate: async ({
    sessiontoken,
    language,
    data
  }: {
    sessiontoken?: string
    language?: Locale
    data: FormTemplatePublishRequest
  }): Promise<FormTemplateVersionDetail | null> => {
    if (!sessiontoken || !Number.isInteger(data.template_id) || !Number.isInteger(data.version_id)) {
      throw new Error('Invalid template or version id.')
    }

    const response = await workflowService.runFODynamic({
      sessiontoken,
      workflowid: FORM_TEMPLATE_PUBLISH_WORKFLOW_ID,
      input: { template_id: data.template_id, version_id: data.version_id },
      language
    })

    assertVersionWorkflowSuccess(response, 'Unable to publish form template.')

    const raw = extractVersionPayload(response)

    return raw ? mapFormTemplateVersionDetail(raw) : null
  },

  createFormTemplateVersion: async ({
    sessiontoken,
    language,
    data
  }: {
    sessiontoken?: string
    language?: Locale
    data: FormTemplateCreateVersionRequest
  }): Promise<FormTemplateVersionDetail | null> => {
    const hasSourceVersion = data.source_version_id !== null && data.source_version_id !== undefined

    if (!sessiontoken || !Number.isInteger(data.template_id) || (hasSourceVersion && !Number.isInteger(data.source_version_id))) {
      throw new Error('Invalid template or source version id.')
    }

    const response = await workflowService.runFODynamic({
      sessiontoken,
      workflowid: FORM_TEMPLATE_CREATE_VERSION_WORKFLOW_ID,
      // Không có source_version_id (tạo version đầu tiên): bỏ hẳn field thay vì gửi giá trị giả (null/1).
      input: hasSourceVersion
        ? { template_id: data.template_id, source_version_id: data.source_version_id, change_note: data.change_note ?? '' }
        : { template_id: data.template_id, change_note: data.change_note ?? '' },
      language
    })

    assertVersionWorkflowSuccess(response, 'Unable to create new form template version.')

    const raw = extractVersionPayload(response)

    return raw ? mapFormTemplateVersionDetail(raw) : null
  }
}
