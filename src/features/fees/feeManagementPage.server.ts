import 'server-only'

import { feeService } from './service'
import type { FeeInvoiceFilterModel, FeeInvoiceSearchResponse, FeePeriodItem, FeePeriodOverview, FeeWorkflowError } from './types'

const emptyOverview: FeePeriodOverview = { total_amount: null, paid_amount: null, remaining_amount: null, total_surplus_amount: null, paid_apartments: null, total_apartments: null }

export async function loadFeeManagementInitialData({ sessiontoken, language, filter }: { sessiontoken?: string; language: any; filter: FeeInvoiceFilterModel }) {
  let invoiceData: FeeInvoiceSearchResponse = feeService.getDefaultFeeInvoiceResponse(filter)
  let invoiceError: FeeWorkflowError | null = null
  let periods: FeePeriodItem[] = []
  let selectedPeriodId: number | null = null
  let overview = emptyOverview
  let overviewError: FeeWorkflowError | null = null
  // Project scope is supplied by the client Project Context.  Do not issue an unscoped server
  // request during hydration; the client loads periods, overview, and invoices once the scope is READY.
  return { invoiceData, invoiceError, periods, selectedPeriodId, overview, overviewError }
}
