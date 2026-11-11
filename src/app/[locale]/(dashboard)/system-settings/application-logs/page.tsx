import type { Metadata } from 'next'

import type { Locale } from '@/configs/i18n'
import { i18n } from '@/configs/i18n'
import ApplicationLogsContent from '@/features/system-settings/application-logs/components/ApplicationLogsContent'
import AuthorizedLayout from '@/shared/components/layout/AuthorizedLayout'
import { Box } from '@mui/material'

export const metadata: Metadata = {
  title: 'Application Logs'
}

export async function generateStaticParams() {
  return i18n.locales.map(locale => ({ locale }))
}

const ApplicationLogsPage = async ({
  params,
  searchParams
}: {
  params: Promise<{ locale: Locale }>
  searchParams?: Promise<{ execution_id?: string | string[] }>
}) => {
  const { locale } = await params
  const query = await searchParams
  const initialExecutionId = typeof query?.execution_id === 'string' ? query.execution_id.trim() : ''

  return (
    <AuthorizedLayout requiredPath="/system-settings/application-logs" params={{ locale }}>
      {({ dictionary, session }) => (
        <Box sx={{ p: 6 }}>
          <ApplicationLogsContent
            dictionary={dictionary}
            session={session}
            locale={locale}
            initialExecutionId={initialExecutionId}
          />
        </Box>
      )}
    </AuthorizedLayout>
  )
}

export default ApplicationLogsPage
