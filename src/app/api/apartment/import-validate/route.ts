import { NextRequest } from 'next/server'

import { proxyImportValidationRequest } from '../../_lib/importValidationProxy'

const APARTMENT_IMPORT_VALIDATE_PATH = '/ips/api/apartmentimport/validate'

export async function POST(req: NextRequest) {
    return proxyImportValidationRequest({
        request: req,
        upstreamPath: APARTMENT_IMPORT_VALIDATE_PATH,
        logLabel: '[ApartmentImportValidate]',
        notConfiguredMessage: 'Apartment import validate endpoint is not configured.',
        parseFailureMessage: 'Unable to parse apartment import validation response.',
        unexpectedErrorMessage: 'Unable to validate apartment import file.',
        validateFormData: formData => {
            // Field name mirrors the confirmed /api/fees/import-validate (-> feeexcelimport/validate)
            // contract, which binds the backend DTO's `ProjectId` in PascalCase — see
            // generateFeeService.ts. apartmentimport/validate is assumed to follow the same DTO
            // convention; adjust here if the real backend contract turns out to differ.
            const projectId = formData.get('ProjectId')
            const hasProjectId = typeof projectId === 'string' ? projectId.trim().length > 0 : Boolean(projectId)

            return hasProjectId ? null : { message: 'ProjectId is required.' }
        }
    })
}
