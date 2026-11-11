import type { Metadata } from 'next'

import { auth } from '@/auth'
import type { Locale } from '@/configs/i18n'
import AuthorizedLayout, { generateAuthMetadata } from '@components/layout/AuthorizedLayout'
import AnnouncementDetailContent from '@/features/announcement/components/AnnouncementDetailContent'
import { announcementText } from '@/features/announcement/components/announcementListHelpers'
import { announcementService } from '@/features/announcement/services/announcementService'
import { getDictionary } from '@utils/getDictionary'
import { getServerBackendToken } from '@/server/auth/getServerBackendToken'
import logger from '@lib/logger'

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
  const { locale } = await params
  const dictionary = await getDictionary(locale)

  return generateAuthMetadata(announcementText(dictionary, 'announcement_detail', 'Chi tiết thông báo'))
}

const AnnouncementDetailPage = async ({ params }: { params: Promise<{ locale: Locale; id: string }> }) => {
  const { locale, id } = await params
  const [dictionary, session] = await Promise.all([getDictionary(locale), auth()])
  const announcementId = Number(id)
  let detail = null
  let detailError: string | null = null

  if (!Number.isInteger(announcementId) || announcementId <= 0) {
    detailError = announcementText(dictionary, 'announcement_not_found', 'Không tìm thấy thông báo')
  } else {
    try {
      detail = await announcementService.getAnnouncementById({
        sessiontoken: (await getServerBackendToken()) ?? undefined,
        language: locale,
        id: announcementId
      })
    } catch (error) {
      detailError = error instanceof Error
        ? error.message
        : announcementText(dictionary, 'detail_load_failed', 'Không thể tải chi tiết thông báo.')
      logger.error('[announcement] Unable to load detail', error)
    }
  }

  return (
    <AuthorizedLayout requiredPath="/announcement" params={{ locale }}>
      {() => (
        <AnnouncementDetailContent
          dictionary={dictionary}
          locale={locale}
          session={session}
          announcement={detail}
          error={detailError}
        />
      )}
    </AuthorizedLayout>
  )
}

export default AnnouncementDetailPage
