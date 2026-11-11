import type { Metadata } from 'next'

import { auth } from '@/auth'
import AuthorizedLayout, { generateAuthMetadata } from '@components/layout/AuthorizedLayout'
import { i18n, type Locale } from '@/configs/i18n'
import AnnouncementsContent from '@/features/announcement/components/AnnouncementsContent'
import { announcementText } from '@/features/announcement/components/announcementListHelpers'
import { announcementService } from '@/features/announcement/services/announcementService'
import { getDictionary } from '@utils/getDictionary'
import { parseAnnouncementFilter } from '../pageRouteHelpers'
import type { SearchParams } from '../pageRouteHelpers'
import { getServerBackendToken } from '@/server/auth/getServerBackendToken'

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
  const { locale } = await params
  const dictionary = await getDictionary(locale)

  return generateAuthMetadata(announcementText(dictionary, 'announcements_management', 'Quản lý thông báo'))
}

export async function generateStaticParams() {
  return i18n.locales.map(locale => ({ locale }))
}

const AnnouncementPage = async ({ params, searchParams }: { params: Promise<{ locale: Locale }>; searchParams?: Promise<SearchParams> }) => {
  const { locale } = await params
  const search_params = await searchParams ?? {}
  const [dictionary, session] = await Promise.all([getDictionary(locale), auth()])
  const initialFilter = parseAnnouncementFilter(search_params)
  const initialData = await announcementService.simpleSearchAnnouncements({
    sessiontoken: (await getServerBackendToken()) as string, 
    language: locale,
    filter: initialFilter
  })

  return (
    <AuthorizedLayout requiredPath="/announcement" params={{ locale }}>
      {() => (
        <AnnouncementsContent
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

export default AnnouncementPage
