import { residentText, type ResidentDictionary } from '../components/resident-list/residentListHelpers'

export type ChangeUsernameFormValues = {
    new_username: string
}

export type ChangeUsernameFormErrors = Partial<Record<keyof ChangeUsernameFormValues, string>>

// Only non-empty is enforced elsewhere for login names (staff create), so no extra format rule is
// invented here — the backend stays the source of truth for format and uniqueness.
export const validateChangeUsernameForm = (
    dictionary: ResidentDictionary,
    current_username: string,
    values: ChangeUsernameFormValues
): ChangeUsernameFormErrors => {
    const errors: ChangeUsernameFormErrors = {}
    const new_username = values.new_username.trim()

    if (!new_username) {
        errors.new_username = residentText(dictionary, 'change_username_new_required', 'Vui lòng nhập tên đăng nhập mới.')
    } else if (new_username === current_username.trim()) {
        errors.new_username = residentText(dictionary, 'change_username_same', 'Tên đăng nhập mới phải khác tên đăng nhập hiện tại.')
    }

    return errors
}
