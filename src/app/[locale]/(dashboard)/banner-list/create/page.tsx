import { Locale } from '@/configs/i18n'
import BannerCreatePage from '@/features/banners/BannerCreatePage'
import AuthorizedLayout from '@components/layout/AuthorizedLayout'
import { getDictionary } from '@utils/getDictionary'

type Params = Promise<{
  locale: Locale
}>

const BannerCreateRoute = async ({ params }: { params: Params }) => {
  const { locale } = await params
  const dictionary = await getDictionary(locale)

  return (
    <AuthorizedLayout requiredPath="/banner-list" requiredAction="ADD" params={{ locale }}>
      {() => (
        <BannerCreatePage
          dictionary={dictionary}
          locale={locale}
        />
      )}
    </AuthorizedLayout>
  )
}

export default BannerCreateRoute
