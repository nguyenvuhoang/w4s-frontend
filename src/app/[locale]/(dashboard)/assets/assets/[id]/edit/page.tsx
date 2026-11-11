import { auth } from '@/auth'
import { Locale } from '@/configs/i18n'
import AssetEditPage from '@/features/assets/AssetEditPage'
import { assetText } from '@/features/assets/components/assetHelpers'
import { assetService } from '@/features/assets/services/assetService'
import type { AssetItem } from '@/features/assets/types'
import AuthorizedLayout from '@components/layout/AuthorizedLayout'
import { getDictionary } from '@utils/getDictionary'
import { toClientSessionToken } from '@utils/safeSessionToken'
import { getServerBackendToken } from '@/server/auth/getServerBackendToken'
import logger from '@lib/logger'

type Params = Promise<{
  locale: Locale
  id: string
}>

const AssetEditRoute = async ({ params }: { params: Params }) => {
  const { locale, id } = await params
  const [dictionary, session] = await Promise.all([getDictionary(locale), auth()])
  const assetId = Number(id)
  const resolvedAssetId = Number.isInteger(assetId) && assetId > 0 ? assetId : 0
  let asset: AssetItem | null = null
  let initialError: string | null = null

  if (!resolvedAssetId) {
    initialError = assetText(dictionary, 'detail_not_found', 'Asset detail was not found.')
  } else {
    try {
      asset = await assetService.getAssetById({
        sessiontoken: (await getServerBackendToken()) ?? undefined,
        language: locale,
        id: resolvedAssetId
      })
    } catch (error) {
      initialError = error instanceof Error
        ? error.message
        : assetText(dictionary, 'detail_load_failed', 'Unable to load asset detail.')
      logger.error('[assets] Unable to load edit detail', error)
    }
  }

  return (
    <AuthorizedLayout requiredPath="/assets/assets" requiredAction="MODIFY" params={{ locale }}>
      {() => (
        <AssetEditPage
          dictionary={dictionary}
          locale={locale}
          sessiontoken={toClientSessionToken(session) ?? ''}
          asset={asset}
          error={initialError}
        />
      )}
    </AuthorizedLayout>
  )
}

export default AssetEditRoute
