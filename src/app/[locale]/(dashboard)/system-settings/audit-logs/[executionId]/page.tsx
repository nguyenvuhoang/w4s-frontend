import type { Metadata } from 'next'

import { auth } from '@/auth'
import type { Locale } from '@/configs/i18n'
import AuditLogDetailContent from '@/features/system-settings/audit-logs/components/AuditLogDetailContent'
import { auditLogText } from '@/features/system-settings/audit-logs/components/auditLogHelpers'
import { auditLogService } from '@/features/system-settings/audit-logs/services/auditLogService'
import { getDictionary } from '@/shared/utils/getDictionary'
import { Box } from '@mui/material'
import { getServerBackendToken } from '@/server/auth/getServerBackendToken'
import logger from '@lib/logger'

type AuditLogDetailPageProps = {
  params: Promise<{
    locale: Locale
    executionId: string
  }>
}

export const metadata: Metadata = {
  title: 'Audit Log Detail'
}

const AuditLogDetailPage = async ({ params }: AuditLogDetailPageProps) => {
  const { locale, executionId: encodedExecutionId } = await params
  const executionId = decodeURIComponent(encodedExecutionId)
  const [dictionary, session] = await Promise.all([getDictionary(locale), auth()])
  let initialData = auditLogService.getDefaultDetailResponse()
  let initialError: string | null = null

  try {
    initialData = await auditLogService.getAuditLogDetail({
      sessiontoken: (await getServerBackendToken()) ?? undefined,
      language: locale,
      request: {
        execution_id: executionId,
        pageindex: 0,
        pagesize: 10
      }
    })
  } catch (error) {
    initialError = error instanceof Error
      ? error.message
      : auditLogText(locale, 'Không thể tải chi tiết nhật ký hệ thống.', 'Unable to load audit log detail.')
    logger.error('[audit-log-detail] Unable to load detail data', error)
  }

  return (
    <Box sx={{ p: 6 }}>
      <AuditLogDetailContent
        dictionary={dictionary}
        session={session}
        locale={locale}
        executionId={executionId}
        initialData={initialData}
        initialError={initialError}
      />
    </Box>
  )
}

export default AuditLogDetailPage
