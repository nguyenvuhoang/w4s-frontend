import { auth } from '@/auth'
import { Locale } from '@/configs/i18n'
import ContactInfoDetailPage from '@/features/contact-info/ContactInfoDetailPage'
import { contactInfoText } from '@/features/contact-info/components/contactInfoHelpers'
import { contactInfoService } from '@/features/contact-info/service'
import { getDictionary } from '@utils/getDictionary'
import AuthorizedLayout from '@components/layout/AuthorizedLayout'
import { toClientSessionToken } from '@utils/safeSessionToken'
import { getServerBackendToken } from '@/server/auth/getServerBackendToken'
import logger from '@lib/logger'

type Params = Promise<{
  locale: Locale
  id: string
}>

const ContactInfoDetailRoutePage = async ({ params }: { params: Params }) => {
  const { locale, id } = await params
  const [dictionary, session] = await Promise.all([getDictionary(locale), auth()])
  const contactId = Number(id)
  let detail = null
  let initialError: string | null = null

  try {
    detail = await contactInfoService.getProjectContactById({
      sessiontoken: (await getServerBackendToken()) ?? undefined,
      language: locale,
      id: contactId
    })
  } catch (error) {
    initialError = error instanceof Error ? error.message : contactInfoText(dictionary, 'load_detail_failed', 'Unable to load project contact detail.')
    logger.error('[contact-info] Unable to load detail', error)
  }

  return (
    <AuthorizedLayout requiredPath="/contact-info-view-detail" params={{ locale }}>
      {() => (
        <ContactInfoDetailPage
          dictionary={dictionary}
          locale={locale}
          sessiontoken={toClientSessionToken(session) ?? ''}
          contact={detail}
          error={initialError}
        />
      )}
    </AuthorizedLayout>
  )
}

export default ContactInfoDetailRoutePage
