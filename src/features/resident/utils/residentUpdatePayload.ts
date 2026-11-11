import type {
    ResidentContextGeneral,
    ResidentDetail,
    ResidentListStatus,
    ResidentPayload,
    ResidentUpdateProfileRequest
} from '../types'
import { normalizeResidentGender } from './residentGender'

// Profile form values as loaded from the backend (context general + detail). Shared by the profile
// edit form and Change Username, so both send WF_BO_UPDATE_RESIDENT_PROFILE the same owner shape.
export const buildResidentProfileFormFromGeneral = (
    general: ResidentContextGeneral,
    status: ResidentListStatus,
    detail: ResidentDetail | null
): ResidentPayload => ({
    resident_code: general.resident_code,
    user_code: general.user_code,
    full_name: general.full_name,
    gender: normalizeResidentGender(general.gender),
    date_of_birth: general.date_of_birth ? general.date_of_birth.slice(0, 10) : '',
    phone: general.phone ?? '',
    email: general.email ?? '',
    avatar_url: general.avatar_url,
    identity_number: general.identity_number ?? '',
    status,
    nationality: detail?.nationality ?? '',
    nationality_country_id: '',
    description: detail?.description ?? ''
})

const normalizeUserCode = (value: string | null | undefined) => (typeof value === 'string' ? value.trim() : '')

// user_code identifies the resident's user account in WF_BO_UPDATE_RESIDENT_PROFILE. Root resident
// detail first; the owner data (context general) only as fallback when it is the same resident.
// Never the username, never generated — null means the update must not be sent.
export const resolveResidentUserCode = (
    residentId: number,
    detail: Pick<ResidentDetail, 'user_code'> | null,
    general: Pick<ResidentContextGeneral, 'resident_id' | 'user_code'> | null
): string | null => {
    const from_detail = normalizeUserCode(detail?.user_code)

    if (from_detail) return from_detail

    const from_owner = general && general.resident_id === residentId ? normalizeUserCode(general.user_code) : ''

    return from_owner || null
}

export const buildResidentUpdateProfilePayload = (
    id: number,
    form: ResidentPayload,
    user_code: string
): ResidentUpdateProfileRequest => {
    const { nationality_country_id: _nationality_country_id, ...owner } = form

    owner.email = owner.email.trim()
    owner.user_code = user_code

    return {
        id,
        resident_code: form.resident_code,
        user_code,
        owner,
        nationality: form.nationality,
        description: form.description
    }
}

// Change Username: the same profile payload built from the persisted profile (never from unsaved
// edits in the profile tab), with only app_account.username added. No password is sent.
export const buildResidentChangeUsernamePayload = (
    id: number,
    form: ResidentPayload,
    user_code: string,
    new_username: string
): ResidentUpdateProfileRequest => ({
    ...buildResidentUpdateProfilePayload(id, form, user_code),
    app_account: { username: new_username.trim() }
})
