import { NextRequest } from 'next/server'

import { proxyImportValidationRequest } from '../../../_lib/importValidationProxy'

const FEE_EXCEL_VALIDATE_PATH = '/ips/api/FeeExcelImport/Validate'

export async function POST(request: NextRequest) {
  return proxyImportValidationRequest({
    request,
    upstreamPath: FEE_EXCEL_VALIDATE_PATH,
    logLabel: '[FeeExcelValidate]',
    notConfiguredMessage: 'Fee Excel validate endpoint is not configured.',
    parseFailureMessage: 'Unable to parse fee Excel validation response.',
    unexpectedErrorMessage: 'Unable to validate fee Excel file.',
    validateHeaders: request => request.headers.get('scope')?.trim()
      ? null
      : { message: 'Project scope is required.' },
    buildExtraHeaders: request => ({
      scope: request.headers.get('scope')?.trim() ?? ''
    }),
    validateFormData: formData => {
      const projectId = formData.get('ProjectId')
      const file = formData.get('File')
      if (typeof projectId !== 'string' || !projectId.trim()) return { message: 'ProjectId is required.' }
      if (!(file instanceof File) || file.size === 0) return { message: 'File is required.' }
      return null
    }
  })
}
