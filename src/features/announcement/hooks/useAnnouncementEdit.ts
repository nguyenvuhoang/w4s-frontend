'use client'

import { useCallback, useMemo, useState } from 'react'
import type { Session } from 'next-auth'
import { useRouter } from '@shared/hooks/useRouter'

import SwalAlert from '@/shared/utils/SwalAlert'
import { announcementService } from '../services/announcementService'
import type {
    AnnouncementDetailItem,
    AnnouncementFormValues,
    UpdateAnnouncementFormValues,
    UpdateAnnouncementPayload
} from '../types'
import { getLocalizedAnnouncementDetail } from '../components/announcementListHelpers'

type FieldErrors = Partial<Record<keyof UpdateAnnouncementFormValues, string>>

type Messages = {
    required: string
    content_required: string
    update_success: string
    update_failed: string
    published_readonly: string
    confirm_publish_title: string
    confirm_publish_message: string
    confirm_publish_action: string
    publish_success: string
    publish_failed: string
}

const stripHtmlToText = (html: string) => {
    if (typeof window === 'undefined') return html.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').trim()

    const element = document.createElement('div')
    element.innerHTML = html

    return (element.textContent ?? element.innerText ?? '').replace(/\u00a0/g, ' ').trim()
}

const getCurrentUpdateDate = () => new Date().toISOString()

const mapInitialValues = (announcement: AnnouncementDetailItem, locale: string): UpdateAnnouncementFormValues => {
    const localized = getLocalizedAnnouncementDetail(announcement, locale)

    return {
        title: localized.title,
        summary: localized.summary,
        content: localized.content,
        category: announcement.category || 'NEWS',
        status: announcement.status || 'A',
        is_pinned: Boolean(announcement.is_pinned),
        require_read_confirmation: Boolean(announcement.require_read_confirmation),
        target_audience: announcement.target_audience || '',
        publish: '',
        project: announcement.project_id ? String(announcement.project_id) : '',
        tower: '',
        floor: '',
        unit: '',
        apartment_type: ''
    }
}

const mapPreviewValues = (values: UpdateAnnouncementFormValues): AnnouncementFormValues => ({
    title: values.title,
    summary: values.summary,
    category: values.category,
    is_pinned: values.is_pinned,
    require_read_confirmation: values.require_read_confirmation,
    notification_type: values.category,
    notification_icon: 'DEFAULT',
    avatar_url: null,
    avatar_preview_url: null,
    avatar_file_name: '',
    publish_at: '',
    publish_immediately: true,
    content_html: values.content,
    project: values.project,
    tower: values.tower,
    floor: values.floor,
    unit: values.unit,
    apartment_type: values.apartment_type,
    translations: {
        vi: {
            title: values.title,
            summary: values.summary,
            content: values.content
        },
        en: {
            title: values.title,
            summary: values.summary,
            content: values.content
        }
    }
})

export const useAnnouncementEdit = ({
    announcement,
    session,
    locale,
    messages
}: {
    announcement: AnnouncementDetailItem
    session: Session | null
    locale: string
    messages: Messages
}) => {
    const router = useRouter()
    const [values, setValues] = useState<UpdateAnnouncementFormValues>(() => mapInitialValues(announcement, locale))
    const [errors, setErrors] = useState<FieldErrors>({})
    const [submitting, setSubmitting] = useState(false)
    const [previewOpen, setPreviewOpen] = useState(false)
    const isPublished = announcement.status === 'R'

    const previewValues = useMemo(() => mapPreviewValues(values), [values])

    const updateValue = useCallback(<K extends keyof UpdateAnnouncementFormValues>(key: K, value: UpdateAnnouncementFormValues[K]) => {
        setValues(current => ({ ...current, [key]: value }))
        setErrors(current => ({ ...current, [key]: undefined }))
    }, [])

    const validate = useCallback(() => {
        const nextErrors: FieldErrors = {}

        if (!values.title.trim()) nextErrors.title = messages.required
        if (!values.summary.trim()) nextErrors.summary = messages.required
        if (!stripHtmlToText(values.content)) nextErrors.content = messages.content_required

        setErrors(nextErrors)

        return Object.keys(nextErrors).length === 0
    }, [messages.content_required, messages.required, values.content, values.summary, values.title])

    const buildPayload = useCallback((): UpdateAnnouncementPayload => ({
        id: announcement.id,
        category: values.category,
        require_read_confirmation: values.require_read_confirmation,
        is_pinned: values.is_pinned,
        status: values.status,
        content: values.content,
        title: values.title.trim(),
        summary: values.summary.trim(),
        target_audience: values.target_audience,
        publish: getCurrentUpdateDate()
    }), [announcement.id, values])

    const submit = useCallback(async () => {
        if (isPublished) {
            SwalAlert('warning', messages.published_readonly, 'center')

            return
        }

        if (!validate()) return

        setSubmitting(true)

        try {
            await announcementService.updateAnnouncement(buildPayload(), {
                sessiontoken: session?.user?.token as string,
                language: locale
            })
            SwalAlert('success', messages.update_success, 'center')
            router.push(`/${locale}/announcement/${announcement.id}`)
        } catch (error: any) {
            SwalAlert('error', error?.message ?? messages.update_failed, 'center')
        } finally {
            setSubmitting(false)
        }
    }, [announcement.id, buildPayload, isPublished, locale, messages.published_readonly, messages.update_failed, messages.update_success, router, session, validate])

    const publishConfirmed = useCallback(async () => {
        if (isPublished) {
            SwalAlert('warning', messages.published_readonly, 'center')

            return
        }

        if (!validate()) return

        setSubmitting(true)

        try {
            await announcementService.updateAnnouncement({ ...buildPayload(), status: 'R' }, {
                sessiontoken: session?.user?.token as string,
                language: locale
            })
            SwalAlert('success', messages.publish_success, 'center')
            router.push(`/${locale}/announcement/${announcement.id}`)
            router.refresh()
        } catch (error: any) {
            SwalAlert('error', error?.message ?? messages.publish_failed, 'center')
        } finally {
            setSubmitting(false)
        }
    }, [announcement.id, buildPayload, isPublished, locale, messages.publish_failed, messages.publish_success, messages.published_readonly, router, session, validate])

    const publish = useCallback(() => {
        if (isPublished) {
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
    }, [isPublished, messages.confirm_publish_action, messages.confirm_publish_message, messages.confirm_publish_title, messages.published_readonly, publishConfirmed])

    return {
        values,
        errors,
        submitting,
        isPublished,
        previewOpen,
        previewValues,
        updateValue,
        openPreview: () => setPreviewOpen(true),
        closePreview: () => setPreviewOpen(false),
        backToDetail: () => router.push(`/${locale}/announcement/${announcement.id}`),
        submit,
        publish
    }
}
