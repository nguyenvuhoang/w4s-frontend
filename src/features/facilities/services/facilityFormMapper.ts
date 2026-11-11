import type { CreateFacilityFormValues, CreateFacilityRequest, CreateFacilitySetupRequest } from '../types'

export type NormalizedNumericField = number | null

export const normalizeNumericField = (value: unknown): NormalizedNumericField => {
    if (value === '' || value === null || value === undefined) return null

    const number_value = Number(value)

    return Number.isFinite(number_value) && number_value >= 0 ? number_value : null
}

export const normalizeRequiredNumericField = (value: unknown, fallback = 0): number => {
    const number_value = Number(value)

    return Number.isFinite(number_value) && number_value >= 0 ? number_value : fallback
}

export const normalizeTimeForWorkflow = (value: unknown): string => {
    const text = String(value ?? '').trim()

    if (!text) return ''
    if (/^\d{2}:\d{2}:\d{2}$/.test(text)) return text
    if (/^\d{2}:\d{2}$/.test(text)) return `${text}:00`

    return text
}

export const normalizeDateForWorkflow = (value: unknown): string | undefined => {
    const text = String(value ?? '').trim()

    if (!text) return undefined
    if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return `${text}T00:00:00`

    return text
}

export const normalizeFacilityCategoryId = (value: unknown): number => {
    const category_id = Number(value)

    if (!Number.isInteger(category_id) || category_id <= 0) {
        throw new Error('A real facility category ID is required')
    }

    return category_id
}

export const mapCreateFacilityPayload = (form: CreateFacilityFormValues): CreateFacilitySetupRequest => {
    const time_slots_count = form.time_slots.length
    const facility: CreateFacilityRequest = {
        facility_code: form.facility_code,
        project_id: Number(form.project_id),
        facility_category_id: normalizeFacilityCategoryId(form.facility_category_id),
        name: form.name,
        description: form.description || '',
        image_url: form.image_url || '',
        terms_url: form.terms_url || '',
        need_accept_policy: Boolean(form.need_accept_policy),
        facility_policy: form.facility_policy || '',
        require_deposit: Boolean(form.require_deposit),
        deposit_amount: form.require_deposit ? normalizeNumericField(form.deposit_amount) : null,
        max_slots_per_day: normalizeNumericField(form.max_slots_per_day),
        advance_booking_days: normalizeNumericField(form.advance_booking_days),
        building_id: normalizeRequiredNumericField(form.building_id),
        location: form.location || '',
        price_per_hour: normalizeNumericField(form.price_per_hour),
        open_time: normalizeTimeForWorkflow(form.open_time),
        close_time: normalizeTimeForWorkflow(form.close_time),
        max_capacity: normalizeNumericField(form.max_capacity),
        long_description: form.long_description || '',
        rules: form.rules || '',
        max_people_per_booking: normalizeNumericField(form.max_people_per_booking),
        max_slots_per_booking: normalizeNumericField(form.max_slots_per_booking),
        price_note: form.price_note || '',
        display_order: Number(form.display_order || 1)
    }

    return {
        facility,
        time_slots: form.time_slots.map(slot => ({
            ...slot,
            id: Number(slot.id || 0),
            start_time: normalizeTimeForWorkflow(slot.start_time),
            end_time: normalizeTimeForWorkflow(slot.end_time),
            max_capacity: normalizeRequiredNumericField(slot.max_capacity),
            day_of_week: normalizeRequiredNumericField(slot.day_of_week),
            base_price: normalizeRequiredNumericField(slot.base_price)
        })),
        price_rules: form.price_rules.map(rule => {
            const { time_slot_index: raw_time_slot_index, specific_date: raw_specific_date, ...rest_rule } = rule
            const normalized = {
                ...rest_rule,
                id: Number(rule.id || 0),
                adjustment_value: normalizeRequiredNumericField(rule.adjustment_value),
                priority: normalizeRequiredNumericField(rule.priority)
            }
            const time_slot_index = raw_time_slot_index === undefined || raw_time_slot_index === null || raw_time_slot_index === ''
                ? undefined
                : Number(raw_time_slot_index)
            const specific_date = rule.rule_type === 'SPECIFIC_DATE'
                ? normalizeDateForWorkflow(raw_specific_date)
                : undefined

            if (
                time_slot_index !== undefined
                && (!Number.isInteger(time_slot_index) || time_slot_index < 0 || time_slot_index >= time_slots_count)
            ) {
                throw new Error('Invalid time_slot_index')
            }

            return {
                ...normalized,
                ...(time_slot_index === undefined ? {} : { time_slot_index }),
                ...(specific_date ? { specific_date } : {})
            }
        })
    }
}
