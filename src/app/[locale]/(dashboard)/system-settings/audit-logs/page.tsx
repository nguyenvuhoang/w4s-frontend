import type { Metadata } from 'next'

import { auth } from '@/auth'
import type { Locale } from '@/configs/i18n'
import { i18n } from '@/configs/i18n'
import AuditLogsContent from '@/features/system-settings/audit-logs/components/AuditLogsContent'
import { auditLogText } from '@/features/system-settings/audit-logs/components/auditLogHelpers'
import { auditLogService } from '@/features/system-settings/audit-logs/services/auditLogService'
import type { AuditLogFilterModel } from '@/features/system-settings/audit-logs/types'
import { getDictionary } from '@/shared/utils/getDictionary'
import { Box } from '@mui/material'

import { parseAuditLogFilter } from '../../pageRouteHelpers'
import type { SearchParams } from '../../pageRouteHelpers'
import { getServerBackendToken } from '@/server/auth/getServerBackendToken'
import logger from '@lib/logger'

export const metadata: Metadata = {
  title: 'Audit Logs'
}

export async function generateStaticParams() {
  return i18n.locales.map(locale => ({ locale }))
}

const toRequestFilter = (filter: AuditLogFilterModel) => ({
  pageindex: Math.max(filter.page_index, 0),
  pagesize: filter.page_size,
  workflowid: filter.workflowid.trim(),
  execution_id: filter.execution_id.trim(),
  status: filter.status,
  from_date: filter.from_date || null,
  to_date: filter.to_date || null
})

const AuditLogsPage = async ({ params, searchParams }: { params: Promise<{ locale: Locale }>; searchParams?: Promise<SearchParams> }) => {
  const { locale } = await params
  const search_params = await searchParams ?? {}
  const [dictionary, session] = await Promise.all([getDictionary(locale), auth()])
  const initialFilter = parseAuditLogFilter(search_params)
  const initialRequest = toRequestFilter(initialFilter)
  let initialData = auditLogService.getDefaultSearchResponse(initialRequest)
  let initialError: string | null = null

  try {
    initialData = await auditLogService.searchAuditLogs({
      sessiontoken: (await getServerBackendToken()) ?? undefined,
      language: locale,
      filter: initialRequest
    })
  } catch (error) {
    initialError = error instanceof Error
      ? error.message
      : auditLogText(locale, 'Không thể tải danh sách nhật ký hệ thống.', 'Unable to load audit logs.')
    logger.error('[audit-logs] Unable to load initial data', error)
  }

  return (
    <Box sx={{ p: 6 }}>
      <AuditLogsContent
        dictionary={dictionary}
        session={session}
        locale={locale}
        initialFilter={{
          ...initialFilter,
          page_index: initialData.page_index,
          page_size: initialData.page_size
        }}
        initialData={initialData}
        initialError={initialError}
      />
    </Box>
  )
}

export default AuditLogsPage
