'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Session } from 'next-auth'
import { useRouter } from '@shared/hooks/useRouter'

import SwalAlert from '@/shared/utils/SwalAlert'
import { createWorkflowError } from '@/shared/utils/workflowError'
import { announcementService, mapCreateAnnouncementResponse } from '../services/announcementService'
import type {
    AnnouncementAttachment,
    AnnouncementFormValues,
    AnnouncementHierarchyFields,
    AnnouncementInitialData,
    AnnouncementMessages,
    AnnouncementOption,
    CreateAnnouncementPayload,
    CreatedAnnouncementSummary
} from '../types'
import {
    DEFAULT_ANNOUNCEMENT_FORM_VALUES,
    MAX_ANNOUNCEMENT_FILE_SIZE
} from '../types'

type FieldErrors = Partial<Record<keyof AnnouncementFormValues | 'attachments', string>>

const stripHtmlToText = (html: string) => {
    if (typeof window === 'undefined') return html.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').trim()

    const element = document.createElement('div')
    element.innerHTML = html

    return (element.textContent ?? element.innerText ?? '').replace(/\u00a0/g, ' ').trim()
}

const hasResponseErrors = (response: any) => {
    const errors = response?.payload?.dataresponse?.errors ?? response?.payload?.dataresponse?.error

    return Array.isArray(errors) && errors.length > 0
}

export const isAnnouncementContentEmpty = (html: string) => stripHtmlToText(html).length === 0

const pad = (value: number) => String(value).padStart(2, '0')

// Formats a Date as a `datetime-local` input value using the browser's own local time fields
// (no UTC conversion, no hardcoded offset) so it always matches the viewer's own timezone.
const toLocalDateTimeInputValue = (date: Date) => (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
)

// datetime-local inputs only carry minute precision, and a few seconds always pass between
// picking a value and clicking Save. A 1-minute tolerance keeps that gap from being flagged
// as "past" while still catching times that are genuinely in the past.
const PUBLISH_TIME_TOLERANCE_MS = 60000

export function useCreateAnnouncementForm(
    session: Session | null,
    locale: string,
    messages: AnnouncementMessages,
    initialData: AnnouncementInitialData
) {
    const router = useRouter()
    const [values, setValues] = useState<AnnouncementFormValues>(DEFAULT_ANNOUNCEMENT_FORM_VALUES)
    const titleDraftRef = useRef(DEFAULT_ANNOUNCEMENT_FORM_VALUES.title)
    // Guards against double-click/double-submit: checked and set synchronously before any
    // `await`, so it closes the window that `saving` state alone can't — React only disables
    // the button after a render commits, but two click events dispatched back-to-back both run
    // synchronously up to that point.
    const submittingRef = useRef(false)
    const [attachments, setAttachments] = useState<AnnouncementAttachment[]>([])
    const [errors, setErrors] = useState<FieldErrors>({})
    const [saving, setSaving] = useState(false)
    const [avatarUploading, setAvatarUploading] = useState(false)
    const [audienceLoading, setAudienceLoading] = useState(false)
    const [audienceOptions, setAudienceOptions] = useState({
        projects: initialData.projects,
        towers: initialData.towers,
        floors: initialData.floors,
        units: initialData.units,
        apartment_types: initialData.apartment_types
    })
    const [previewOpen, setPreviewOpen] = useState(false)
    const [minPublishAt, setMinPublishAt] = useState('')
    const [createSuccess, setCreateSuccess] = useState(false)
    const [createdAnnouncement, setCreatedAnnouncement] = useState<CreatedAnnouncementSummary | null>(null)

    // Runs client-side only (after mount) so the server-rendered pass and the first client
    // render agree on the min-selectable time. Never written into `values.publish_at` itself —
    // the field is never auto-filled with "now".
    useEffect(() => {
        setMinPublishAt(toLocalDateTimeInputValue(new Date()))
    }, [])

    const updateValue = useCallback(<K extends keyof AnnouncementFormValues>(key: K, value: AnnouncementFormValues[K]) => {
        setValues(current => ({ ...current, [key]: value }))
        setErrors(current => ({ ...current, [key]: undefined }))
    }, [])

    // publish_immediately and publish_at are mutually exclusive: ticking "publish immediately"
    // disables and clears the picked time (so a stale value can never leak into the payload);
    // unticking it leaves publish_at empty until the user explicitly picks one.
    const togglePublishImmediately = useCallback((checked: boolean) => {
        setValues(current => ({
            ...current,
            publish_immediately: checked,
            publish_at: checked ? '' : current.publish_at
        }))
        setErrors(current => (current.publish_at ? { ...current, publish_at: undefined } : current))
    }, [])

    const changePublishAt = useCallback((value: string) => {
        setValues(current => ({ ...current, publish_at: value }))
        setErrors(current => (current.publish_at ? { ...current, publish_at: undefined } : current))
    }, [])

    const updateTitleDraft = useCallback((value: string) => {
        titleDraftRef.current = value
        setErrors(current => current.title ? { ...current, title: undefined } : current)
    }, [])

    const commitTitle = useCallback((value: string) => {
        titleDraftRef.current = value
        setValues(current => current.title === value ? current : { ...current, title: value })
        setErrors(current => current.title ? { ...current, title: undefined } : current)
    }, [])

    const syncTitleValue = useCallback(() => {
        const title = titleDraftRef.current

        setValues(current => current.title === title ? current : { ...current, title })

        return title
    }, [])

    const optionNumber = useCallback((options: AnnouncementOption[], value: string) => {
        const option = options.find(item => item.value === value)
        const fallbackNumber = Number(value)

        return option?.id ?? (Number.isFinite(fallbackNumber) ? fallbackNumber : undefined)
    }, [])

    const loadAudienceOptions = useCallback(async (fields: AnnouncementHierarchyFields) => {
        setAudienceLoading(true)

        try {
            const hierarchy = await announcementService.loadProjectHierarchy(fields, {
                sessiontoken: session?.user?.token as string,
                language: locale
            })

            setAudienceOptions(current => ({
                projects: hierarchy.projects.length > 0 || Object.keys(fields).length === 0 ? hierarchy.projects : current.projects,
                towers: hierarchy.towers,
                floors: hierarchy.floors,
                units: hierarchy.units,
                apartment_types: hierarchy.apartment_types
            }))
        } catch (error: any) {
            SwalAlert('error', error?.message ?? messages.create_failed, 'center')
        } finally {
            setAudienceLoading(false)
        }
    }, [locale, messages.create_failed, session])

    const changeAudienceValue = useCallback((key: keyof Pick<AnnouncementFormValues, 'project' | 'tower' | 'floor' | 'unit' | 'apartment_type'>, value: string) => {
        if (key === 'project') {
            const projectId = optionNumber(audienceOptions.projects, value)

            setValues(current => ({
                ...current,
                project: value,
                tower: '',
                floor: '',
                unit: '',
                apartment_type: ''
            }))
            void loadAudienceOptions(projectId ? { project_id: projectId } : {})
            return
        }

        if (key === 'tower') {
            const projectId = optionNumber(audienceOptions.projects, values.project)
            const buildingId = optionNumber(audienceOptions.towers, value)
            const fields: AnnouncementHierarchyFields = {}

            if (projectId) fields.project_id = projectId
            if (buildingId) fields.building_id = buildingId

            setValues(current => ({
                ...current,
                tower: value,
                floor: '',
                unit: '',
                apartment_type: ''
            }))
            void loadAudienceOptions(fields)
            return
        }

        if (key === 'floor') {
            const projectId = optionNumber(audienceOptions.projects, values.project)
            const buildingId = optionNumber(audienceOptions.towers, values.tower)
            const floorId = optionNumber(audienceOptions.floors, value)
            const fields: AnnouncementHierarchyFields = {}

            if (projectId) fields.project_id = projectId
            if (buildingId) fields.building_id = buildingId
            if (floorId) fields.floor_id = floorId

            setValues(current => ({
                ...current,
                floor: value,
                unit: '',
                apartment_type: ''
            }))
            void loadAudienceOptions(fields)
            return
        }

        if (key === 'unit') {
            const selectedUnit = audienceOptions.units.find(item => item.value === value)

            setValues(current => ({
                ...current,
                unit: value,
                apartment_type: selectedUnit?.apartment_type ?? current.apartment_type
            }))
            return
        }

        updateValue(key, value)
    }, [audienceOptions.floors, audienceOptions.projects, audienceOptions.towers, audienceOptions.units, loadAudienceOptions, optionNumber, updateValue, values.project, values.tower])

    const validate = useCallback(() => {
        const nextErrors: FieldErrors = {}

        const title = titleDraftRef.current

        if (!title.trim()) nextErrors.title = messages.required
        if (!values.summary.trim()) nextErrors.summary = messages.required
        if (!values.project) nextErrors.project = messages.project_required
        if (!values.notification_type) nextErrors.notification_type = messages.notification_method_required
        if (isAnnouncementContentEmpty(values.content_html)) nextErrors.content_html = messages.content_required

        // The two publish modes are mutually exclusive: when "publish immediately" is off, a
        // time is mandatory and must sit at/after the moment of validation (submit time), within
        // a 1-minute tolerance for minute-granularity input + the few seconds until the click.
        if (!values.publish_immediately) {
            if (!values.publish_at) {
                nextErrors.publish_at = messages.publish_time_required
            } else {
                const publishTime = new Date(values.publish_at).getTime()

                if (Number.isNaN(publishTime) || publishTime < Date.now() - PUBLISH_TIME_TOLERANCE_MS) {
                    nextErrors.publish_at = messages.publish_time_past
                }
            }
        }

        const oversized = attachments.find(item => item.size > MAX_ANNOUNCEMENT_FILE_SIZE)

        if (oversized) nextErrors.attachments = messages.file_too_large.replace('{file}', oversized.name)

        setErrors(nextErrors)

        return Object.keys(nextErrors).length === 0
    }, [attachments, messages, values.content_html, values.notification_type, values.project, values.publish_at, values.publish_immediately, values.summary])

    const addFiles = useCallback((fileList: FileList | File[]) => {
        const selectedFiles = Array.from(fileList)
        const oversized = selectedFiles.find(file => file.size > MAX_ANNOUNCEMENT_FILE_SIZE)

        if (oversized) {
            setErrors(current => ({ ...current, attachments: messages.file_too_large.replace('{file}', oversized.name) }))
            return
        }

        setAttachments(current => [
            ...current,
            ...selectedFiles.map(file => ({
                id: `${Date.now()}-${file.name}`,
                name: file.name,
                size: file.size,
                type: file.type,
                file
            }))
        ])
        setErrors(current => ({ ...current, attachments: undefined }))
    }, [messages.file_too_large])

    const removeAttachment = useCallback((index: number) => {
        setAttachments(current => current.filter((_, itemIndex) => itemIndex !== index))
    }, [])

    const targetIsEmpty = useMemo(() => (
        !values.tower && !values.floor && !values.unit && !values.apartment_type
    ), [values.apartment_type, values.floor, values.tower, values.unit])

    const buildTargetAudienceText = useCallback(() => {
        if (targetIsEmpty) return ''

        const towerOption = audienceOptions.towers.find(item => item.value === values.tower)
        const floorOption = audienceOptions.floors.find(item => item.value === values.floor)
        const unitOption = audienceOptions.units.find(item => item.value === values.unit)

        return [
            towerOption?.label,
            floorOption?.label,
            unitOption?.label,
            values.apartment_type || undefined
        ].filter(Boolean).join(' / ')
    }, [audienceOptions.floors, audienceOptions.towers, audienceOptions.units, targetIsEmpty, values.apartment_type, values.floor, values.tower, values.unit])

    // The two modes are mutually exclusive and mirrored 1:1 into the payload fields the backend
    // reads: publish_immediately=true clears/ignores publish (backend publishes right after
    // approval, no wait); publish_immediately=false sends the user-picked time converted to a
    // UTC ISO string at call time — datetime-local values carry no timezone info, so
    // `new Date(...)` parses them using the browser's own local timezone first, matching the
    // update/publish flows elsewhere in the app.
    const resolvePublishPayload = useCallback((): Pick<CreateAnnouncementPayload, 'publish' | 'publish_immediately'> => {
        if (values.publish_immediately) {
            return { publish: '', publish_immediately: true }
        }

        const parsed = new Date(values.publish_at)

        return {
            publish: Number.isNaN(parsed.getTime()) ? '' : parsed.toISOString(),
            publish_immediately: false
        }
    }, [values.publish_at, values.publish_immediately])

    // NOTE: notification_type (Mail/SMS UI toggle), avatar_url and attachments are not part
    // of the WF_BO_CREATE_ANNOUNCEMENT contract yet. They stay in local form state only (used
    // to drive the preview) and are intentionally excluded from the payload.
    const buildPayload = useCallback((): CreateAnnouncementPayload => {
        const projectId = optionNumber(audienceOptions.projects, values.project)

        return {
            project_id: projectId ?? 0,
            require_read_confirmation: values.require_read_confirmation,
            is_pinned: values.is_pinned,
            content: values.content_html,
            title: values.title.trim(),
            summary: values.summary.trim(),
            target_audience: buildTargetAudienceText(),
            ...resolvePublishPayload(),
            category: values.category
        }
    }, [audienceOptions.projects, buildTargetAudienceText, optionNumber, resolvePublishPayload, values.category, values.content_html, values.is_pinned, values.project, values.require_read_confirmation, values.summary, values.title])

    const openPreview = useCallback(() => {
        syncTitleValue()
        validate()
        setPreviewOpen(true)
    }, [syncTitleValue, validate])

    const closePreview = useCallback(() => setPreviewOpen(false), [])

    const goBack = useCallback(() => {
        router.push(`/${locale}/announcement`)
    }, [locale, router])

    const submit = useCallback(async () => {
        if (submittingRef.current) return

        const latestTitle = syncTitleValue()

        if (!validate()) return

        submittingRef.current = true
        setSaving(true)

        try {
            const submittedTitle = latestTitle.trim()
            const payload = {
                ...buildPayload(),
                title: submittedTitle
            }
            const response = await announcementService.createAnnouncement(payload, {
                sessiontoken: session?.user?.token as string,
                language: locale
            })

            if (response.status < 200 || response.status >= 300 || hasResponseErrors(response)) {
                throw createWorkflowError(response, { fallback: messages.create_failed })
            }

            const result = mapCreateAnnouncementResponse(response)
            const projectLabel = audienceOptions.projects.find(item => item.value === values.project)?.label ?? values.project
            const targetAudienceLabel = buildTargetAudienceText() || messages.audience_all_residents

            setCreatedAnnouncement({
                ...values,
                title: result.title || submittedTitle,
                id: result.id,
                status: result.status || 'A',
                published_on_utc: result.published_on_utc,
                project_label: projectLabel,
                target_audience_label: targetAudienceLabel
            })
            setCreateSuccess(true)

            SwalAlert('success', messages.create_success, 'center')
        } catch (error: any) {
            // Pass the raw error through: SwalAlert extracts execution_id/message itself
            // (via workflowError-shaped fields) and renders the execution_id highlighted
            // with a copy button when present.
            SwalAlert('error', error, 'center')
        } finally {
            submittingRef.current = false
            setSaving(false)
        }
    }, [audienceOptions.projects, buildPayload, buildTargetAudienceText, locale, messages, session, syncTitleValue, validate, values])

    const startNewAnnouncement = useCallback(() => {
        titleDraftRef.current = DEFAULT_ANNOUNCEMENT_FORM_VALUES.title
        setValues(DEFAULT_ANNOUNCEMENT_FORM_VALUES)
        setMinPublishAt(toLocalDateTimeInputValue(new Date()))
        setAttachments([])
        setErrors({})
        setAudienceOptions({
            projects: initialData.projects,
            towers: initialData.towers,
            floors: initialData.floors,
            units: initialData.units,
            apartment_types: initialData.apartment_types
        })
        setCreateSuccess(false)
        setCreatedAnnouncement(null)
    }, [initialData])

    return {
        values,
        attachments,
        errors,
        saving,
        avatarUploading,
        audienceLoading,
        audienceOptions,
        previewOpen,
        minPublishAt,
        createSuccess,
        createdAnnouncement,
        targetIsEmpty,
        updateValue,
        changePublishAt,
        togglePublishImmediately,
        updateTitleDraft,
        commitTitle,
        setAvatarUploading,
        changeAudienceValue,
        addFiles,
        removeAttachment,
        openPreview,
        closePreview,
        goBack,
        submit,
        startNewAnnouncement
    }
}
