export type WorkflowErrorDetail = {
  workflowId?: string
  errorCode?: string
  message: string
  executionId?: string
  timestamp?: string
  errors?: unknown[]
}

export type WorkflowErrorPresentation = {
  message: string
  workflowStep?: string
  errorCode?: string
  executionId?: string
  technicalDetails?: string
}

type WorkflowErrorOptions = {
  fallback?: string
  workflowId?: string
}

const normalizeText = (value: unknown) => {
  if (typeof value !== 'string') return ''

  return value.trim()
}

const normalizeRecordKey = (key: string) => key.toLowerCase().replace(/[_\-\s]/g, '')

const readField = (value: unknown, keys: string[]) => {
  if (!value || typeof value !== 'object') return undefined

  const record = value as Record<string, unknown>

  for (const key of keys) {
    const direct = record[key]

    if (direct !== undefined && direct !== null && direct !== '') {
      return direct
    }
  }

  const normalizedMap = Object.keys(record).reduce<Record<string, unknown>>((acc, key) => {
    acc[normalizeRecordKey(key)] = record[key]

    return acc
  }, {})

  for (const key of keys) {
    const normalized = normalizedMap[normalizeRecordKey(key)]

    if (normalized !== undefined && normalized !== null && normalized !== '') {
      return normalized
    }
  }

  return undefined
}

const toResponseRoot = (value: unknown) => {
  if (!value || typeof value !== 'object') return value

  const record = value as Record<string, unknown>
  const payload = readField(record, ['payload'])
  const payloadRecord = payload && typeof payload === 'object' ? payload as Record<string, unknown> : undefined
  const dataresponse = readField(record, ['dataresponse']) ?? readField(payloadRecord, ['dataresponse'])

  return dataresponse && typeof dataresponse === 'object' ? dataresponse : record
}

const getWorkflowErrors = (value: unknown): unknown[] => {
  const root = toResponseRoot(value)
  const errors = readField(root, ['errors'])

  return Array.isArray(errors) ? errors : []
}

const parseLegacyWorkflowMessage = (value: string) => {
  const match = value.match(/^\s*\[([^\]]+)\]\s*(?:\[([^\]]+)\]\s*)?([\s\S]*)$/)

  if (!match) {
    return { message: value.trim() }
  }

  return {
    workflowId: normalizeText(match[1]) || undefined,
    errorCode: normalizeText(match[2]) || undefined,
    message: normalizeText(match[3]) || value.trim()
  }
}

const pickErrorMessage = (value: unknown) => {
  const raw = normalizeText(
    readField(value, ['info', 'message', 'description', 'detail', 'error'])
  )

  if (!raw) return ''

  return parseLegacyWorkflowMessage(raw).message
}

const pickWorkflowId = (value: unknown) => normalizeText(
  readField(value, ['workflowId', 'workflow_id', 'workflowid', 'workflow_code', 'workflowCode', 'step_code', 'stepCode'])
)

const pickErrorCode = (value: unknown) => normalizeText(
  readField(value, ['errorCode', 'error_code', 'code'])
)

const pickExecutionId = (value: unknown) => normalizeText(
  readField(value, ['executionId', 'execution_id', 'execute_id', 'executionid'])
)

const pickTimestamp = (value: unknown) => normalizeText(
  readField(value, ['timestamp', 'time_stamp', 'timeStamp', 'created_at', 'createdAt'])
)

export class WorkflowError extends Error {
  execution_id: string
  executionId: string
  workflowId?: string
  errorCode?: string
  timestamp?: string
  errors: unknown[]
  detail: WorkflowErrorDetail

  constructor(
    messageOrDetail: string | WorkflowErrorDetail,
    execution_id = '',
    errors: unknown[] = [],
    detailOverrides: Partial<WorkflowErrorDetail> = {}
  ) {
    const normalizedDetail = typeof messageOrDetail === 'string'
      ? normalizeWorkflowErrorDetail({
        message: messageOrDetail,
        execution_id,
        errors,
        ...detailOverrides
      })
      : normalizeWorkflowErrorDetail({
        ...messageOrDetail,
        execution_id: messageOrDetail.executionId ?? execution_id,
        errors: messageOrDetail.errors ?? errors,
        ...detailOverrides
      })

    super(normalizedDetail.message)
    this.name = 'WorkflowError'
    this.execution_id = normalizedDetail.executionId ?? ''
    this.executionId = this.execution_id
    this.workflowId = normalizedDetail.workflowId
    this.errorCode = normalizedDetail.errorCode
    this.timestamp = normalizedDetail.timestamp
    this.errors = normalizedDetail.errors ?? []
    this.detail = normalizedDetail
  }
}

export const normalizeWorkflowErrorDetail = (
  value: unknown,
  options: WorkflowErrorOptions = {}
): WorkflowErrorDetail => {
  if (value instanceof WorkflowError) {
    return {
      ...value.detail,
      message: value.detail.message || options.fallback || value.message || 'Unexpected workflow error.'
    }
  }

  const errors = getWorkflowErrors(value)
  const firstError = errors[0]
  const firstErrorRawMessage = normalizeText(
    readField(firstError, ['info', 'message', 'description', 'detail', 'error'])
  )
  const errorMessages = errors
    .map(item => pickErrorMessage(item))
    .filter(Boolean)

  const root = toResponseRoot(value)
  const rootMessage = normalizeText(
    readField(root, ['message', 'detail', 'error'])
    ?? readField(value, ['message', 'detail', 'error'])
  )
  const parsedRootMessage = rootMessage ? parseLegacyWorkflowMessage(rootMessage) : null
  const parsedFirstError = firstErrorRawMessage ? parseLegacyWorkflowMessage(firstErrorRawMessage) : null

  const message = errorMessages.length > 0
    ? Array.from(new Set(errorMessages)).join('\n')
    : parsedRootMessage?.message
      || (value instanceof Error ? normalizeText(value.message) : '')
      || options.fallback
      || 'Unexpected workflow error.'

  const workflowId = pickWorkflowId(firstError)
    || pickWorkflowId(root)
    || parsedFirstError?.workflowId
    || parsedRootMessage?.workflowId
    || options.workflowId
    || undefined

  const errorCode = pickErrorCode(firstError)
    || pickErrorCode(root)
    || parsedFirstError?.errorCode
    || parsedRootMessage?.errorCode
    || undefined

  const executionId = pickExecutionId(firstError)
    || pickExecutionId(root)
    || pickExecutionId(value)
    || undefined

  const timestamp = pickTimestamp(firstError)
    || pickTimestamp(root)
    || pickTimestamp(value)
    || undefined

  return {
    workflowId,
    errorCode,
    message,
    executionId,
    timestamp,
    errors: errors.length > 0 ? errors : undefined
  }
}

export const createWorkflowError = (
  value: unknown,
  options: WorkflowErrorOptions = {}
) => {
  const detail = normalizeWorkflowErrorDetail(value, options)

  return new WorkflowError(detail)
}

export const getWorkflowExecutionId = (response: unknown): string => (
  normalizeWorkflowErrorDetail(response).executionId ?? ''
)

/**
 * Separates a workflow error into a user-facing message and optional technical details.
 * The parser accepts the legacy `[STEP] [ERROR] message` prefix and common error-reference labels.
 */
export const getWorkflowErrorPresentation = (
  value: unknown,
  fallback = 'Unexpected workflow error.'
): WorkflowErrorPresentation => {
  const detail = normalizeWorkflowErrorDetail(value, { fallback })
  const rawMessage = detail.message || fallback
  const referenceMatch = rawMessage.match(/(?:Mã tra cứu lỗi|Mã lỗi|Error Reference|Execution ID)\s*:\s*([^\s]+)/i)
  const messageWithoutReference = rawMessage.replace(/(?:Mã tra cứu lỗi|Mã lỗi|Error Reference|Execution ID)\s*:\s*[^\s]+/gi, '').trim()
  const technicalStart = messageWithoutReference.search(/\n\s*(?:Mapping types|Technical details?)\s*:/i)
  const message = (technicalStart >= 0 ? messageWithoutReference.slice(0, technicalStart) : messageWithoutReference).trim() || fallback
  const technicalDetails = technicalStart >= 0
    ? messageWithoutReference.slice(technicalStart).trim()
    : undefined

  return {
    message,
    workflowStep: detail.workflowId,
    errorCode: detail.errorCode,
    executionId: detail.executionId ?? referenceMatch?.[1],
    technicalDetails
  }
}
