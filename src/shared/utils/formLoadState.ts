type WorkflowError = {
  key?: string
  info?: string
  message?: string
  code?: string
  executionId?: string
  execute_id?: string
  execution_id?: string
}

export type FormLoadState =
  | { type: 'success'; data: any }
  | { type: 'under-development'; errorDetails?: string; executionId?: string }
  | { type: 'error'; errorDetails?: string; executionId?: string }

const missingFormPatterns = [
  'failed to load form info',
  'form not found',
  'form info not found',
  'form information not found',
  'form does not exist',
  'form is not configured',
  'form not configured',
  'missing form',
  'no data',
  'form not exist',
  'form does not configured',
  'chua khai bao form',
  'chua cau hinh form',
  'khong tim thay form'
]

const normalizeText = (value: unknown) =>
  String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()

const getErrors = (dataresponse: any): WorkflowError[] => {
  const errors = dataresponse?.errors ?? dataresponse?.error

  return Array.isArray(errors) ? errors : []
}

const getErrorMessage = (error?: WorkflowError) =>
  error?.info || error?.message || error?.code

const getExecutionId = (error?: WorkflowError) =>
  error?.executionId || error?.execution_id || error?.execute_id || ''

const getResponseMessage = (dataresponse: any) =>
  [
    dataresponse?.message,
    dataresponse?.error_message,
    dataresponse?.description,
    dataresponse?.info,
    dataresponse?.code
  ]
    .filter(Boolean)
    .join(' ')

const isMissingFormLoadError = (apiResponse: any, errors: WorkflowError[]) => {
  const dataresponse = apiResponse?.payload?.dataresponse
  const messages = [
    getResponseMessage(dataresponse),
    ...errors.map(error => getErrorMessage(error))
  ]
    .filter(Boolean)
    .map(message => normalizeText(message))

  return messages.some(message =>
    missingFormPatterns.some(pattern => message.includes(normalizeText(pattern)))
  )
}

const hasValidFormData = (apiResponse: any) => {
  const formData = apiResponse?.payload?.dataresponse?.data?.data

  return Boolean(formData?.form_design_detail)
}

const SYSTEM_FORM_MISSING_CODE = 'SYS_03_001'

const equalsSystemFormMissingCode = (value?: unknown) =>
  String(value ?? '').trim().toUpperCase() === SYSTEM_FORM_MISSING_CODE

const includesSystemFormMissingCode = (value?: unknown) =>
  String(value ?? '').toUpperCase().includes(SYSTEM_FORM_MISSING_CODE)

// SYS_03_001 means "form/screen not configured on the backend yet" (this screen is genuinely
// under development). Different backend calls surface it in different fields — some only set
// `code`, some only `key`, some only `info`, some fold it into a free-text `message` — so this
// checks every field individually instead of requiring all of them to agree, otherwise a valid
// SYS_03_001 response silently falls through to the generic PageError branch below.
const isSystemFormMissingError = (apiResponse: any, errors: WorkflowError[]) => {
  const dataresponse = apiResponse?.payload?.dataresponse
  const hasResponseLevelMatch =
    includesSystemFormMissingCode(dataresponse?.code) ||
    includesSystemFormMissingCode(getResponseMessage(dataresponse))

  const hasSystemFormError =
    hasResponseLevelMatch ||
    errors.some(error =>
      equalsSystemFormMissingCode(error?.code) ||
      equalsSystemFormMissingCode(error?.key) ||
      equalsSystemFormMissingCode(error?.info) ||
      includesSystemFormMissingCode(error?.message)
    )

  return hasSystemFormError && !hasValidFormData(apiResponse)
}

export const getFormLoadState = (apiResponse: any): FormLoadState => {
  if (!apiResponse) {
    return { type: 'error', errorDetails: 'No response from form service' }
  }

  const dataresponse = apiResponse.payload?.dataresponse
  const errors = [...getErrors(dataresponse), ...getErrors(apiResponse.payload)]
  const firstError = errors[0]

  if (isSystemFormMissingError(apiResponse, errors)) {
    return {
      type: 'under-development',
      errorDetails: 'Feature is under development',
      executionId: getExecutionId(firstError)
    }
  }

  if (isMissingFormLoadError(apiResponse, errors)) {
    return {
      type: 'under-development',
      errorDetails:
        getErrorMessage(firstError) ||
        apiResponse.payload?.message ||
        getResponseMessage(dataresponse) ||
        'Feature is under development',
      executionId: getExecutionId(firstError)
    }
  }

  if (apiResponse.status !== 200) {
    return {
      type: 'error',
      errorDetails: getErrorMessage(firstError) || apiResponse.payload?.message || 'Failed to load form info',
      executionId: getExecutionId(firstError)
    }
  }

  if (errors.length > 0) {
    return {
      type: 'error',
      errorDetails: getErrorMessage(firstError) || 'Failed to load form info',
      executionId: getExecutionId(firstError)
    }
  }

  const formData = dataresponse?.data?.data
  const formDesignDetail = formData?.form_design_detail

  if (!formData || !formDesignDetail) {
    const responseMessage = getResponseMessage(dataresponse)

    if (dataresponse?.success === false && responseMessage) {
      return {
        type: 'error',
        errorDetails: responseMessage
      }
    }

    return { type: 'under-development' }
  }

  return { type: 'success', data: formData }
}
