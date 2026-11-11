import { NextRequest } from 'next/server'

import { proxyJsonPostRequest } from '../../_lib/importValidationProxy'

const APARTMENT_IMPORT_PATH = '/ips/api/apartments/import'

export async function POST(req: NextRequest) {
    return proxyJsonPostRequest({
        request: req,
        upstreamPath: APARTMENT_IMPORT_PATH,
        logLabel: '[ApartmentImport]',
        notConfiguredMessage: 'Apartment import endpoint is not configured.',
        invalidRequestBodyMessage: 'Invalid apartment import request body.',
        parseFailureMessage: 'Unable to parse apartment import response.',
        unexpectedErrorMessage: 'Unable to import apartments.',
        validateBody: body => {
            const hasProjectId = typeof body?.project_id === 'number'
                ? Number.isFinite(body.project_id)
                : Boolean(body?.project_id)

            return hasProjectId ? null : { message: 'project_id is required.' }
        }
    })
}
