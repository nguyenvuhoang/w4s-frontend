import { auth } from '@/auth'
import AuthorizedLayout from '@components/layout/AuthorizedLayout'
import ResidentFeedbackPage from '@/features/resident-feedback/ResidentFeedbackPage'
import { residentFeedbackService } from '@/features/resident-feedback/services/residentFeedbackService'
import { getDictionary } from '@utils/getDictionary'
import { i18n, Locale } from '@/configs/i18n'
import { parseResidentFeedbackFilter } from '../../pageRouteHelpers'
import type { SearchParams } from '../../pageRouteHelpers'

export async function generateStaticParams() {
  return i18n.locales.map((l) => ({ locale: l }))
}

const ResidentFeedbackRoutePage = async ({ params, searchParams }: { params: Promise<{ locale: Locale }>; searchParams?: Promise<SearchParams> }) => {
  const { locale } = await params
  const search_params = await searchParams ?? {}
  const [dictionary, session] = await Promise.all([getDictionary(locale), auth()])
  const initialFilter = parseResidentFeedbackFilter(search_params)
  const initialData = residentFeedbackService.getDefaultResponse(initialFilter)

  return (
    <AuthorizedLayout requiredPath="/feedback/resident-feedback" params={{ locale }}>
      {() => (
        <ResidentFeedbackPage
          dictionary={dictionary}
          session={session}
          locale={locale}
          initialFilter={initialFilter}
          initialData={initialData}
        />
      )}
    </AuthorizedLayout>
  )
}

export default ResidentFeedbackRoutePage
