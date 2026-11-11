import type { Locale } from '@/configs/i18n'
import type { ProjectSelectorOption } from '@/shared/services/projectLookupService'
import type { PageContentProps } from '@/shared/types'
import type { getDictionary } from '@/shared/utils/getDictionary'
import type { Session } from 'next-auth'

export type AnnouncementOption = {
    label: string
    value: string
    id?: number
    code?: string
    project_id?: number
    building_id?: number
    floor_id?: number
    apartment_id?: number
    apartment_type?: string
    apartment_code?: string
    owner_name?: string
    head_of_household_name?: string
    raw?: unknown
}

export type AnnouncementHierarchyFields = {
    project_id?: number
    building_id?: number
    floor_id?: number
}

export type AnnouncementAttachment = {
    id?: string
    name: string
    size: number
    type: string
    url?: string
    tracker_code?: string | null
    file?: File
}

export type AnnouncementFormValues = {
    title: string
    summary: string
    category: string
    is_pinned: boolean
    require_read_confirmation: boolean
    notification_type: string
    notification_icon: string
    avatar_url: string | null
    avatar_preview_url: string | null
    avatar_file_name: string
    publish_at: string
    publish_immediately: boolean
    content_html: string
    project: string
    tower: string
    floor: string
    unit: string
    apartment_type: string
    translations: AnnouncementTranslations
}

export type AnnouncementLanguage = 'vi' | 'en'

export type AnnouncementTranslationValue = {
    title: string
    summary: string
    content: string
}

export type AnnouncementTranslations = Record<AnnouncementLanguage, AnnouncementTranslationValue>

export type CreateAnnouncementPayload = {
    project_id: number
    require_read_confirmation: boolean
    is_pinned: boolean
    content: string
    title: string
    summary: string
    target_audience: string
    publish: string
    publish_immediately: boolean
    category: string
}

export type UpdateAnnouncementFormValues = {
    title: string
    summary: string
    content: string
    category: string
    status: string
    is_pinned: boolean
    require_read_confirmation: boolean
    target_audience: string
    publish: string
    project: string
    tower: string
    floor: string
    unit: string
    apartment_type: string
}

export type UpdateAnnouncementPayload = {
    id: number
    category: string
    require_read_confirmation: boolean
    is_pinned: boolean
    status: string
    content: string
    title: string
    summary: string
    target_audience: string
    publish: string
}

export type AnnouncementInitialData = {
    notification_types: AnnouncementOption[]
    projects: AnnouncementOption[]
    towers: AnnouncementOption[]
    floors: AnnouncementOption[]
    units: AnnouncementOption[]
    apartment_types: AnnouncementOption[]
}

export type AnnouncementPageProps = PageContentProps & {
    dictionary: Awaited<ReturnType<typeof getDictionary>>
    session: Session | null
    locale: Locale
    initial_data: AnnouncementInitialData
}

export type AnnouncementDictionary = Awaited<ReturnType<typeof getDictionary>>
export type AnnouncementProjectOption = ProjectSelectorOption

export type AnnouncementListPageProps = {
    dictionary: AnnouncementDictionary
    session: Session | null
    locale: Locale
}

export type AnnouncementItem = {
    id: number
    project_id: number
    project_code: string
    title: string
    summary: string
    category: string
    status: string
    published_on_utc: string
    is_pinned: boolean
    require_read_confirmation: boolean
}

export type AnnouncementAttachmentItem = {
    id: number
    announcement_id: number
    file_name: string
    file_url: string
    file_type: string
    file_size: number
    display_order: number
}

export type AnnouncementDetailItem = AnnouncementItem & {
    content: string
    target_audience: string | null
    published_by_user_code: string
    attachments: AnnouncementAttachmentItem[]
    translations?: Partial<AnnouncementTranslations>
}

export type AnnouncementFilterModel = {
    page_size: number
    page_index: number
    search_text: string
    project_id: number
    category: string
    status: string
}

export type AnnouncementSearchRequest = {
    page_size: number
    page_index: number
    search_text: string
    project_id: number
    category?: string
    status?: string
}

export type AnnouncementSearchResponse = {
    items: AnnouncementItem[]
    total_count: number
    total_pages: number
    has_previous_page: boolean
    has_next_page: boolean
    page_index: number
    page_size: number
}

export class AnnouncementWorkflowError extends Error {
    next_action?: string

    constructor(message: string, next_action?: string) {
        super(message)
        this.name = 'AnnouncementWorkflowError'
        this.next_action = next_action
    }
}

export type AnnouncementMessages = {
    required: string
    notification_method_required: string
    content_required: string
    file_too_large: string
    avatar_invalid_type: string
    avatar_upload_failed: string
    upload_failed: string
    create_success: string
    create_failed: string
    project_required: string
    publish_time_past: string
    publish_time_required: string
    audience_all_residents: string
}

export type CreatedAnnouncementSummary = AnnouncementFormValues & {
    id: number
    status: string
    published_on_utc: string
    project_label: string
    target_audience_label: string
}

export const MAX_ANNOUNCEMENT_FILE_SIZE = 5 * 1024 * 1024
export const MAX_ANNOUNCEMENT_SUMMARY_LENGTH = 500

export const DEFAULT_ANNOUNCEMENT_FORM_VALUES: AnnouncementFormValues = {
    title: '',
    summary: '',
    category: 'NEWS',
    is_pinned: false,
    require_read_confirmation: false,
    notification_type: '',
    notification_icon: 'DEFAULT',
    avatar_url: null,
    avatar_preview_url: null,
    avatar_file_name: '',
    publish_at: '',
    publish_immediately: true,
    content_html: '',
    project: '',
    tower: '',
    floor: '',
    unit: '',
    apartment_type: '',
    translations: {
        vi: {
            title: '',
            summary: '',
            content: ''
        },
        en: {
            title: '',
            summary: '',
            content: ''
        }
    }
}
