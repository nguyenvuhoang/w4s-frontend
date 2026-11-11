import CloseIcon from '@mui/icons-material/Close'
import SaveIcon from '@mui/icons-material/Save'
import {
    Alert,
    Button,
    Checkbox,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControlLabel,
    IconButton,
    Stack,
    TextField
} from '@mui/material'
import type { ChangeEvent, FormEvent } from 'react'
import { useState } from 'react'

import type { Locale } from '@/configs/i18n'
import ApartmentLookup from '@/shared/components/apartment-lookup/ApartmentLookup'
import type { ApartmentLookupOption } from '@/shared/services/apartmentLookupService'
import FacilityLookup from '@/shared/components/facility-lookup/FacilityLookup'
import type { FacilityLookupOption } from '@/shared/services/facilityLookupService'
import FacilityTimeSlotLookup from '@/shared/components/facility-time-slot-lookup/FacilityTimeSlotLookup'
import type { FacilityTimeSlotLookupOption } from '@/shared/services/facilityTimeSlotLookupService'
import { useWorkingProject } from '@/@core/stores/useWorkingProjectStore'
import { formatProjectLabel } from '@/shared/services/projectLookupService'
import type { CreateFacilityBookingForm, FacilityBookingsDictionary } from '../types'
import { bookingText, commonText } from './facilityBookingHelpers'

type Props = {
    dictionary: FacilityBookingsDictionary
    sessiontoken?: string
    language: Locale
    open: boolean
    loading: boolean
    error: string | null
    on_close: () => void
    on_submit: (values: CreateFacilityBookingForm) => void
}

type FormErrors = Partial<Record<keyof CreateFacilityBookingForm, string>>

const normalizeTimeValue = (value: string | null) => {
    if (!value) return ''

    const match = String(value).match(/^(\d{1,2}):(\d{2})/)

    if (!match) return ''

    return `${match[1].padStart(2, '0')}:${match[2]}`
}

const FacilityBookingCreateDialog = ({
    dictionary,
    sessiontoken,
    language,
    open,
    loading,
    error,
    on_close,
    on_submit
}: Props) => {
    const workingProject = useWorkingProject()
    const [form, setForm] = useState<CreateFacilityBookingForm>({
        booking_date: '',
        project_id: workingProject?.id ?? '',
        end_time: '',
        apartment_id: '',
        facility_id: '',
        terms_accepted: false,
        note: '',
        facility_time_slot_id: '',
        start_time: ''
    })
    const [apartmentDisplayValue, setApartmentDisplayValue] = useState('')
    const [facilityDisplayValue, setFacilityDisplayValue] = useState('')
    const [facilityTimeSlotDisplayValue, setFacilityTimeSlotDisplayValue] = useState('')
    const [errors, setErrors] = useState<FormErrors>({})

    const handleChange = (key: keyof CreateFacilityBookingForm) => (event: ChangeEvent<HTMLInputElement>) => {
        setForm(current => ({ ...current, [key]: event.target.value }))
        setErrors(current => ({ ...current, [key]: undefined }))
    }

    const validate = () => {
        const next_errors: FormErrors = {}
        const required = bookingText(dictionary, 'validation_required')

        if (!Number.isInteger(Number(form.project_id)) || Number(form.project_id) <= 0) next_errors.project_id = required
        if (!Number.isInteger(Number(form.apartment_id)) || Number(form.apartment_id) <= 0) next_errors.apartment_id = required
        if (!Number.isInteger(Number(form.facility_id)) || Number(form.facility_id) <= 0) next_errors.facility_id = required
        if (!Number.isInteger(Number(form.facility_time_slot_id)) || Number(form.facility_time_slot_id) <= 0) {
            next_errors.facility_time_slot_id = required
        }
        if (!form.booking_date) next_errors.booking_date = required
        if (!form.start_time) next_errors.start_time = required
        if (!form.end_time) next_errors.end_time = required
        if (form.start_time && form.end_time && form.end_time <= form.start_time) {
            next_errors.end_time = bookingText(dictionary, 'validation_end_time')
        }
        if (!form.terms_accepted) next_errors.terms_accepted = bookingText(dictionary, 'validation_terms_accepted')

        setErrors(next_errors)

        return Object.keys(next_errors).length === 0
    }

    const handleApartmentChange = (apartment: ApartmentLookupOption | null) => {
        setForm(current => ({
            ...current,
            apartment_id: apartment ? apartment.id : ''
        }))
        setApartmentDisplayValue(apartment?.displayLabel ?? '')
        setErrors(current => ({
            ...current,
            apartment_id: undefined
        }))
    }

    const handleFacilityChange = (facility: FacilityLookupOption | null) => {
        setForm(current => ({
            ...current,
            facility_id: facility ? facility.id : '',
            facility_time_slot_id: '',
            start_time: '',
            end_time: ''
        }))
        setFacilityDisplayValue(facility?.displayLabel ?? '')
        setFacilityTimeSlotDisplayValue('')
        setErrors(current => ({
            ...current,
            facility_id: undefined,
            facility_time_slot_id: undefined,
            start_time: undefined,
            end_time: undefined
        }))
    }

    const handleFacilityTimeSlotChange = (timeSlot: FacilityTimeSlotLookupOption | null) => {
        setForm(current => ({
            ...current,
            facility_time_slot_id: timeSlot ? timeSlot.id : '',
            start_time: normalizeTimeValue(timeSlot?.startTime ?? null),
            end_time: normalizeTimeValue(timeSlot?.endTime ?? null)
        }))
        setFacilityTimeSlotDisplayValue(timeSlot?.displayLabel ?? '')
        setErrors(current => ({
            ...current,
            facility_time_slot_id: undefined,
            start_time: undefined,
            end_time: undefined
        }))
    }

    const handleSubmit = (event: FormEvent) => {
        event.preventDefault()
        if (validate()) on_submit(form)
    }

    const handleDialogClose = (_event: object, reason?: 'backdropClick' | 'escapeKeyDown') => {
        if (reason === 'backdropClick') return

        if (!loading) {
            on_close()
        }
    }

    return (
        <Dialog open={open} onClose={handleDialogClose} fullWidth maxWidth="md">
            <DialogTitle sx={{ pr: 7, fontWeight: 800 }}>
                {bookingText(dictionary, 'create_facility_booking')}
                <IconButton
                    aria-label={commonText(dictionary, 'close')}
                    onClick={on_close}
                    disabled={loading}
                    sx={{ position: 'absolute', right: 12, top: 10 }}
                >
                    <CloseIcon />
                </IconButton>
            </DialogTitle>
            <DialogContent dividers>
                <Stack
                    component="form"
                    id="facility-booking-create-form"
                    onSubmit={handleSubmit}
                    sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2, pt: 1 }}
                >
                    {error && <Alert severity="error" sx={{ gridColumn: '1 / -1' }}>{error}</Alert>}
                    <TextField
                        label={bookingText(dictionary, 'project_id')}
                        required
                        value={workingProject ? formatProjectLabel(workingProject) : ''}
                        error={Boolean(errors.project_id)}
                        helperText={errors.project_id}
                        disabled
                        slotProps={{ input: { readOnly: true } }}
                    />
                    <ApartmentLookup
                        sessiontoken={sessiontoken}
                        language={language}
                        projectId={form.project_id ? Number(form.project_id) : null}
                        label={bookingText(dictionary, 'apartment_id')}
                        required
                        value={form.apartment_id ? Number(form.apartment_id) : null}
                        displayValue={apartmentDisplayValue}
                        error={Boolean(errors.apartment_id)}
                        helperText={errors.apartment_id}
                        placeholder={form.project_id
                            ? bookingText(dictionary, 'apartment_lookup_placeholder', bookingText(dictionary, 'apartment_id'))
                            : bookingText(dictionary, 'apartment_lookup_project_required_placeholder', 'Please select project first')
                        }
                        onChange={handleApartmentChange}
                        messages={{
                            searchTitle: bookingText(dictionary, 'apartment_search_title', 'Search apartment'),
                            apartmentCodeLabel: bookingText(dictionary, 'apartment_id'),
                            apartmentTypeLabel: bookingText(dictionary, 'apartment_type', 'Apartment type'),
                            searchButtonLabel: commonText(dictionary, 'search', 'Search'),
                            selectLabel: commonText(dictionary, 'select', 'Select'),
                            emptyText: bookingText(dictionary, 'no_apartment_found', 'No apartment found.')
                        }}
                    />
                    <FacilityLookup
                        sessiontoken={sessiontoken}
                        language={language}
                        projectId={form.project_id ? Number(form.project_id) : null}
                        label={bookingText(dictionary, 'facility_id')}
                        required
                        value={form.facility_id ? Number(form.facility_id) : null}
                        displayValue={facilityDisplayValue}
                        error={Boolean(errors.facility_id)}
                        helperText={errors.facility_id}
                        placeholder={form.project_id
                            ? bookingText(dictionary, 'facility_lookup_placeholder', bookingText(dictionary, 'facility_id'))
                            : bookingText(dictionary, 'facility_lookup_project_required_placeholder', 'Please select project first')
                        }
                        onChange={handleFacilityChange}
                        messages={{
                            searchTitle: bookingText(dictionary, 'facility_search_title', 'Search facility'),
                            searchLabel: commonText(dictionary, 'search', 'Search'),
                            descriptionLabel: commonText(dictionary, 'description', 'Description'),
                            searchButtonLabel: commonText(dictionary, 'search', 'Search'),
                            selectLabel: commonText(dictionary, 'select', 'Select'),
                            emptyText: bookingText(dictionary, 'no_facility_found', 'No facility found.')
                        }}
                    />
                    <FacilityTimeSlotLookup
                        sessiontoken={sessiontoken}
                        language={language}
                        facilityId={form.facility_id ? Number(form.facility_id) : null}
                        label={bookingText(dictionary, 'facility_time_slot_id')}
                        required
                        value={form.facility_time_slot_id ? Number(form.facility_time_slot_id) : null}
                        displayValue={facilityTimeSlotDisplayValue}
                        error={Boolean(errors.facility_time_slot_id)}
                        helperText={errors.facility_time_slot_id}
                        placeholder={form.facility_id
                            ? bookingText(dictionary, 'facility_time_slot_lookup_placeholder', bookingText(dictionary, 'facility_time_slot_id'))
                            : bookingText(dictionary, 'facility_time_slot_lookup_facility_required_placeholder', 'Please select facility first')
                        }
                        onChange={handleFacilityTimeSlotChange}
                        messages={{
                            searchTitle: bookingText(dictionary, 'facility_time_slot_search_title', 'Search facility time slot'),
                            searchLabel: commonText(dictionary, 'search', 'Search'),
                            detailsLabel: bookingText(dictionary, 'facility_time_slot_details', 'Details'),
                            capacityLabel: bookingText(dictionary, 'facility_time_slot_capacity', 'Capacity'),
                            priceLabel: bookingText(dictionary, 'facility_time_slot_price', 'Price'),
                            searchButtonLabel: commonText(dictionary, 'search', 'Search'),
                            selectLabel: commonText(dictionary, 'select', 'Select'),
                            emptyText: bookingText(dictionary, 'no_facility_time_slot_found', 'No facility time slot found.')
                        }}
                    />
                    <TextField
                        required
                        size="small"
                        type="date"
                        label={bookingText(dictionary, 'booking_date')}
                        value={form.booking_date}
                        onChange={handleChange('booking_date')}
                        error={Boolean(errors.booking_date)}
                        helperText={errors.booking_date}
                        slotProps={{ inputLabel: { shrink: true } }}
                    />
                    <TextField
                        required
                        size="small"
                        type="time"
                        label={bookingText(dictionary, 'start_time')}
                        value={form.start_time}
                        onChange={handleChange('start_time')}
                        error={Boolean(errors.start_time)}
                        helperText={errors.start_time}
                        slotProps={{ inputLabel: { shrink: true }, htmlInput: { step: 1 } }}
                    />
                    <TextField
                        required
                        size="small"
                        type="time"
                        label={bookingText(dictionary, 'end_time')}
                        value={form.end_time}
                        onChange={handleChange('end_time')}
                        error={Boolean(errors.end_time)}
                        helperText={errors.end_time}
                        slotProps={{ inputLabel: { shrink: true }, htmlInput: { step: 1 } }}
                    />
                    <TextField
                        multiline
                        minRows={3}
                        label={bookingText(dictionary, 'note')}
                        value={form.note}
                        onChange={handleChange('note')}
                        sx={{ gridColumn: '1 / -1' }}
                    />
                    <FormControlLabel
                        sx={{ gridColumn: '1 / -1' }}
                        control={(
                            <Checkbox
                                checked={form.terms_accepted}
                                onChange={event => {
                                    setForm(current => ({ ...current, terms_accepted: event.target.checked }))
                                    setErrors(current => ({ ...current, terms_accepted: undefined }))
                                }}
                            />
                        )}
                        label={bookingText(dictionary, 'terms_accepted')}
                    />
                    {errors.terms_accepted && <Alert severity="warning" sx={{ gridColumn: '1 / -1' }}>{errors.terms_accepted}</Alert>}
                </Stack>
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 2 }}>
                <Button onClick={on_close} disabled={loading}>{commonText(dictionary, 'cancel')}</Button>
                <Button
                    type="submit"
                    form="facility-booking-create-form"
                    variant="contained"
                    startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
                    disabled={loading}
                >
                    {commonText(dictionary, 'save')}
                </Button>
            </DialogActions>
        </Dialog>
    )
}

export default FacilityBookingCreateDialog
