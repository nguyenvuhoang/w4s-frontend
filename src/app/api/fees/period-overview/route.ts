import { NextRequest } from 'next/server'

import { proxyJsonPostRequest } from '../../_lib/importValidationProxy'

const FEE_PERIOD_OVERVIEW_PATH = '/ips/api/fee-invoices/period-overview'

export async function POST(request: NextRequest) {
  return proxyJsonPostRequest({
    request,
    upstreamPath: FEE_PERIOD_OVERVIEW_PATH,
    logLabel: '[FeePeriodOverview]',
    notConfiguredMessage: 'Fee period overview endpoint is not configured.',
    invalidRequestBodyMessage: 'Invalid fee period overview request body.',
    parseFailureMessage: 'Unable to parse fee period overview response.',
    unexpectedErrorMessage: 'Unable to load fee period overview.',
    validateBody: body => Number.isInteger(Number(body?.project_id)) && Number.isInteger(Number(body?.period_id)) ? null : { message: 'project_id and period_id are required.' }
  })
}
