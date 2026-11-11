'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import { normalizeWorkflowErrorDetail, type WorkflowErrorDetail } from '@/shared/utils/workflowError'

import { FEE_INVOICE_PERIODS_SEARCH_WORKFLOW_ID, feeService } from '../service'
import type { FeeInvoiceItem, FeeNotificationTemplateOption, FeePeriodItem, FeePeriodOverview } from '../types'

const emptyOverview: FeePeriodOverview = { total_amount: null, paid_amount: null, remaining_amount: null, total_surplus_amount: null, paid_apartments: null, total_apartments: null }

type Params = { sessiontoken?: string; language: any; projectId: number | null; projectScope?: string | null; onRefresh: () => Promise<unknown> | void; initialProjectId: number | null; initialPeriods: FeePeriodItem[]; initialPeriodId: number | null; initialOverview: FeePeriodOverview; initialOverviewError?: WorkflowErrorDetail | null }

export function useFeeManagementOperations({ sessiontoken, language, projectId, projectScope, onRefresh, initialProjectId, initialPeriods, initialPeriodId, initialOverview, initialOverviewError = null }: Params) {
  const hydratedInitial = useRef(false)
  const skipInitialOverview = useRef(true)
  const [periods, setPeriods] = useState<FeePeriodItem[]>(initialPeriods)
  const [periodId, setPeriodId] = useState<number | null>(initialPeriodId)
  const [overview, setOverview] = useState<FeePeriodOverview>(initialOverview)
  const [overviewLoading, setOverviewLoading] = useState(false)
  const [overviewError, setOverviewError] = useState<WorkflowErrorDetail | null>(initialOverviewError)
  const [templates, setTemplates] = useState<FeeNotificationTemplateOption[]>([])
  const [templatesLoading, setTemplatesLoading] = useState(false)
  const [templatesError, setTemplatesError] = useState<WorkflowErrorDetail | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const preserveInitialPeriod = !hydratedInitial.current && projectId === initialProjectId
    hydratedInitial.current = true
    if (!preserveInitialPeriod) setPeriodId(null)
    setPeriods([])
    setOverview(emptyOverview)
    if (!projectId || !projectScope || !sessiontoken) return
    void (async () => {
      const baseFilter = { search_text: '', project_id: projectId, year: null, month: null, status: '', page_index: 1, page_size: 100 }
      const first = await feeService.searchFeePeriods({ sessiontoken, language, scope: projectScope, workflowId: FEE_INVOICE_PERIODS_SEARCH_WORKFLOW_ID, filter: baseFilter })
      const all = [...first.items]
      for (let page = 2; page <= first.total_pages; page += 1) {
        const response = await feeService.searchFeePeriods({ sessiontoken, language, scope: projectScope, workflowId: FEE_INVOICE_PERIODS_SEARCH_WORKFLOW_ID, filter: { ...baseFilter, page_index: page } })
        all.push(...response.items)
      }
      return all
    })()
      .then(items => {
        const loaded = items.filter(item => item.id !== null)
        setPeriods(loaded)
        setPeriodId(current => current !== null && loaded.some(item => item.id === current) ? current : null)
      })
      .catch(() => setPeriods([]))
  }, [initialProjectId, language, projectId, projectScope, sessiontoken])

  useEffect(() => {
    if (!projectId || !periodId) return
    if (skipInitialOverview.current && projectId === initialProjectId && periodId === initialPeriodId) {
      skipInitialOverview.current = false
      return
    }
    skipInitialOverview.current = false
    setOverviewLoading(true)
    setOverviewError(null)
    void feeService.getFeePeriodOverview({ projectId, periodId, language })
      .then(setOverview)
      .catch(error => setOverviewError(normalizeWorkflowErrorDetail(error, { fallback: 'Unable to load fee period overview.' })))
      .finally(() => setOverviewLoading(false))
  }, [language, periodId, projectId])

  const refresh = useCallback(async () => {
    await onRefresh()
    if (projectId && periodId) {
      setOverviewLoading(true)
      try { setOverview(await feeService.getFeePeriodOverview({ projectId, periodId, language })) }
      catch (error) { setOverviewError(normalizeWorkflowErrorDetail(error, { fallback: 'Unable to load fee period overview.' })) }
      finally { setOverviewLoading(false) }
    }
  }, [language, onRefresh, periodId, projectId])

  const loadTemplates = useCallback(async () => {
    if (templates.length || templatesLoading) return
    setTemplatesLoading(true)
    setTemplatesError(null)
    try { setTemplates(await feeService.searchFeeNotificationTemplates({ sessiontoken, language, scope: projectScope ?? undefined })) }
    catch (error) { setTemplatesError(normalizeWorkflowErrorDetail(error, { fallback: 'Unable to load notification templates.' })) }
    finally { setTemplatesLoading(false) }
  }, [language, projectScope, sessiontoken, templates.length, templatesLoading])

  const toggleVisibility = useCallback(async (row: FeeInvoiceItem, value: boolean) => {
    if (!row.id || !row.fee_period_id || !projectId || !projectScope || row.project_id !== projectId) return
    setSubmitting(true)
    try { await feeService.toggleFeeVisibility({ sessiontoken, language, scope: projectScope, invoiceIds: [row.id], feePeriodId: row.fee_period_id, isShowToResident: value }); await refresh() }
    finally { setSubmitting(false) }
  }, [language, projectId, projectScope, refresh, sessiontoken])

  const toggleActive = useCallback(async (row: FeeInvoiceItem, value: boolean) => {
    if (!row.id || !projectId || !projectScope || row.project_id !== projectId) return
    setSubmitting(true)
    try { await feeService.toggleFeeActiveStatus({ sessiontoken, language, scope: projectScope, invoiceIds: [row.id], isActive: value }); await refresh() }
    finally { setSubmitting(false) }
  }, [language, projectId, projectScope, refresh, sessiontoken])

  const toggleVisibilityBulk = useCallback(async (rows: FeeInvoiceItem[], value: boolean) => {
    if (!projectId || !projectScope || !rows.length) throw new Error('No eligible fee invoices were selected.')
    if (rows.some(row => !row.id || !row.fee_period_id || row.project_id !== projectId)) throw new Error('Selected invoices must belong to the current project and have a fee period.')

    const groups = new Map<number, number[]>()
    rows.forEach(row => groups.set(row.fee_period_id!, [...(groups.get(row.fee_period_id!) ?? []), row.id!]))
    const successfulInvoiceIds: number[] = []
    const failedInvoiceIds: number[] = []
    let firstError: unknown = null
    setSubmitting(true)
    try {
      for (const [feePeriodId, invoiceIds] of groups) {
        try {
          await feeService.toggleFeeVisibility({ sessiontoken, language, scope: projectScope, invoiceIds, feePeriodId, isShowToResident: value })
          successfulInvoiceIds.push(...invoiceIds)
        } catch (error) {
          failedInvoiceIds.push(...invoiceIds)
          firstError ??= error
        }
      }
      if (successfulInvoiceIds.length) await refresh()
      return { successfulInvoiceIds, failedInvoiceIds, error: firstError ? normalizeWorkflowErrorDetail(firstError, { fallback: 'Unable to update fee visibility.' }) : null }
    } finally { setSubmitting(false) }
  }, [language, projectId, projectScope, refresh, sessiontoken])

  const toggleActiveBulk = useCallback(async (rows: FeeInvoiceItem[], value: boolean) => {
    if (!projectId || !projectScope || !rows.length) throw new Error('No eligible fee invoices were selected.')
    if (rows.some(row => !row.id || row.project_id !== projectId)) throw new Error('Selected invoices must belong to the current project.')

    const invoiceIds = rows.map(row => row.id!)
    setSubmitting(true)
    try {
      await feeService.toggleFeeActiveStatus({ sessiontoken, language, scope: projectScope, invoiceIds, isActive: value })
      await refresh()
      return { successfulInvoiceIds: invoiceIds, failedInvoiceIds: [], error: null }
    } finally { setSubmitting(false) }
  }, [language, projectId, projectScope, refresh, sessiontoken])

  return { periods, periodId, setPeriodId, overview, overviewLoading, overviewError, templates, templatesLoading, templatesError, loadTemplates, submitting, toggleVisibility, toggleActive, toggleVisibilityBulk, toggleActiveBulk, refresh,
    sendNotifications: async (fields: Parameters<typeof feeService.sendFeePeriodNotifications>[0]['fields']) => { setSubmitting(true); try { await feeService.sendFeePeriodNotifications({ sessiontoken, language, scope: projectScope ?? undefined, fields }); await refresh() } finally { setSubmitting(false) } },
    settle: async (fields: Parameters<typeof feeService.counterSettleFee>[0]['fields']) => { setSubmitting(true); try { await feeService.counterSettleFee({ sessiontoken, language, fields }); await refresh() } finally { setSubmitting(false) } }
  }
}
