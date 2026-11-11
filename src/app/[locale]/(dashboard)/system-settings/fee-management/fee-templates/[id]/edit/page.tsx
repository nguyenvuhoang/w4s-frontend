import { Box } from '@mui/material'

import { auth } from '@/auth'
import type { Locale } from '@/configs/i18n'
import FeeTemplateFormContent from '@/features/system-settings/fee-management/components/FeeTemplateFormContent'
import { loadFeeTemplatePageData } from '@/features/system-settings/fee-management/feeTemplatePage.server'
import { getDictionary } from '@/shared/utils/getDictionary'

type FeeTemplateEditPageProps = {
  params: Promise<{
    locale: string
    id: string
  }>
}

export const dynamic = 'force-dynamic'

const FeeTemplateEditPage = async ({ params }: FeeTemplateEditPageProps) => {
  const { locale, id } = await params
  const language = locale as Locale
  const [dictionary, session, data] = await Promise.all([getDictionary(language), auth(), loadFeeTemplatePageData(id, language)])

  return (
    <Box sx={{ p: 6 }}>
      <FeeTemplateFormContent
        dictionary={dictionary}
        locale={locale}
        session={session}
        mode='edit'
        template={data.template}
        notFound={data.notFound}
        loadError={data.error}
      />
    </Box>
  )
}

export default FeeTemplateEditPage
