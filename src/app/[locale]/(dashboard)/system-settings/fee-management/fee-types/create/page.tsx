import { auth } from '@/auth'
import type { Locale } from '@/configs/i18n'
import FeeTypeCreatePage from '@/features/fees/FeeTypeCreatePage'
import { SETTINGS_FEE_TYPE_ROUTES } from '@/features/fees/feeTypeRoutes'
import { getDictionary } from '@utils/getDictionary'
import { toClientSessionToken } from '@utils/safeSessionToken'

type Params = Promise<{
  locale: Locale
}>

const SettingsFeeTypeCreatePage = async ({ params }: { params: Params }) => {
  const { locale } = await params
  const [dictionary, session] = await Promise.all([getDictionary(locale), auth()])

  return (
    <FeeTypeCreatePage
      dictionary={dictionary}
      locale={locale}
      sessiontoken={toClientSessionToken(session) ?? ''}
      routes={SETTINGS_FEE_TYPE_ROUTES}
    />
  )
}

export default SettingsFeeTypeCreatePage
