import { NextRequest } from 'next/server'

import { proxyImportValidationRequest } from '../../_lib/importValidationProxy'

const RESIDENT_IMPORT_VALIDATE_PATH = '/ips/api/residentexcelimport/validate'

export async function POST(req: NextRequest) {
    return proxyImportValidationRequest({
        request: req,
        upstreamPath: RESIDENT_IMPORT_VALIDATE_PATH,
        logLabel: '[ResidentImportValidate]',
        notConfiguredMessage: 'Resident import validate endpoint is not configured.',
        parseFailureMessage: 'Unable to parse resident import validation response.',
        unexpectedErrorMessage: 'Unable to validate resident import file.',
        validateHeaders: request => {
            const projectCode = request.headers.get('scope')?.trim()

            return projectCode ? null : { message: 'Project scope is required.' }
        },
        buildExtraHeaders: request => ({
            scope: request.headers.get('scope')?.trim() ?? ''
        })
    })
}
