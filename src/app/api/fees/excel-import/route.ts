import { NextRequest } from 'next/server'

import { proxyImportValidationRequest } from '../../_lib/importValidationProxy'

const FEE_EXCEL_IMPORT_PATH = '/ips/api/FeeExcelImport/Import'

export async function POST(request: NextRequest) {
  return proxyImportValidationRequest({
    request,
    upstreamPath: FEE_EXCEL_IMPORT_PATH,
    logLabel: '[FeeExcelImport]',
    notConfiguredMessage: 'Fee Excel import endpoint is not configured.',
    parseFailureMessage: 'Unable to parse fee Excel import response.',
    unexpectedErrorMessage: 'Unable to import fee Excel file.',
    validateHeaders: request => request.headers.get('scope')?.trim()
      ? null
      : { message: 'Project scope is required.' },
    buildExtraHeaders: request => ({
      scope: request.headers.get('scope')?.trim() ?? ''
    }),
    validateFormData: formData => {
      const projectId = formData.get('ProjectId')
      const feePeriodId = formData.get('FeePeriodId')
      const duplicatePolicy = formData.get('DuplicatePolicy')
      const file = formData.get('File')
      const hasText = (value: FormDataEntryValue | null) => typeof value === 'string' && value.trim().length > 0

      if (!hasText(projectId)) return { message: 'ProjectId is required.' }
      if (!hasText(feePeriodId)) return { message: 'FeePeriodId is required.' }
      if (duplicatePolicy !== 'SKIP' && duplicatePolicy !== 'UPDATE') return { message: 'DuplicatePolicy is invalid.' }
      if (!(file instanceof File) || file.size === 0) return { message: 'File is required.' }
      return null
    }
  })
}
