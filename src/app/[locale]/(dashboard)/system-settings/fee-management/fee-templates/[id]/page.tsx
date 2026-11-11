import { Box } from '@mui/material'

import { auth } from '@/auth'
import type { Locale } from '@/configs/i18n'
import FeeTemplateDetailContent from '@/features/system-settings/fee-management/components/FeeTemplateDetailContent'
import { loadFeeTemplatePageData } from '@/features/system-settings/fee-management/feeTemplatePage.server'
import { getDictionary } from '@/shared/utils/getDictionary'

type FeeTemplateDetailPageProps = {
  params: Promise<{
    locale: string
    id: string
  }>
}

export const dynamic = 'force-dynamic'

const FeeTemplateDetailPage = async ({ params }: FeeTemplateDetailPageProps) => {
  const { locale, id } = await params
  const language = locale as Locale
  const [dictionary, session, data] = await Promise.all([getDictionary(language), auth(), loadFeeTemplatePageData(id, language)])

  return (
    <Box sx={{ p: 6 }}>
      <FeeTemplateDetailContent
        dictionary={dictionary}
        locale={locale}
        session={session}
        template={data.template}
        notFound={data.notFound}
        error={data.error}
      />
    </Box>
  )
}

export default FeeTemplateDetailPage
