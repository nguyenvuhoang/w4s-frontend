import { auth } from '@/auth'
import { Locale } from '@/configs/i18n'
import BannerDetailPage from '@/features/banners/BannerDetailPage'
import { bannerService } from '@/features/banners/service'
import type { BannerItem } from '@/features/banners/types'
import { WorkflowError } from '@/shared/utils/workflowError'
import AuthorizedLayout from '@components/layout/AuthorizedLayout'
import { getDictionary } from '@utils/getDictionary'
import { getServerBackendToken } from '@/server/auth/getServerBackendToken'
import logger from '@lib/logger'

type Params = Promise<{
  locale: Locale
  id: string
}>

const BannerDetailRoute = async ({ params }: { params: Params }) => {
  const { locale, id } = await params
  const [dictionary, session] = await Promise.all([getDictionary(locale), auth()])
  const bannerId = Number(id)
  const resolvedBannerId = Number.isInteger(bannerId) && bannerId > 0 ? bannerId : 0
  let banner: BannerItem | null = null
  let initialError: { message: string; executionId?: string } | null = null

  if (!resolvedBannerId) {
    initialError = null
  } else {
    try {
      banner = await bannerService.getBannerById({
        sessiontoken: (await getServerBackendToken()) ?? undefined,
        language: locale,
        id: resolvedBannerId
      })
    } catch (error) {
      initialError = error instanceof WorkflowError
        ? { message: error.message, executionId: error.execution_id || undefined }
        : { message: error instanceof Error ? error.message : 'Unable to load banner detail.' }
      logger.error('[banner-list] Unable to load detail', error)
    }
  }

  return (
    <AuthorizedLayout requiredPath="/banner-list" params={{ locale }}>
      {() => (
        <BannerDetailPage
          dictionary={dictionary}
          locale={locale}
          banner={banner}
          error={initialError}
        />
      )}
    </AuthorizedLayout>
  )
}

export default BannerDetailRoute
