'use client'

import { useCallback, useState } from 'react'
import type { Session } from 'next-auth'
import { useRouter } from '@shared/hooks/useRouter'

import SwalAlert from '@/shared/utils/SwalAlert'
import { getLocalizedAnnouncementDetail } from '../components/announcementListHelpers'
import { announcementService } from '../services/announcementService'
import type { AnnouncementDetailItem, UpdateAnnouncementPayload } from '../types'

type Messages = {
    published_readonly: string
    confirm_publish_title: string
    confirm_publish_message: string
    confirm_publish_action: string
    publish_success: string
    publish_failed: string
}

const getCurrentUpdateDate = () => new Date().toISOString()

const buildPublishPayload = (
    announcement: AnnouncementDetailItem,
    locale: string
): UpdateAnnouncementPayload => {
    const localized = getLocalizedAnnouncementDetail(announcement, locale)

    return {
        id: announcement.id,
        category: announcement.category,
        require_read_confirmation: Boolean(announcement.require_read_confirmation),
        is_pinned: Boolean(announcement.is_pinned),
        status: 'R',
        content: localized.content || announcement.content || '',
        title: (localized.title || announcement.title || '').trim(),
        summary: (localized.summary || announcement.summary || '').trim(),
        target_audience: announcement.target_audience || '',
        publish: getCurrentUpdateDate()
    }
}

export const useAnnouncementPublish = ({
    announcement,
    session,
    locale,
    messages
}: {
    announcement: AnnouncementDetailItem | null
    session: Session | null
    locale: string
    messages: Messages
}) => {
    const router = useRouter()
    const [publishing, setPublishing] = useState(false)
    const isPublished = announcement?.status === 'R'

    const publishConfirmed = useCallback(async () => {
        if (!announcement || isPublished) {
            SwalAlert('warning', messages.published_readonly, 'center')

            return
        }

        setPublishing(true)

        try {
            await announcementService.updateAnnouncement(buildPublishPayload(announcement, locale), {
                sessiontoken: session?.user?.token as string,
                language: locale
            })
            SwalAlert('success', messages.publish_success, 'center')
            router.refresh()
        } catch (error: any) {
            SwalAlert('error', error?.message ?? messages.publish_failed, 'center')
        } finally {
            setPublishing(false)
        }
    }, [announcement, isPublished, locale, messages.publish_failed, messages.publish_success, messages.published_readonly, router, session])

    const publish = useCallback(() => {
        if (!announcement || isPublished) {
            SwalAlert('warning', messages.published_readonly, 'center')

            return
        }

        SwalAlert(
            'question',
            [messages.confirm_publish_title, messages.confirm_publish_message].filter(Boolean).join('\n'),
            'center',
            true,
            true,
            true,
            () => {
                void publishConfirmed()
            },
            messages.confirm_publish_action
        )
    }, [announcement, isPublished, messages.confirm_publish_action, messages.confirm_publish_message, messages.confirm_publish_title, messages.published_readonly, publishConfirmed])

    return {
        isPublished,
        publishing,
        publish
    }
}
