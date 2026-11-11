import { Box } from '@mui/material'

import { auth } from '@/auth'
import type { Locale } from '@/configs/i18n'
import FeeTemplateFormContent from '@/features/system-settings/fee-management/components/FeeTemplateFormContent'
import { loadFeeTemplatePageData, type FeeTemplatePageData } from '@/features/system-settings/fee-management/feeTemplatePage.server'
import { getDictionary } from '@/shared/utils/getDictionary'

type FeeTemplateNewPageProps = {
  params: Promise<{
    locale: string
  }>
  searchParams?: Promise<{
    clone?: string
  }>
}

export const dynamic = 'force-dynamic'

/** New template; `?clone={id}` pre-fills the form from that template (nothing is created until Save). */
const FeeTemplateNewPage = async ({ params, searchParams }: FeeTemplateNewPageProps) => {
  const { locale } = await params
  const { clone } = (await searchParams) ?? {}
  const language = locale as Locale
  const [dictionary, session] = await Promise.all([getDictionary(language), auth()])
  const source: FeeTemplatePageData | null = clone ? await loadFeeTemplatePageData(clone, language) : null

  return (
    <Box sx={{ p: 6 }}>
      <FeeTemplateFormContent
        dictionary={dictionary}
        locale={locale}
        session={session}
        mode='create'
        template={source?.template ?? null}
        isClone={Boolean(source?.template)}
        notFound={Boolean(source?.notFound)}
        loadError={source?.error ?? null}
      />
    </Box>
  )
}

export default FeeTemplateNewPage
