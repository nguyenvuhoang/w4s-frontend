import { auth } from '@/auth'
import { i18n, Locale } from '@/configs/i18n'
import ContactInfoPage from '@/features/contact-info/ContactInfoPage'
import { emptyContactInfoFilter } from '@/features/contact-info/components/contactInfoHelpers'
import { contactInfoService } from '@/features/contact-info/service'
import { getDictionary } from '@/shared/utils/getDictionary'
import AuthorizedLayout from '@components/layout/AuthorizedLayout'

export async function generateStaticParams() {
  return i18n.locales.map((locale) => ({ locale }))
}

type Params = Promise<{
  locale: Locale
}>

const ContactInfoRoutePage = async ({ params }: { params: Params }) => {
  const { locale } = await params
  const [dictionary, session] = await Promise.all([getDictionary(locale), auth()])
  const initialFilter = emptyContactInfoFilter
  const initialData = contactInfoService.getDefaultContactInfoResponse(initialFilter)

  return (
    <AuthorizedLayout requiredPath="/contact-info" params={{ locale }}>
      {() => (
        <ContactInfoPage
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

export default ContactInfoRoutePage
