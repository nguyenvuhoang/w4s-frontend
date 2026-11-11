import { Locale } from '@/configs/i18n'
import PromotionCreatePage from '@/features/promotions/PromotionCreatePage'
import AuthorizedLayout from '@components/layout/AuthorizedLayout'
import { getDictionary } from '@utils/getDictionary'

type Params = Promise<{
  locale: Locale
}>

const PromotionCreateRoute = async ({ params }: { params: Params }) => {
  const { locale } = await params
  const dictionary = await getDictionary(locale)

  return (
    <AuthorizedLayout requiredPath="/promotion-management" requiredAction="ADD" params={{ locale }}>
      {() => (
        <PromotionCreatePage
          dictionary={dictionary}
          locale={locale}
        />
      )}
    </AuthorizedLayout>
  )
}

export default PromotionCreateRoute
