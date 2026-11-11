import { useState } from 'react'

import type { Locale } from '@/configs/i18n'

import { staffService } from '../services/staffService'
import type { CreateUserSuccessData, ProjectPickerOption, StaffCreatePayload, StaffDictionary } from '../types'
import { empty_staff_form, staffText } from '../components/staff-list/staffListHelpers'
import { generateStrongPassword } from '../utils/passwordGenerator'
import { useCreateProjectPicker } from './useCreateProjectPicker'
import { useStaffRolePicker } from './useStaffRolePicker'

type FormErrors = Partial<Record<keyof StaffCreatePayload, string>> & { confirm_password?: string; projects?: string }

type Params = {
    dictionary: StaffDictionary
    sessiontoken?: string
    language?: Locale
}

export function useStaffCreate({ dictionary, sessiontoken, language }: Params) {
    const [form_values, setFormValues] = useState<StaffCreatePayload>(empty_staff_form)
    // confirm_password is frontend-only validation state — it must never be sent to
    // WF_BO_CREATE_USER, so it deliberately lives outside StaffCreatePayload/form_values.
    const [confirm_password, setConfirmPassword] = useState('')
    const [form_errors, setFormErrors] = useState<FormErrors>({})
    const [create_error, setCreateError] = useState<string | null>(null)
    const [saving, setSaving] = useState(false)
    const [success_data, setSuccessData] = useState<CreateUserSuccessData | null>(null)

    const role_picker = useStaffRolePicker({ dictionary, sessiontoken, language })
    const project_picker = useCreateProjectPicker({ dictionary, sessiontoken, language })

    const updateForm = <K extends keyof StaffCreatePayload>(key: K, value: StaffCreatePayload[K]) => {
        setCreateError(null)
        setFormValues(current => {
            const next = { ...current, [key]: value }

            if (key === 'login_name') next.user_name = String(value)

            return next
        })
        setFormErrors(current => ({ ...current, [key]: undefined }))
    }

    const updateConfirmPassword = (value: string) => {
        setCreateError(null)
        setConfirmPassword(value)
        setFormErrors(current => ({ ...current, confirm_password: undefined }))
    }

    // Fills Password + Confirm password with the same freshly generated value and clears any
    // stale validation errors on both fields, so the two stay in sync with what handleCreate()
    // will actually validate/submit — not just what's shown on screen.
    const generatePassword = () => {
        const password = generateStrongPassword()

        setCreateError(null)
        setFormValues(current => ({ ...current, password }))
        setConfirmPassword(password)
        setFormErrors(current => ({ ...current, password: undefined, confirm_password: undefined }))

        return password
    }

    // Pre-selects the current working project in the picker so it stays the sensible default,
    // while still letting the user add more projects or Select all.
    const seedWorkingProject = (project: ProjectPickerOption) => {
        project_picker.selectProject(project)
    }

    const validateForm = () => {
        const errors: FormErrors = {}

        if (!form_values.full_name.trim()) errors.full_name = staffText(dictionary, 'fullname_required', 'Fullname is required.')
        if (form_values.gender === '') errors.gender = staffText(dictionary, 'gender_required', 'Please select a gender.')
        if (!form_values.login_name.trim()) errors.login_name = staffText(dictionary, 'username_required', 'Username is required.')

        if (!form_values.password) {
            errors.password = staffText(dictionary, 'password_required', 'Password is required.')
        } else if (form_values.password.length < 8) {
            errors.password = staffText(dictionary, 'password_min_length', 'Password must be at least 8 characters.')
        }

        if (!confirm_password) {
            errors.confirm_password = staffText(dictionary, 'confirm_password_required', 'Please confirm the password.')
        } else if (form_values.password && confirm_password !== form_values.password) {
            errors.confirm_password = staffText(dictionary, 'confirm_password_mismatch', 'Confirmation password does not match.')
        }

        if (project_picker.selected_count === 0) {
            errors.projects = staffText(dictionary, 'create_project_required', 'Please select at least one project.')
        }

        setFormErrors(errors)

        return Object.keys(errors).length === 0
    }

    const handleCreate = async () => {
        setCreateError(null)

        if (saving) return

        if (!validateForm()) return

        setSaving(true)

        try {
            // assign_role_id and project_code both go to WF_BO_CREATE_USER in this single call —
            // no separate assign-project workflow call after create. Object.keys() on an empty
            // selection naturally yields [], never null/undefined.
            const selected_project_codes = Object.keys(project_picker.selected)

            const created_user = await staffService.create_staff({
                sessiontoken,
                language,
                payload: {
                    ...form_values,
                    full_name: form_values.full_name.trim().replace(/\s+/g, ' '),
                    login_name: form_values.login_name.trim(),
                    user_name: form_values.login_name.trim(),
                    description: form_values.description.trim(),
                    department_code: form_values.department_code.trim(),
                    project_code: selected_project_codes,
                    assign_role_id: role_picker.selected_role_ids
                }
            })

            setSuccessData(created_user)

            return created_user
        } catch (err) {
            const message = err instanceof Error ? err.message : staffText(dictionary, 'create_failed', 'Create user failed.')

            setCreateError(message)

            return null
        } finally {
            setSaving(false)
        }
    }

    return {
        form_values,
        confirm_password,
        form_errors,
        create_error,
        saving,
        success_data,
        role_picker,
        project_picker,
        updateForm,
        updateConfirmPassword,
        generatePassword,
        seedWorkingProject,
        handleCreate
    }
}
