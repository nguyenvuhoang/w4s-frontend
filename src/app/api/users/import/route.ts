import { NextRequest } from 'next/server'

import { proxyJsonPostRequest } from '../../_lib/importValidationProxy'

// Backend user-management import endpoint. This is NOT the same controller as
// import-validate/import-template (/cth/api/userexcelimport/...): this one lives at
// /cth/api/users/import and takes the already-validated rows as plain JSON — it does not
// re-parse an Excel file, so no multipart/form-data here. Confirmed directly against the
// backend: POST /cth/api/users/import with { duplicate_policy, users } returns HTTP 200.
const STAFF_IMPORT_PATH = '/cth/api/users/import'

export async function POST(request: NextRequest) {
    return proxyJsonPostRequest({
        request,
        upstreamPath: STAFF_IMPORT_PATH,
        logLabel: '[StaffImport]',
        notConfiguredMessage: 'Staff import endpoint is not configured.',
        invalidRequestBodyMessage: 'Invalid staff import request body.',
        parseFailureMessage: 'Unable to parse staff import response.',
        unexpectedErrorMessage: 'Unable to import staff.',
        validateBody: body => Array.isArray(body?.users) && body.users.length > 0 && (body?.duplicate_policy === 'Update' || body?.duplicate_policy === 'Create')
            ? null
            : { message: 'duplicate_policy and at least one validated user are required.' }
    })
}
