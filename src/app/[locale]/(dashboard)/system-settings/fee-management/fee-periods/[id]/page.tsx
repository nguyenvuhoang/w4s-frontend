import { Box } from '@mui/material'

import { auth } from '@/auth'
import type { Locale } from '@/configs/i18n'
import FeePeriodDetailContent from '@/features/system-settings/fee-management/components/FeePeriodDetailContent'
import { loadFeePeriodPageData } from '@/features/system-settings/fee-management/feePeriodPage.server'
import { getDictionary } from '@/shared/utils/getDictionary'

type FeePeriodDetailPageProps = {
  params: Promise<{
    locale: string
    id: string
  }>
}

export const dynamic = 'force-dynamic'

const FeePeriodDetailPage = async ({ params }: FeePeriodDetailPageProps) => {
  const { locale, id } = await params
  const language = locale as Locale
  const [dictionary, session, data] = await Promise.all([getDictionary(language), auth(), loadFeePeriodPageData(id, language)])

  return (
    <Box sx={{ p: 6 }}>
      <FeePeriodDetailContent
        dictionary={dictionary}
        locale={locale}
        session={session}
        period={data.period}
        notFound={data.notFound}
        error={data.error}
        projects={data.projects}
      />
    </Box>
  )
}

export default FeePeriodDetailPage
