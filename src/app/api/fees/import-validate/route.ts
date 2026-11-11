import { NextRequest } from 'next/server'

import { proxyImportValidationRequest } from '../../_lib/importValidationProxy'

const FEE_IMPORT_VALIDATE_PATH = '/ips/api/feeexcelimport/validate'

export async function POST(req: NextRequest) {
    return proxyImportValidationRequest({
        request: req,
        upstreamPath: FEE_IMPORT_VALIDATE_PATH,
        logLabel: '[FeeImportValidate]',
        notConfiguredMessage: 'Fee import validate endpoint is not configured.',
        parseFailureMessage: 'Unable to parse fee import validation response.',
        unexpectedErrorMessage: 'Unable to validate fee import file.',
        validateHeaders: request => request.headers.get('scope')?.trim()
            ? null
            : { message: 'Project scope is required.' },
        buildExtraHeaders: request => ({
            scope: request.headers.get('scope')?.trim() ?? ''
        }),
        validateFormData: formData => {
            // Field name must match the backend DTO's `ProjectId` exactly (PascalCase) — see
            // generateFeeService.ts for why "project_id" fails to bind there.
            const projectId = formData.get('ProjectId')
            const hasProjectId = typeof projectId === 'string' ? projectId.trim().length > 0 : Boolean(projectId)

            return hasProjectId ? null : { message: 'ProjectId is required.' }
        }
    })
}
