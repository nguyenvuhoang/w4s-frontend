import { auth } from '@/auth'
import { Locale } from '@/configs/i18n'
import ContactInfoEditPage from '@/features/contact-info/ContactInfoEditPage'
import { contactInfoText } from '@/features/contact-info/components/contactInfoHelpers'
import { contactInfoService } from '@/features/contact-info/service'
import type { ContactInfoProjectOption } from '@/features/contact-info/types'
import { getDictionary } from '@utils/getDictionary'
import AuthorizedLayout from '@components/layout/AuthorizedLayout'
import { toClientSessionToken } from '@utils/safeSessionToken'
import { getServerBackendToken } from '@/server/auth/getServerBackendToken'
import logger from '@lib/logger'

type Params = Promise<{
  locale: Locale
  id: string
}>

const ContactInfoEditRoutePage = async ({ params }: { params: Params }) => {
  const { locale, id } = await params
  const [dictionary, session] = await Promise.all([getDictionary(locale), auth()])
  const contactId = Number(id)
  let detail = null
  let project: ContactInfoProjectOption | null = null
  let initialError: string | null = null

  try {
    detail = await contactInfoService.getProjectContactById({
      sessiontoken: (await getServerBackendToken()) ?? undefined,
      language: locale,
      id: contactId
    })
  } catch (error) {
    initialError = error instanceof Error ? error.message : contactInfoText(dictionary, 'load_detail_failed', 'Unable to load project contact detail.')
    logger.error('[contact-info] Unable to load edit detail', error)
  }

  if (detail?.project_id && (!detail.project_code || !detail.project_name)) {
    try {
      const projects = await contactInfoService.simpleSearchProjects({
        sessiontoken: (await getServerBackendToken()) ?? undefined,
        language: locale,
        page_size: 100
      })

      project = projects.find(item => item.id === detail?.project_id) ?? null
    } catch (error) {
      logger.error('[contact-info] Unable to resolve project for edit detail', error)
    }
  }

  return (
    <AuthorizedLayout requiredPath="/contact-info-view-detail" requiredAction="MODIFY" params={{ locale }}>
      {() => (
        <ContactInfoEditPage
          dictionary={dictionary}
          locale={locale}
          sessiontoken={toClientSessionToken(session) ?? ''}
          contact={detail}
          project={project}
          error={initialError}
        />
      )}
    </AuthorizedLayout>
  )
}

export default ContactInfoEditRoutePage
