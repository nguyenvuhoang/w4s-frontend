import type { Locale } from '@/configs/i18n'
import { workflowService } from '@/servers/system-service'
import { createWorkflowError } from '@/shared/utils/workflowError'

import { mapFeeImportDetail, mapFeeImportDetailRows, mapFeeImportSearch } from './feeImportWorkflow.mapper'
import type { FeeImportFilter, FeeImportMutationResult } from './feeImportWorkflow.types'

export const FEE_IMPORT_WORKFLOWS = { simple: 'WF_BO_SIMPLE_SEARCH_FEE_IMPORTS', advanced: 'WF_BO_ADVANCED_SEARCH_FEE_IMPORT', detail: 'WF_BO_GET_FEE_IMPORT_BY_ID', details: 'WF_BO_SEARCH_FEE_IMPORT_DETAILS', create: 'WF_BO_CREATE_FEE_IMPORT', update: 'WF_BO_UPDATE_FEE_IMPORT', remove: 'WF_BO_DELETE_FEE_IMPORT', accept: 'WF_BO_ACCEPT_FEE_IMPORT_NOTIFICATION' } as const
const ensureSuccess = (response: any, workflowId: string, fallback: string) => { const data = response?.payload?.dataresponse ?? response?.dataresponse ?? response; if (response?.success === false || data?.success === false || (Array.isArray(data?.errors) && data.errors.length)) throw createWorkflowError(response, { workflowId, fallback }) }
const validScope = (scope: string | undefined) => {
  const normalized = scope?.trim()
  if (!normalized || normalized === 'undefined' || normalized === 'null') throw new Error('Working project scope is required.')
  return normalized
}
const run = async (sessiontoken: string | undefined, language: Locale | string, scope: string | undefined, workflowid: string, input: Record<string, unknown>) => { if (!sessiontoken) throw new Error('Session is required.'); const response = await workflowService.runFODynamic({ sessiontoken, workflowid, input, language: language as Locale, scope: validScope(scope) }); ensureSuccess(response, workflowid, 'Unable to complete fee import request.'); return response }
const mutation = (response: any): FeeImportMutationResult => { const source = response?.payload?.dataresponse?.data?.data ?? response?.payload?.dataresponse?.data ?? response?.data ?? response; return { id: Number(source?.fee_import_id ?? source?.id ?? source?.feeImportId) || null } }
const data = (response: any) => response?.payload?.dataresponse?.data?.data ?? response?.payload?.dataresponse?.data ?? response?.data?.data ?? response?.data ?? response
export const feeImportWorkflowService = {
  search: async ({ sessiontoken, language, scope, filter }: { sessiontoken?: string; language: Locale | string; scope?: string; filter: FeeImportFilter }) => { const workflowid = filter.status ? FEE_IMPORT_WORKFLOWS.advanced : FEE_IMPORT_WORKFLOWS.simple; const input = { project_id: filter.project_id, search_text: filter.search_text.trim(), page_index: filter.page_index, page_size: filter.page_size, ...(filter.status ? { status: filter.status } : {}) }; return mapFeeImportSearch(await run(sessiontoken, language, scope, workflowid, input), filter) },
  get: async ({ sessiontoken, language, scope, id }: { sessiontoken?: string; language: Locale | string; scope?: string; id: number }) => mapFeeImportDetail(data(await run(sessiontoken, language, scope, FEE_IMPORT_WORKFLOWS.detail, { id }))),
  details: async ({ sessiontoken, language, scope, filter, fee_import_id, system_status }: { sessiontoken?: string; language: Locale | string; scope?: string; filter: FeeImportFilter; fee_import_id: number; system_status: string }) => mapFeeImportDetailRows(await run(sessiontoken, language, scope, FEE_IMPORT_WORKFLOWS.details, { project_id: filter.project_id, fee_import_id, system_status: system_status || undefined, search_text: filter.search_text, page_index: filter.page_index, page_size: filter.page_size }), filter),
  create: async (sessiontoken: string | undefined, language: Locale | string, scope: string | undefined, fields: Record<string, unknown>) => mutation(await run(sessiontoken, language, scope, FEE_IMPORT_WORKFLOWS.create, fields)),
  update: async (sessiontoken: string | undefined, language: Locale | string, scope: string | undefined, fields: Record<string, unknown>) => mutation(await run(sessiontoken, language, scope, FEE_IMPORT_WORKFLOWS.update, fields)),
  remove: async (sessiontoken: string | undefined, language: Locale | string, scope: string | undefined, id: number) => mutation(await run(sessiontoken, language, scope, FEE_IMPORT_WORKFLOWS.remove, { id })),
  accept: async (sessiontoken: string | undefined, language: Locale | string, scope: string | undefined, project_id: number, fee_import_id: number) => mutation(await run(sessiontoken, language, scope, FEE_IMPORT_WORKFLOWS.accept, { project_id, fee_import_id }))
}
