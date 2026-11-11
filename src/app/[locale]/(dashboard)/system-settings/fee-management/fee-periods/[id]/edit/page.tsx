import { Box } from '@mui/material'

import { auth } from '@/auth'
import type { Locale } from '@/configs/i18n'
import FeePeriodFormContent from '@/features/system-settings/fee-management/components/FeePeriodFormContent'
import { loadFeePeriodPageData } from '@/features/system-settings/fee-management/feePeriodPage.server'
import { getDictionary } from '@/shared/utils/getDictionary'

type FeePeriodEditPageProps = {
  params: Promise<{
    locale: string
    id: string
  }>
}

export const dynamic = 'force-dynamic'

const FeePeriodEditPage = async ({ params }: FeePeriodEditPageProps) => {
  const { locale, id } = await params
  const language = locale as Locale
  const [dictionary, session, data] = await Promise.all([getDictionary(language), auth(), loadFeePeriodPageData(id, language)])

  return (
    <Box sx={{ p: 6 }}>
      <FeePeriodFormContent
        dictionary={dictionary}
        locale={locale}
        session={session}
        mode='edit'
        period={data.period}
        notFound={data.notFound}
        loadError={data.error}
        projects={data.projects}
        projectsError={data.projectsError}
      />
    </Box>
  )
}

export default FeePeriodEditPage
