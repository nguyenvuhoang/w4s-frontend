import { NextRequest } from 'next/server'

import { proxyJsonPostRequest } from '../../_lib/importValidationProxy'

const FEE_INVOICES_IMPORT_PATH = '/ips/api/fee-invoices/import'

export async function POST(req: NextRequest) {
    return proxyJsonPostRequest({
        request: req,
        upstreamPath: FEE_INVOICES_IMPORT_PATH,
        logLabel: '[FeeInvoicesImport]',
        notConfiguredMessage: 'Fee invoices import endpoint is not configured.',
        invalidRequestBodyMessage: 'Invalid fee invoices import request body.',
        parseFailureMessage: 'Unable to parse fee invoices import response.',
        unexpectedErrorMessage: 'Unable to import fee invoices.',
        validateHeaders: request => request.headers.get('scope')?.trim()
            ? null
            : { message: 'Project scope is required.' },
        buildExtraHeaders: request => ({
            scope: request.headers.get('scope')?.trim() ?? ''
        }),
        validateBody: body => {
            const hasProjectId = typeof body?.project_id === 'number'
                ? Number.isFinite(body.project_id)
                : Boolean(body?.project_id)

            return hasProjectId ? null : { message: 'project_id is required.' }
        }
    })
}
