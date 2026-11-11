import AddIcon from '@mui/icons-material/Add'
import CloseIcon from '@mui/icons-material/Close'
import DeleteIcon from '@mui/icons-material/Delete'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import RestartAltIcon from '@mui/icons-material/RestartAlt'
import SaveIcon from '@mui/icons-material/Save'
import {
    Alert,
    Box,
    Button,
    Checkbox,
    Chip,
    CircularProgress,
    Divider,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControlLabel,
    IconButton,
    Link,
    MenuItem,
    Stack,
    TextField,
    Typography
} from '@mui/material'
import type { ChangeEvent, FormEvent, ReactNode } from 'react'
import { useMemo, useState } from 'react'

import type {
    CreatedFacilityDetail,
    CreateFacilityFormValues,
    FacilitiesDictionary,
    FacilityCategoryItem,
    FacilityItem,
    FacilityProjectOption,
    UpdatedFacilityDetail
} from '../../types'
import {
    commonText,
    facilitiesText,
    formatFacilityMoney,
    getBooleanLabel,
    getFacilityStatusColor,
    getFacilityStatusLabel
} from './facilityListHelpers'

type Props = {
    dictionary: FacilitiesDictionary
    locale: string
    open: boolean
    loading: boolean
    error: string | null
    mode: 'form' | 'success'
    form_mode: 'create' | 'update'
    created_facility: CreatedFacilityDetail | null
    updated_facility: UpdatedFacilityDetail | null
    editing_facility: FacilityItem | null
    category_options: FacilityCategoryItem[]
    categories_loading: boolean
    project_options: FacilityProjectOption[]
    projects_loading: boolean
    default_project_id: number
    on_close: () => void
    on_submit: (values: CreateFacilityFormValues) => void
    on_create_another: () => void
    on_edit_again: () => void
    on_project_change: (project_id: number) => void
}

type FormErrors = Partial<Record<keyof CreateFacilityFormValues, string>>

const initialForm = (project_id: number): CreateFacilityFormValues => ({
    facility_code: '',
    name: '',
    project_id,
    facility_category_id: '',
    description: '',
    image_url: '',
    terms_url: '',
    need_accept_policy: false,
    facility_policy: '',
    require_deposit: false,
    deposit_amount: '',
    max_slots_per_day: '',
    advance_booking_days: '',
    building_id: '',
    location: '',
    price_per_hour: '',
    open_time: '06:00',
    close_time: '22:00',
    max_capacity: '',
    long_description: '',
    rules: '',
    max_people_per_booking: '',
    max_slots_per_booking: '',
    price_note: '',
    display_order: 1,
    status: 'A',
    time_slots: [
        {
            id: 0,
            name: '',
            start_time: '06:00',
            end_time: '10:00',
            max_capacity: '',
            day_of_week: 1,
            base_price: ''
        }
    ],
    price_rules: []
})

const initialUpdateForm = (facility: FacilityItem): CreateFacilityFormValues => ({
    id: facility.id ?? '',
    facility_code: facility.facility_code ?? '',
    facility_category_code: '',
    name: facility.name ?? '',
    project_id: facility.project_id,
    facility_category_id: facility.facility_category_id ?? '',
    description: facility.description ?? '',
    image_url: facility.image_url ?? '',
    terms_url: facility.terms_url ?? '',
    need_accept_policy: false,
    facility_policy: '',
    require_deposit: Boolean(facility.require_deposit),
    deposit_amount: facility.deposit_amount === null || facility.deposit_amount === undefined ? '' : String(facility.deposit_amount),
    max_slots_per_day: facility.max_slots_per_day === null || facility.max_slots_per_day === undefined ? '' : String(facility.max_slots_per_day),
    advance_booking_days: facility.advance_booking_days === null || facility.advance_booking_days === undefined ? '' : String(facility.advance_booking_days),
    building_id: '',
    location: '',
    price_per_hour: '',
    open_time: '06:00',
    close_time: '22:00',
    max_capacity: '',
    long_description: '',
    rules: '',
    max_people_per_booking: '',
    max_slots_per_booking: '',
    price_note: '',
    display_order: facility.display_order ?? 1,
    status: facility.status || 'A',
    time_slots: [],
    price_rules: []
})

const grid_sx = {
    display: 'grid',
    gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
    gap: 2
}

const DetailRow = ({ label, children }: { label: string; children: ReactNode }) => (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '210px 1fr' }, gap: 1.5, alignItems: 'start' }}>
        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 700 }}>
            {label}
        </Typography>
        <Box sx={{ minWidth: 0 }}>{children}</Box>
    </Box>
)

const displayText = (value: unknown) => {
    if (value === null || value === undefined || value === '') return '-'

    return String(value)
}

const isValidNumber = (value: unknown) => value !== '' && Number.isFinite(Number(value))
const isNonNegativeNumber = (value: unknown) => isValidNumber(value) && Number(value) >= 0
const isNegativeNumberInput = (value: unknown) => value !== '' && Number.isFinite(Number(value)) && Number(value) < 0
const numericFields = new Set<keyof CreateFacilityFormValues>([
    'deposit_amount',
    'max_slots_per_day',
    'advance_booking_days',
    'building_id',
    'price_per_hour',
    'max_capacity',
    'max_people_per_booking',
    'max_slots_per_booking',
    'display_order'
])
const numericTimeSlotFields = new Set<keyof CreateFacilityFormValues['time_slots'][number]>([
    'id',
    'max_capacity',
    'day_of_week',
    'base_price'
])
const numericPriceRuleFields = new Set<keyof CreateFacilityFormValues['price_rules'][number]>([
    'id',
    'time_slot_index',
    'adjustment_value',
    'priority'
])

const normalizeTimeInput = (value: string | null | undefined) => {
    if (!value) return ''

    const match = String(value).match(/^(\d{1,2}):(\d{2})/)

    return match ? `${match[1].padStart(2, '0')}:${match[2]}` : ''
}

const getCategoryOptionValue = (category: FacilityCategoryItem) => {
    const category_id = category.id ?? category.facility_category_id

    if (Number.isInteger(category_id) && Number(category_id) > 0) return Number(category_id)

    return undefined
}

const FacilityCreateDialog = ({
    dictionary,
    locale,
    open,
    loading,
    error,
    mode,
    form_mode,
    created_facility,
    updated_facility,
    editing_facility,
    category_options,
    categories_loading,
    project_options,
    projects_loading,
    default_project_id,
    on_close,
    on_submit,
    on_create_another,
    on_edit_again,
    on_project_change
}: Props) => {
    const [form, setForm] = useState<CreateFacilityFormValues>(() => (
        form_mode === 'update' && editing_facility ? initialUpdateForm(editing_facility) : initialForm(default_project_id)
    ))
    const [errors, setErrors] = useState<FormErrors>({})
    const project_category_options = useMemo(
        () => category_options.filter(category => category.project_id === Number(form.project_id)),
        [category_options, form.project_id]
    )

    const category_select_options = useMemo(
        () => project_category_options.filter(category => {
            const has_real_id = typeof getCategoryOptionValue(category) === 'number'

            if (!has_real_id) {
            }

            return has_real_id
        }),
        [project_category_options]
    )
    const has_project_options = project_options.length > 0
    const project_value_is_valid = !has_project_options || project_options.some(project => project.id === Number(form.project_id))
    const project_select_value = project_value_is_valid ? form.project_id : ''

    const setField = <K extends keyof CreateFacilityFormValues>(key: K, value: CreateFacilityFormValues[K]) => {
        setForm(current => {
            const next = { ...current, [key]: value }

            if (key === 'require_deposit' && value === false) {
                next.deposit_amount = ''
            }

            return next
        })
        setErrors(current => ({ ...current, [key]: undefined }))
    }

    const handleTextChange = (key: keyof CreateFacilityFormValues) => (
        event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        const value = event.target.value

        if (numericFields.has(key) && isNegativeNumberInput(value)) return

        if (key === 'project_id') {
            setForm(current => ({ ...current, project_id: value, facility_category_id: '' }))
            setErrors(current => ({ ...current, project_id: undefined, facility_category_id: undefined }))

            if (isValidNumber(value)) {
                on_project_change(Number(value))
            }

            return
        }

        setField(key, value as never)
    }

    const handleCategoryChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const category_id = Number(event.target.value)
        const selected_category = category_select_options.find(
            category => getCategoryOptionValue(category) === category_id
        )

        setForm(current => ({
            ...current,
            facility_category_id: category_id,
            facility_category_code: selected_category?.category_code ?? ''
        }))
        setErrors(current => ({ ...current, facility_category_id: undefined }))
    }

    const handleTimeSlotChange = (
        index: number,
        key: keyof CreateFacilityFormValues['time_slots'][number],
        value: string | number
    ) => {
        if (numericTimeSlotFields.has(key) && isNegativeNumberInput(value)) return

        setForm(current => ({
            ...current,
            time_slots: current.time_slots.map((slot, slot_index) => (
                slot_index === index ? { ...slot, [key]: value } : slot
            ))
        }))
    }

    const handleAddTimeSlot = () => {
        setForm(current => ({
            ...current,
            time_slots: [
                ...current.time_slots,
                {
                    id: 0,
                    name: '',
                    start_time: current.open_time || '06:00',
                    end_time: current.close_time || '22:00',
                    max_capacity: '',
                    day_of_week: 1,
                    base_price: ''
                }
            ]
        }))
    }

    const handleRemoveTimeSlot = (index: number) => {
        setForm(current => ({
            ...current,
            time_slots: current.time_slots.filter((_, slot_index) => slot_index !== index),
            price_rules: current.price_rules
                .filter(rule => rule.time_slot_index === undefined || rule.time_slot_index === '' || Number(rule.time_slot_index) !== index)
                .map(rule => {
                    if (rule.time_slot_index === undefined || rule.time_slot_index === '' || Number(rule.time_slot_index) < index) return rule

                    return { ...rule, time_slot_index: Number(rule.time_slot_index) - 1 }
                })
        }))
    }

    const handlePriceRuleChange = (
        index: number,
        key: keyof CreateFacilityFormValues['price_rules'][number],
        value: string | number
    ) => {
        if (numericPriceRuleFields.has(key) && isNegativeNumberInput(value)) return

        setForm(current => ({
            ...current,
            price_rules: current.price_rules.map((rule, rule_index) => (
                rule_index === index ? { ...rule, [key]: value } : rule
            ))
        }))
    }

    const handleAddPriceRule = () => {
        setForm(current => ({
            ...current,
            price_rules: [
                ...current.price_rules,
                {
                    id: 0,
                    time_slot_index: current.time_slots.length > 0 ? 0 : undefined,
                    rule_type: 'WEEKDAY',
                    price_adjustment_type: 'FIXED_PRICE',
                    adjustment_value: '',
                    priority: current.price_rules.length + 1
                }
            ]
        }))
    }

    const handleRemovePriceRule = (index: number) => {
        setForm(current => ({
            ...current,
            price_rules: current.price_rules.filter((_, rule_index) => rule_index !== index)
        }))
    }

    const validate = () => {
        const next_errors: FormErrors = {}

        if (form_mode === 'create' && !form.facility_code.trim()) next_errors.facility_code = facilitiesText(dictionary, 'validation_required', 'Required')
        if (form_mode === 'update' && !isValidNumber(form.id)) next_errors.id = facilitiesText(dictionary, 'facility_id_not_found', 'Facility ID was not found')
        if (!form.name.trim()) next_errors.name = facilitiesText(dictionary, 'validation_required', 'Required')
        if (form_mode === 'create') {
            if (!isValidNumber(form.project_id)) next_errors.project_id = facilitiesText(dictionary, 'validation_required', 'Required')
            if (has_project_options && !project_options.some(project => project.id === Number(form.project_id))) {
                next_errors.project_id = facilitiesText(dictionary, 'validation_project', 'Select a valid project')
            }
            if (!has_project_options && !projects_loading) {
                next_errors.project_id = facilitiesText(dictionary, 'project_options_empty', 'No projects found')
            }
        }
        const selected_category_id = Number(form.facility_category_id)
        const has_valid_category = category_select_options.some(
            category => getCategoryOptionValue(category) === selected_category_id
        )

        if (!isValidNumber(form.facility_category_id) || !has_valid_category) {
            next_errors.facility_category_id = facilitiesText(
                dictionary,
                'category_id_missing',
                'A real facility category ID is required'
            )
        }
        if (!isNonNegativeNumber(form.display_order)) next_errors.display_order = facilitiesText(dictionary, 'validation_non_negative_number', 'Enter a number greater than or equal to 0')
        if (form_mode === 'update' && !form.status) next_errors.status = facilitiesText(dictionary, 'validation_required', 'Required')

        if (form_mode === 'create') {
            if (!isValidNumber(form.building_id)) next_errors.building_id = facilitiesText(dictionary, 'validation_required', 'Required')
            if (!form.location.trim()) next_errors.location = facilitiesText(dictionary, 'validation_required', 'Required')
            if (!form.open_time) next_errors.open_time = facilitiesText(dictionary, 'validation_required', 'Required')
            if (!form.close_time) next_errors.close_time = facilitiesText(dictionary, 'validation_required', 'Required')
            if (form.open_time && form.close_time && form.close_time <= form.open_time) {
                next_errors.close_time = facilitiesText(dictionary, 'validation_end_time', 'End time must be later than start time')
            }
            if (form.time_slots.some(slot => !slot.name.trim() || !slot.start_time || !slot.end_time || !isNonNegativeNumber(slot.max_capacity) || !isNonNegativeNumber(slot.day_of_week) || !isNonNegativeNumber(slot.base_price))) {
                next_errors.time_slots = facilitiesText(dictionary, 'validation_time_slots', 'Complete all time slot fields')
            }
            if (form.price_rules.some(rule => !rule.rule_type || !rule.price_adjustment_type || !isNonNegativeNumber(rule.adjustment_value) || !isNonNegativeNumber(rule.priority))) {
                next_errors.price_rules = facilitiesText(dictionary, 'validation_price_rules', 'Complete all price rule fields')
            }
        }

        const optional_numeric_fields: Array<keyof CreateFacilityFormValues> = form_mode === 'create'
            ? [
                'max_slots_per_day',
                'advance_booking_days',
                'price_per_hour',
                'max_capacity',
                'max_people_per_booking',
                'max_slots_per_booking'
            ]
            : ['max_slots_per_day', 'advance_booking_days']

        optional_numeric_fields.forEach(field => {
            const value = form[field]

            if (value !== '' && !isNonNegativeNumber(value)) {
                next_errors[field] = facilitiesText(dictionary, 'validation_non_negative_number', 'Enter a number greater than or equal to 0')
            }
        })

        if (form.require_deposit) {
            if (!isNonNegativeNumber(form.deposit_amount)) {
                next_errors.deposit_amount = facilitiesText(dictionary, 'validation_deposit_amount', 'Enter a valid amount greater than or equal to 0')
            }
        }

        setErrors(next_errors)

        return Object.keys(next_errors).length === 0
    }

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()

        if (!validate()) return

        on_submit(form)
    }

    const handleReset = () => {
        setForm(form_mode === 'update' && editing_facility ? initialUpdateForm(editing_facility) : initialForm(default_project_id))
        setErrors({})
        on_project_change(default_project_id)
    }

    const renderForm = () => (
        <Box component="form" id="facility-create-form" onSubmit={handleSubmit}>
            <Stack spacing={2.25}>
                {error && <Alert severity="error">{error}</Alert>}

                <Box sx={grid_sx}>
                    <TextField
                        required
                        label={facilitiesText(dictionary, 'field_facility_code', 'Facility Code')}
                        value={form.facility_code}
                        onChange={handleTextChange('facility_code')}
                        error={Boolean(errors.facility_code)}
                        helperText={errors.facility_code}
                        disabled={loading}
                    />
                    <TextField
                        required
                        label={facilitiesText(dictionary, 'field_facility_name', 'Facility Name')}
                        value={form.name}
                        onChange={handleTextChange('name')}
                        error={Boolean(errors.name)}
                        helperText={errors.name}
                        disabled={loading}
                    />
                    {form_mode === 'create' && (
                        <TextField
                            required
                            select
                            label={facilitiesText(dictionary, 'project', 'Project')}
                            value={project_select_value}
                            onChange={handleTextChange('project_id')}
                            error={Boolean(errors.project_id)}
                            helperText={
                                errors.project_id
                                || (!has_project_options && !projects_loading
                                    ? facilitiesText(dictionary, 'project_options_empty', 'No projects found')
                                    : undefined)
                            }
                            disabled={loading || projects_loading || !has_project_options}
                            InputProps={{
                                endAdornment: projects_loading ? <CircularProgress color="inherit" size={16} /> : undefined
                            }}
                        >
                            {project_options.map(project => (
                                <MenuItem key={project.id} value={project.id}>
                                    {project.name || project.code || project.id}
                                </MenuItem>
                            ))}
                        </TextField>
                    )}
                    <TextField
                        required
                        select
                        label={facilitiesText(dictionary, 'facility_category', 'Facility Category')}
                        value={form.facility_category_id}
                        onChange={handleCategoryChange}
                        error={Boolean(errors.facility_category_id)}
                        helperText={
                            errors.facility_category_id
                            || (category_select_options.length === 0 && !categories_loading
                                ? facilitiesText(
                                    dictionary,
                                    project_category_options.length > 0 ? 'category_id_missing' : 'category_options_empty',
                                    project_category_options.length > 0
                                        ? 'Facility Categories API did not return a real category ID'
                                        : 'No facility categories found for this project'
                                )
                                : undefined)
                        }
                        disabled={loading || categories_loading || category_select_options.length === 0}
                        InputProps={{
                            endAdornment: categories_loading ? <CircularProgress color="inherit" size={16} /> : undefined
                        }}
                    >
                        {category_select_options.map(category => {
                            const category_id = getCategoryOptionValue(category)

                            return (
                                <MenuItem key={`${category.project_id}-${category.category_code}-${category_id}`} value={category_id}>
                                    {category.name || category.category_code}
                                </MenuItem>
                            )
                        })}
                    </TextField>
                </Box>

                <TextField
                    multiline
                    minRows={3}
                    label={facilitiesText(dictionary, 'field_description', 'Description')}
                    value={form.description}
                    onChange={handleTextChange('description')}
                    disabled={loading}
                />

                {form_mode === 'create' && (
                    <>
                        <Divider />
                        <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                            {facilitiesText(dictionary, 'section_booking_setup', 'Booking Setup')}
                        </Typography>
                        <Box sx={grid_sx}>
                            <TextField
                                required
                                type="number"
                                label={facilitiesText(dictionary, 'field_building_id', 'Building ID')}
                                value={form.building_id}
                                onChange={handleTextChange('building_id')}
                                error={Boolean(errors.building_id)}
                                helperText={errors.building_id}
                                disabled={loading}
                            />
                            <TextField
                                required
                                label={facilitiesText(dictionary, 'field_location', 'Location')}
                                value={form.location}
                                onChange={handleTextChange('location')}
                                error={Boolean(errors.location)}
                                helperText={errors.location}
                                disabled={loading}
                            />
                            <TextField
                                type="time"
                                label={facilitiesText(dictionary, 'field_open_time', 'Open Time')}
                                value={normalizeTimeInput(form.open_time)}
                                onChange={handleTextChange('open_time')}
                                error={Boolean(errors.open_time)}
                                helperText={errors.open_time}
                                disabled={loading}
                                slotProps={{ inputLabel: { shrink: true }, htmlInput: { step: 1 } }}
                            />
                            <TextField
                                type="time"
                                label={facilitiesText(dictionary, 'field_close_time', 'Close Time')}
                                value={normalizeTimeInput(form.close_time)}
                                onChange={handleTextChange('close_time')}
                                error={Boolean(errors.close_time)}
                                helperText={errors.close_time}
                                disabled={loading}
                                slotProps={{ inputLabel: { shrink: true }, htmlInput: { step: 1 } }}
                            />
                            <TextField
                                type="number"
                                label={facilitiesText(dictionary, 'field_price_per_hour', 'Price Per Hour')}
                                value={form.price_per_hour}
                                onChange={handleTextChange('price_per_hour')}
                                disabled={loading}
                            />
                            <TextField
                                type="number"
                                label={facilitiesText(dictionary, 'field_max_capacity', 'Max Capacity')}
                                value={form.max_capacity}
                                onChange={handleTextChange('max_capacity')}
                                disabled={loading}
                            />
                            <TextField
                                type="number"
                                label={facilitiesText(dictionary, 'field_max_people_per_booking', 'Max People / Booking')}
                                value={form.max_people_per_booking}
                                onChange={handleTextChange('max_people_per_booking')}
                                disabled={loading}
                            />
                            <TextField
                                type="number"
                                label={facilitiesText(dictionary, 'field_max_slots_per_booking', 'Max Slots / Booking')}
                                value={form.max_slots_per_booking}
                                onChange={handleTextChange('max_slots_per_booking')}
                                disabled={loading}
                            />
                        </Box>
                        <TextField
                            multiline
                            minRows={3}
                            label={facilitiesText(dictionary, 'field_long_description', 'Long Description')}
                            value={form.long_description}
                            onChange={handleTextChange('long_description')}
                            disabled={loading}
                        />
                        <TextField
                            multiline
                            minRows={3}
                            label={facilitiesText(dictionary, 'field_rules', 'Rules JSON')}
                            value={form.rules}
                            onChange={handleTextChange('rules')}
                            disabled={loading}
                        />
                        <TextField
                            multiline
                            minRows={2}
                            label={facilitiesText(dictionary, 'field_price_note', 'Price Note')}
                            value={form.price_note}
                            onChange={handleTextChange('price_note')}
                            disabled={loading}
                        />
                        <FormControlLabel
                            control={(
                                <Checkbox
                                    checked={form.need_accept_policy}
                                    onChange={event => setField('need_accept_policy', event.target.checked)}
                                    disabled={loading}
                                />
                            )}
                            label={facilitiesText(dictionary, 'field_need_accept_policy', 'Need Accept Policy')}
                        />
                        <TextField
                            multiline
                            minRows={2}
                            label={facilitiesText(dictionary, 'field_facility_policy', 'Facility Policy')}
                            value={form.facility_policy}
                            onChange={handleTextChange('facility_policy')}
                            disabled={loading}
                        />
                    </>
                )}

                <Box sx={grid_sx}>
                    <TextField
                        label={facilitiesText(dictionary, 'field_image_url', 'Image URL')}
                        value={form.image_url}
                        onChange={handleTextChange('image_url')}
                        disabled={loading}
                    />
                    <TextField
                        label={facilitiesText(dictionary, 'field_terms_url', 'Terms URL')}
                        value={form.terms_url}
                        onChange={handleTextChange('terms_url')}
                        disabled={loading}
                    />
                    <TextField
                        type="number"
                        label={facilitiesText(dictionary, 'field_max_slots_per_day', 'Max Slots Per Day')}
                        value={form.max_slots_per_day}
                        onChange={handleTextChange('max_slots_per_day')}
                        disabled={loading}
                    />
                    <TextField
                        type="number"
                        label={facilitiesText(dictionary, 'field_advance_booking_days', 'Advance Booking Days')}
                        value={form.advance_booking_days}
                        onChange={handleTextChange('advance_booking_days')}
                        disabled={loading}
                    />
                    <TextField
                        required
                        type="number"
                        label={facilitiesText(dictionary, 'field_display_order', 'Display Order')}
                        value={form.display_order}
                        onChange={handleTextChange('display_order')}
                        error={Boolean(errors.display_order)}
                        helperText={errors.display_order}
                        disabled={loading}
                    />
                    <TextField
                        type="number"
                        label={facilitiesText(dictionary, 'field_deposit_amount', 'Deposit Amount')}
                        value={form.deposit_amount}
                        onChange={handleTextChange('deposit_amount')}
                        error={Boolean(errors.deposit_amount)}
                        helperText={errors.deposit_amount}
                        disabled={loading || !form.require_deposit}
                    />
                </Box>

                <FormControlLabel
                    control={(
                        <Checkbox
                            checked={form.require_deposit}
                            onChange={event => setField('require_deposit', event.target.checked)}
                            disabled={loading}
                        />
                    )}
                    label={facilitiesText(dictionary, 'field_require_deposit', 'Require Deposit')}
                />
                {form_mode === 'create' && (
                    <>
                        <Divider />
                        <Stack direction="row" justifyContent="space-between" alignItems="center" gap={2}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                                {facilitiesText(dictionary, 'section_time_slots', 'Time Slots')}
                            </Typography>
                            <Button startIcon={<AddIcon />} onClick={handleAddTimeSlot} disabled={loading}>
                                {facilitiesText(dictionary, 'add_time_slot', 'Add Time Slot')}
                            </Button>
                        </Stack>
                        {errors.time_slots && <Alert severity="warning">{errors.time_slots}</Alert>}
                        <Stack spacing={2}>
                            {form.time_slots.map((slot, index) => (
                                <Box key={index} sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1.4fr 1fr 1fr 1fr 1fr 1fr auto' }, gap: 1.5, alignItems: 'start' }}>
                                    <TextField
                                        required
                                        label={facilitiesText(dictionary, 'field_time_slot_name', 'Name')}
                                        value={slot.name}
                                        onChange={event => handleTimeSlotChange(index, 'name', event.target.value)}
                                        disabled={loading}
                                    />
                                    <TextField
                                        required
                                        type="time"
                                        label={facilitiesText(dictionary, 'field_start_time', 'Start Time')}
                                        value={normalizeTimeInput(slot.start_time)}
                                        onChange={event => handleTimeSlotChange(index, 'start_time', event.target.value)}
                                        disabled={loading}
                                        slotProps={{ inputLabel: { shrink: true }, htmlInput: { step: 1 } }}
                                    />
                                    <TextField
                                        required
                                        type="time"
                                        label={facilitiesText(dictionary, 'field_end_time', 'End Time')}
                                        value={normalizeTimeInput(slot.end_time)}
                                        onChange={event => handleTimeSlotChange(index, 'end_time', event.target.value)}
                                        disabled={loading}
                                        slotProps={{ inputLabel: { shrink: true }, htmlInput: { step: 1 } }}
                                    />
                                    <TextField
                                        required
                                        type="number"
                                        label={facilitiesText(dictionary, 'field_max_capacity', 'Capacity')}
                                        value={slot.max_capacity}
                                        onChange={event => handleTimeSlotChange(index, 'max_capacity', event.target.value)}
                                        disabled={loading}
                                    />
                                    <TextField
                                        required
                                        type="number"
                                        label={facilitiesText(dictionary, 'field_day_of_week', 'Day')}
                                        value={slot.day_of_week}
                                        onChange={event => handleTimeSlotChange(index, 'day_of_week', event.target.value)}
                                        disabled={loading}
                                    />
                                    <TextField
                                        required
                                        type="number"
                                        label={facilitiesText(dictionary, 'field_base_price', 'Base Price')}
                                        value={slot.base_price}
                                        onChange={event => handleTimeSlotChange(index, 'base_price', event.target.value)}
                                        disabled={loading}
                                    />
                                    <IconButton
                                        aria-label={facilitiesText(dictionary, 'remove_time_slot', 'Remove Time Slot')}
                                        onClick={() => handleRemoveTimeSlot(index)}
                                        disabled={loading || form.time_slots.length === 1}
                                    >
                                        <DeleteIcon />
                                    </IconButton>
                                </Box>
                            ))}
                        </Stack>

                        <Stack direction="row" justifyContent="space-between" alignItems="center" gap={2}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                                {facilitiesText(dictionary, 'section_price_rules', 'Price Rules')}
                            </Typography>
                            <Button startIcon={<AddIcon />} onClick={handleAddPriceRule} disabled={loading}>
                                {facilitiesText(dictionary, 'add_price_rule', 'Add Price Rule')}
                            </Button>
                        </Stack>
                        {errors.price_rules && <Alert severity="warning">{errors.price_rules}</Alert>}
                        <Stack spacing={2}>
                            {form.price_rules.length === 0 && (
                                <Typography variant="body2" color="text.secondary">
                                    {facilitiesText(dictionary, 'price_rules_empty', 'No price rules configured.')}
                                </Typography>
                            )}
                            {form.price_rules.map((rule, index) => (
                                <Box key={index} sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr 1fr 1fr 1fr auto' }, gap: 1.5, alignItems: 'start' }}>
                                    <TextField
                                        select
                                        label={facilitiesText(dictionary, 'field_time_slot_index', 'Time Slot')}
                                        value={rule.time_slot_index ?? ''}
                                        onChange={event => handlePriceRuleChange(index, 'time_slot_index', event.target.value)}
                                        disabled={loading}
                                    >
                                        <MenuItem value="">{facilitiesText(dictionary, 'all_time_slots', 'All')}</MenuItem>
                                        {form.time_slots.map((slot, slot_index) => (
                                            <MenuItem key={slot_index} value={slot_index}>
                                                {slot.name || `${facilitiesText(dictionary, 'section_time_slots', 'Time Slots')} ${slot_index + 1}`}
                                            </MenuItem>
                                        ))}
                                    </TextField>
                                    <TextField
                                        required
                                        select
                                        label={facilitiesText(dictionary, 'field_rule_type', 'Rule Type')}
                                        value={rule.rule_type}
                                        onChange={event => handlePriceRuleChange(index, 'rule_type', event.target.value)}
                                        disabled={loading}
                                    >
                                        <MenuItem value="WEEKDAY">WEEKDAY</MenuItem>
                                        <MenuItem value="WEEKEND">WEEKEND</MenuItem>
                                        <MenuItem value="SPECIFIC_DATE">SPECIFIC_DATE</MenuItem>
                                    </TextField>
                                    <TextField
                                        type="date"
                                        label={facilitiesText(dictionary, 'field_specific_date', 'Specific Date')}
                                        value={rule.specific_date ? String(rule.specific_date).slice(0, 10) : ''}
                                        onChange={event => handlePriceRuleChange(index, 'specific_date', event.target.value)}
                                        disabled={loading || rule.rule_type !== 'SPECIFIC_DATE'}
                                        slotProps={{ inputLabel: { shrink: true } }}
                                    />
                                    <TextField
                                        required
                                        select
                                        label={facilitiesText(dictionary, 'field_price_adjustment_type', 'Adjustment Type')}
                                        value={rule.price_adjustment_type}
                                        onChange={event => handlePriceRuleChange(index, 'price_adjustment_type', event.target.value)}
                                        disabled={loading}
                                    >
                                        <MenuItem value="FIXED_PRICE">FIXED_PRICE</MenuItem>
                                        <MenuItem value="PERCENT_ADD">PERCENT_ADD</MenuItem>
                                        <MenuItem value="AMOUNT_ADD">AMOUNT_ADD</MenuItem>
                                    </TextField>
                                    <TextField
                                        required
                                        type="number"
                                        label={facilitiesText(dictionary, 'field_adjustment_value', 'Value')}
                                        value={rule.adjustment_value}
                                        onChange={event => handlePriceRuleChange(index, 'adjustment_value', event.target.value)}
                                        disabled={loading}
                                    />
                                    <TextField
                                        required
                                        type="number"
                                        label={facilitiesText(dictionary, 'field_priority', 'Priority')}
                                        value={rule.priority}
                                        onChange={event => handlePriceRuleChange(index, 'priority', event.target.value)}
                                        disabled={loading}
                                    />
                                    <IconButton
                                        aria-label={facilitiesText(dictionary, 'remove_price_rule', 'Remove Price Rule')}
                                        onClick={() => handleRemovePriceRule(index)}
                                        disabled={loading}
                                    >
                                        <DeleteIcon />
                                    </IconButton>
                                </Box>
                            ))}
                        </Stack>
                    </>
                )}
                {form_mode === 'update' && (
                    <TextField
                        required
                        select
                        label={facilitiesText(dictionary, 'field_status', 'Status')}
                        value={form.status || 'A'}
                        onChange={handleTextChange('status')}
                        error={Boolean(errors.status)}
                        helperText={errors.status}
                        disabled={loading}
                    >
                        <MenuItem value="A">{facilitiesText(dictionary, 'status_active', 'Active')}</MenuItem>
                        <MenuItem value="I">{facilitiesText(dictionary, 'status_inactive', 'Inactive')}</MenuItem>
                    </TextField>
                )}
            </Stack>
        </Box>
    )

    const result_facility = form_mode === 'update' ? updated_facility : created_facility

    const renderDetail = () => result_facility ? (
        <Stack spacing={2.25}>
            <Alert severity="success">
                {form_mode === 'update'
                    ? facilitiesText(dictionary, 'update_success', 'Facility has been updated')
                    : facilitiesText(dictionary, 'create_success', 'Facility has been created')}
            </Alert>
            {'id' in result_facility && (
                <DetailRow label="ID">
                    <Typography>{displayText(result_facility.id)}</Typography>
                </DetailRow>
            )}
            <DetailRow label={facilitiesText(dictionary, 'field_facility_code', 'Facility Code')}>
                <Typography sx={{ fontWeight: 800 }}>
                    {displayText('facility_code' in result_facility ? result_facility.facility_code : result_facility.facility_category_code)}
                </Typography>
            </DetailRow>
            <DetailRow label={facilitiesText(dictionary, 'field_facility_name', 'Facility Name')}>
                <Typography>{displayText(result_facility.name)}</Typography>
            </DetailRow>
            {form_mode === 'create' && 'project_id' in result_facility && (
                <DetailRow label={facilitiesText(dictionary, 'project_id', 'Project ID')}>
                    <Typography>{displayText(result_facility.project_id)}</Typography>
                </DetailRow>
            )}
            <DetailRow label={facilitiesText(dictionary, 'facility_category_id', 'Facility Category ID')}>
                <Typography>{displayText(result_facility.facility_category_id)}</Typography>
            </DetailRow>
            <DetailRow label={facilitiesText(dictionary, 'field_description', 'Description')}>
                <Typography sx={{ overflowWrap: 'anywhere' }}>{displayText(result_facility.description)}</Typography>
            </DetailRow>
            <DetailRow label={facilitiesText(dictionary, 'field_image_url', 'Image URL')}>
                {result_facility.image_url ? (
                    <Stack spacing={1}>
                        <Box
                            component="img"
                            src={result_facility.image_url}
                            alt={result_facility.name}
                            sx={{ width: 96, height: 72, objectFit: 'cover', borderRadius: 1, border: 1, borderColor: 'divider' }}
                        />
                        <Link href={result_facility.image_url} target="_blank" rel="noopener noreferrer" sx={{ overflowWrap: 'anywhere' }}>
                            {result_facility.image_url}
                        </Link>
                    </Stack>
                ) : (
                    <Typography color="text.secondary">-</Typography>
                )}
            </DetailRow>
            <DetailRow label={facilitiesText(dictionary, 'field_terms_url', 'Terms URL')}>
                {result_facility.terms_url ? (
                    <Link href={result_facility.terms_url} target="_blank" rel="noopener noreferrer" sx={{ overflowWrap: 'anywhere' }}>
                        {result_facility.terms_url} <OpenInNewIcon fontSize="inherit" />
                    </Link>
                ) : (
                    <Typography color="text.secondary">-</Typography>
                )}
            </DetailRow>
            <DetailRow label={facilitiesText(dictionary, 'field_require_deposit', 'Require Deposit')}>
                <Typography>{getBooleanLabel(dictionary, result_facility.require_deposit)}</Typography>
            </DetailRow>
            <DetailRow label={facilitiesText(dictionary, 'field_deposit_amount', 'Deposit Amount')}>
                <Typography>{result_facility.deposit_amount === '' ? '-' : formatFacilityMoney(Number(result_facility.deposit_amount), locale)}</Typography>
            </DetailRow>
            <DetailRow label={facilitiesText(dictionary, 'field_max_slots_per_day', 'Max Slots Per Day')}>
                <Typography>{displayText(result_facility.max_slots_per_day)}</Typography>
            </DetailRow>
            <DetailRow label={facilitiesText(dictionary, 'field_advance_booking_days', 'Advance Booking Days')}>
                <Typography>{displayText(result_facility.advance_booking_days)}</Typography>
            </DetailRow>
            <DetailRow label={facilitiesText(dictionary, 'field_display_order', 'Display Order')}>
                <Typography>{displayText(result_facility.display_order)}</Typography>
            </DetailRow>
            {form_mode === 'update' && (
                <DetailRow label={facilitiesText(dictionary, 'field_status', 'Status')}>
                    <Chip
                        size="small"
                        color={getFacilityStatusColor(result_facility.status || 'A')}
                        label={getFacilityStatusLabel(dictionary, result_facility.status || 'A')}
                    />
                </DetailRow>
            )}
        </Stack>
    ) : (
        <Alert severity="success">
            {form_mode === 'update'
                ? facilitiesText(dictionary, 'update_success', 'Facility has been updated')
                : facilitiesText(dictionary, 'create_success', 'Facility has been created')}
        </Alert>
    )

    return (
        <Dialog open={open} onClose={on_close} fullWidth maxWidth="md">
            <DialogTitle sx={{ pr: 6 }}>
                {mode === 'success'
                    ? (form_mode === 'update'
                        ? facilitiesText(dictionary, 'updated_facility_title', 'Updated Facility')
                        : facilitiesText(dictionary, 'created_facility_title', 'Created Facility'))
                    : (form_mode === 'update'
                        ? facilitiesText(dictionary, 'update_facility_title', 'Update Facility')
                        : facilitiesText(dictionary, 'create_facility_title', 'Create Facility'))}
                <IconButton
                    aria-label={commonText(dictionary, 'close', 'Close')}
                    onClick={on_close}
                    disabled={loading}
                    sx={{ position: 'absolute', right: 12, top: 10 }}
                >
                    <CloseIcon />
                </IconButton>
            </DialogTitle>
            <DialogContent dividers>
                {mode === 'success' ? renderDetail() : renderForm()}
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 2 }}>
                {mode === 'success' ? (
                    <>
                        <Button onClick={on_close}>{commonText(dictionary, 'close', 'Close')}</Button>
                        {form_mode === 'create' ? (
                            <Button variant="outlined" startIcon={<AddIcon />} onClick={on_create_another}>
                                {facilitiesText(dictionary, 'create_another', 'Create Another')}
                            </Button>
                        ) : (
                            <>
                                <Button variant="outlined" onClick={on_edit_again}>
                                    {facilitiesText(dictionary, 'edit_again', 'Edit Again')}
                                </Button>
                                <Button variant="outlined" onClick={on_close}>
                                    {facilitiesText(dictionary, 'back_to_list', 'Back to List')}
                                </Button>
                            </>
                        )}
                    </>
                ) : (
                    <>
                        <Button onClick={on_close} disabled={loading}>{commonText(dictionary, 'cancel', 'Cancel')}</Button>
                        <Button startIcon={<RestartAltIcon />} onClick={handleReset} disabled={loading}>
                            {commonText(dictionary, 'reset', 'Reset')}
                        </Button>
                        <Button
                            type="submit"
                            form="facility-create-form"
                            variant="contained"
                            startIcon={loading ? <CircularProgress color="inherit" size={16} /> : <SaveIcon />}
                            disabled={loading}
                        >
                            {commonText(dictionary, 'save', 'Save')}
                        </Button>
                    </>
                )}
            </DialogActions>
        </Dialog>
    )
}

export default FacilityCreateDialog
