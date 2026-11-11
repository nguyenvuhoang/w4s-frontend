'use client'

import AddIcon from '@mui/icons-material/Add'
import ApartmentIcon from '@mui/icons-material/Apartment'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import DeleteIcon from '@mui/icons-material/Delete'
import DomainIcon from '@mui/icons-material/Domain'
import RestartAltIcon from '@mui/icons-material/RestartAlt'
import SaveIcon from '@mui/icons-material/Save'
import SearchIcon from '@mui/icons-material/Search'
import {
    Alert,
    Box,
    Button,
    Checkbox,
    Chip,
    CircularProgress,
    Divider,
    FormControlLabel,
    IconButton,
    InputAdornment,
    MenuItem,
    Paper,
    Stack,
    TextField,
    Typography
} from '@mui/material'
import type { ChipProps } from '@mui/material/Chip'

import ContentWrapper from '@/features/dynamicform/components/layout/content-wrapper'
import EntityCardPickerModal from '@/shared/components/entity-card-picker/EntityCardPickerModal'
import RequireWorkingProject from '@/shared/components/project-context/RequireWorkingProject'
import { formatProjectLabel } from '@/shared/services/projectLookupService'

import { useFacilityCreatePage } from '../hooks/useFacilityCreatePage'
import type { FacilitiesDictionary } from '../types'
import { commonText, facilitiesText } from './facility-list/facilityListHelpers'

type Props = {
    dictionary: FacilitiesDictionary
    locale: string
    sessiontoken?: string
}

const getEntityStatusColor = (status: string): ChipProps['color'] => {
    if (status === 'A' || status.toLowerCase() === 'active') return 'success'
    if (status === 'I') return 'default'
    if (status === 'B') return 'error'
    if (status === 'DRAFT') return 'warning'

    return 'info'
}

const getEntityStatusLabel = (dictionary: FacilitiesDictionary, status: string) => {
    if (status === 'A' || status.toLowerCase() === 'active') return facilitiesText(dictionary, 'status_active', 'Active')
    if (status === 'I') return facilitiesText(dictionary, 'status_inactive', 'Inactive')
    if (status === 'B') return facilitiesText(dictionary, 'status_blocked', 'Blocked')
    if (status === 'DRAFT') return facilitiesText(dictionary, 'status_draft', 'Draft')

    return status
}

const grid_sx = {
    display: 'grid',
    gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
    gap: 2
}

const normalizeTimeInput = (value: string | null | undefined) => {
    if (!value) return ''

    const match = String(value).match(/^(\d{1,2}):(\d{2})/)

    return match ? `${match[1].padStart(2, '0')}:${match[2]}` : ''
}

const FacilityCreatePage = ({ dictionary, locale, sessiontoken }: Props) => {
    const create_page = useFacilityCreatePage({
        dictionary,
        locale,
        sessiontoken,
        language: locale
    })

    const {
        form,
        errors,
        category_options,
        categories_loading,
        building_options,
        buildings_loading,
        buildings_error,
        saving,
        submit_error,
        selected_project,
        selected_building
    } = create_page

    return (
        <ContentWrapper
            title={facilitiesText(dictionary, 'create_page_title', 'Add Facility')}
            description={facilitiesText(dictionary, 'create_page_subtitle', 'Create a new facility for a project.')}
            icon={<ApartmentIcon sx={{ fontSize: 40, color: 'primary.main' }} />}
            dictionary={dictionary}
            issearch
        >
          <RequireWorkingProject dictionary={dictionary} sessiontoken={sessiontoken} language={locale}>
            <Stack spacing={3} sx={{ mt: 3 }}>
                <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" gap={2}>
                    <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={create_page.goBack} disabled={saving}>
                        {commonText(dictionary, 'back', 'Back')}
                    </Button>

                    <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="flex-end" gap={1}>
                        <Button variant="outlined" onClick={create_page.goBack} disabled={saving}>
                            {commonText(dictionary, 'cancel', 'Cancel')}
                        </Button>
                        <Button startIcon={<RestartAltIcon />} onClick={create_page.handleReset} disabled={saving}>
                            {commonText(dictionary, 'reset', 'Reset')}
                        </Button>
                        <Button
                            variant="contained"
                            startIcon={saving ? <CircularProgress color="inherit" size={16} /> : <SaveIcon />}
                            onClick={() => void create_page.submit()}
                            disabled={saving}
                        >
                            {commonText(dictionary, 'save', 'Save')}
                        </Button>
                    </Stack>
                </Stack>

                {submit_error && <Alert severity="error">{submit_error}</Alert>}

                <Paper sx={{ p: { xs: 2, md: 3 }, borderRadius: 2, border: 1, borderColor: 'divider' }}>
                    <Stack spacing={2.25}>
                        <Stack spacing={0.5}>
                            <Typography variant="h5" sx={{ fontWeight: 800, color: '#225087' }}>
                                {facilitiesText(dictionary, 'create_facility_title', 'Create Facility')}
                            </Typography>
                        </Stack>

                        <Box sx={grid_sx}>
                            <TextField
                                required
                                label={facilitiesText(dictionary, 'field_facility_code', 'Facility Code')}
                                value={form.facility_code}
                                onChange={create_page.handleTextChange('facility_code')}
                                error={Boolean(errors.facility_code)}
                                helperText={errors.facility_code}
                                disabled={saving}
                            />
                            <TextField
                                required
                                label={facilitiesText(dictionary, 'field_facility_name', 'Facility Name')}
                                value={form.name}
                                onChange={create_page.handleTextChange('name')}
                                error={Boolean(errors.name)}
                                helperText={errors.name}
                                disabled={saving}
                            />
                            <TextField
                                required
                                fullWidth
                                label={facilitiesText(dictionary, 'project', 'Project')}
                                value={selected_project ? formatProjectLabel(selected_project) : ''}
                                error={Boolean(errors.project_id)}
                                helperText={errors.project_id}
                                disabled
                                slotProps={{ input: { readOnly: true } }}
                            />
                            <TextField
                                required
                                fullWidth
                                label={facilitiesText(dictionary, 'field_building', 'Building')}
                                value={selected_building
                                    ? (selected_building.building_code ? `[${selected_building.building_code}] ${selected_building.name}` : selected_building.name)
                                    : ''}
                                placeholder={!form.project_id
                                    ? facilitiesText(dictionary, 'building_select_project', 'Select a project first')
                                    : facilitiesText(dictionary, 'select_building_placeholder', 'Click to select a building')}
                                onClick={create_page.openBuildingModal}
                                error={Boolean(errors.building_id) || Boolean(buildings_error)}
                                helperText={
                                    errors.building_id
                                    || buildings_error
                                    || (!form.project_id
                                        ? facilitiesText(dictionary, 'building_select_project', 'Select a project first')
                                        : building_options.length === 0 && !buildings_loading
                                            ? facilitiesText(dictionary, 'building_options_empty', 'No buildings found for this project')
                                            : undefined)
                                }
                                disabled={saving || !form.project_id}
                                sx={{ '& .MuiInputBase-input': { cursor: 'pointer' } }}
                                slotProps={{
                                    input: {
                                        readOnly: true,
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                {buildings_loading
                                                    ? <CircularProgress color="inherit" size={16} sx={{ mr: 1 }} />
                                                    : null}
                                                <IconButton edge="end" onClick={create_page.openBuildingModal} disabled={saving || !form.project_id}>
                                                    <SearchIcon />
                                                </IconButton>
                                            </InputAdornment>
                                        )
                                    }
                                }}
                            />
                            <TextField
                                required
                                select
                                label={facilitiesText(dictionary, 'facility_category', 'Facility Category')}
                                value={form.facility_category_id}
                                onChange={create_page.handleCategoryChange}
                                error={Boolean(errors.facility_category_id)}
                                helperText={
                                    errors.facility_category_id
                                    || (category_options.length === 0 && !categories_loading
                                        ? facilitiesText(dictionary, 'category_options_empty', 'No facility categories found for this project')
                                        : undefined)
                                }
                                disabled={saving || categories_loading || category_options.length === 0}
                                InputProps={{
                                    endAdornment: categories_loading ? <CircularProgress color="inherit" size={16} /> : undefined
                                }}
                            >
                                {category_options.map(category => {
                                    const category_id = category.id ?? category.facility_category_id

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
                            onChange={create_page.handleTextChange('description')}
                            disabled={saving}
                        />

                        <Divider />
                        <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                            {facilitiesText(dictionary, 'section_booking_setup', 'Booking Setup')}
                        </Typography>
                        <Box sx={grid_sx}>
                            <TextField
                                required
                                label={facilitiesText(dictionary, 'field_location', 'Location')}
                                value={form.location}
                                onChange={create_page.handleTextChange('location')}
                                error={Boolean(errors.location)}
                                helperText={errors.location}
                                disabled={saving}
                            />
                            <TextField
                                type="time"
                                label={facilitiesText(dictionary, 'field_open_time', 'Open Time')}
                                value={normalizeTimeInput(form.open_time)}
                                onChange={create_page.handleTextChange('open_time')}
                                error={Boolean(errors.open_time)}
                                helperText={errors.open_time}
                                disabled={saving}
                                slotProps={{ inputLabel: { shrink: true }, htmlInput: { step: 1 } }}
                            />
                            <TextField
                                type="time"
                                label={facilitiesText(dictionary, 'field_close_time', 'Close Time')}
                                value={normalizeTimeInput(form.close_time)}
                                onChange={create_page.handleTextChange('close_time')}
                                error={Boolean(errors.close_time)}
                                helperText={errors.close_time}
                                disabled={saving}
                                slotProps={{ inputLabel: { shrink: true }, htmlInput: { step: 1 } }}
                            />
                            <TextField
                                type="number"
                                label={facilitiesText(dictionary, 'field_price_per_hour', 'Price Per Hour')}
                                value={form.price_per_hour}
                                onChange={create_page.handleTextChange('price_per_hour')}
                                disabled={saving}
                            />
                            <TextField
                                type="number"
                                label={facilitiesText(dictionary, 'field_max_capacity', 'Max Capacity')}
                                value={form.max_capacity}
                                onChange={create_page.handleTextChange('max_capacity')}
                                disabled={saving}
                            />
                            <TextField
                                type="number"
                                label={facilitiesText(dictionary, 'field_max_people_per_booking', 'Max People / Booking')}
                                value={form.max_people_per_booking}
                                onChange={create_page.handleTextChange('max_people_per_booking')}
                                disabled={saving}
                            />
                            <TextField
                                type="number"
                                label={facilitiesText(dictionary, 'field_max_slots_per_booking', 'Max Slots / Booking')}
                                value={form.max_slots_per_booking}
                                onChange={create_page.handleTextChange('max_slots_per_booking')}
                                disabled={saving}
                            />
                        </Box>
                        <TextField
                            multiline
                            minRows={3}
                            label={facilitiesText(dictionary, 'field_long_description', 'Long Description')}
                            value={form.long_description}
                            onChange={create_page.handleTextChange('long_description')}
                            disabled={saving}
                        />
                        <TextField
                            multiline
                            minRows={3}
                            label={facilitiesText(dictionary, 'field_rules', 'Rules JSON')}
                            value={form.rules}
                            onChange={create_page.handleTextChange('rules')}
                            disabled={saving}
                        />
                        <TextField
                            multiline
                            minRows={2}
                            label={facilitiesText(dictionary, 'field_price_note', 'Price Note')}
                            value={form.price_note}
                            onChange={create_page.handleTextChange('price_note')}
                            disabled={saving}
                        />
                        <FormControlLabel
                            control={(
                                <Checkbox
                                    checked={form.need_accept_policy}
                                    onChange={event => create_page.setField('need_accept_policy', event.target.checked)}
                                    disabled={saving}
                                />
                            )}
                            label={facilitiesText(dictionary, 'field_need_accept_policy', 'Need Accept Policy')}
                        />
                        <TextField
                            multiline
                            minRows={2}
                            label={facilitiesText(dictionary, 'field_facility_policy', 'Facility Policy')}
                            value={form.facility_policy}
                            onChange={create_page.handleTextChange('facility_policy')}
                            disabled={saving}
                        />

                        <Box sx={grid_sx}>
                            <TextField
                                label={facilitiesText(dictionary, 'field_image_url', 'Image URL')}
                                value={form.image_url}
                                onChange={create_page.handleTextChange('image_url')}
                                disabled={saving}
                            />
                            <TextField
                                label={facilitiesText(dictionary, 'field_terms_url', 'Terms URL')}
                                value={form.terms_url}
                                onChange={create_page.handleTextChange('terms_url')}
                                disabled={saving}
                            />
                            <TextField
                                type="number"
                                label={facilitiesText(dictionary, 'field_max_slots_per_day', 'Max Slots Per Day')}
                                value={form.max_slots_per_day}
                                onChange={create_page.handleTextChange('max_slots_per_day')}
                                disabled={saving}
                            />
                            <TextField
                                type="number"
                                label={facilitiesText(dictionary, 'field_advance_booking_days', 'Advance Booking Days')}
                                value={form.advance_booking_days}
                                onChange={create_page.handleTextChange('advance_booking_days')}
                                disabled={saving}
                            />
                            <TextField
                                required
                                type="number"
                                label={facilitiesText(dictionary, 'field_display_order', 'Display Order')}
                                value={form.display_order}
                                onChange={create_page.handleTextChange('display_order')}
                                error={Boolean(errors.display_order)}
                                helperText={errors.display_order}
                                disabled={saving}
                            />
                            <TextField
                                type="number"
                                label={facilitiesText(dictionary, 'field_deposit_amount', 'Deposit Amount')}
                                value={form.deposit_amount}
                                onChange={create_page.handleTextChange('deposit_amount')}
                                error={Boolean(errors.deposit_amount)}
                                helperText={errors.deposit_amount}
                                disabled={saving || !form.require_deposit}
                            />
                        </Box>

                        <FormControlLabel
                            control={(
                                <Checkbox
                                    checked={form.require_deposit}
                                    onChange={event => create_page.setField('require_deposit', event.target.checked)}
                                    disabled={saving}
                                />
                            )}
                            label={facilitiesText(dictionary, 'field_require_deposit', 'Require Deposit')}
                        />

                        <Divider />
                        <Stack direction="row" justifyContent="space-between" alignItems="center" gap={2}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                                {facilitiesText(dictionary, 'section_time_slots', 'Time Slots')}
                            </Typography>
                            <Button startIcon={<AddIcon />} onClick={create_page.handleAddTimeSlot} disabled={saving}>
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
                                        onChange={event => create_page.handleTimeSlotChange(index, 'name', event.target.value)}
                                        disabled={saving}
                                    />
                                    <TextField
                                        required
                                        type="time"
                                        label={facilitiesText(dictionary, 'field_start_time', 'Start Time')}
                                        value={normalizeTimeInput(slot.start_time)}
                                        onChange={event => create_page.handleTimeSlotChange(index, 'start_time', event.target.value)}
                                        disabled={saving}
                                        slotProps={{ inputLabel: { shrink: true }, htmlInput: { step: 1 } }}
                                    />
                                    <TextField
                                        required
                                        type="time"
                                        label={facilitiesText(dictionary, 'field_end_time', 'End Time')}
                                        value={normalizeTimeInput(slot.end_time)}
                                        onChange={event => create_page.handleTimeSlotChange(index, 'end_time', event.target.value)}
                                        disabled={saving}
                                        slotProps={{ inputLabel: { shrink: true }, htmlInput: { step: 1 } }}
                                    />
                                    <TextField
                                        required
                                        type="number"
                                        label={facilitiesText(dictionary, 'field_max_capacity', 'Capacity')}
                                        value={slot.max_capacity}
                                        onChange={event => create_page.handleTimeSlotChange(index, 'max_capacity', event.target.value)}
                                        disabled={saving}
                                    />
                                    <TextField
                                        required
                                        type="number"
                                        label={facilitiesText(dictionary, 'field_day_of_week', 'Day')}
                                        value={slot.day_of_week}
                                        onChange={event => create_page.handleTimeSlotChange(index, 'day_of_week', event.target.value)}
                                        disabled={saving}
                                    />
                                    <TextField
                                        required
                                        type="number"
                                        label={facilitiesText(dictionary, 'field_base_price', 'Base Price')}
                                        value={slot.base_price}
                                        onChange={event => create_page.handleTimeSlotChange(index, 'base_price', event.target.value)}
                                        disabled={saving}
                                    />
                                    <IconButton
                                        aria-label={facilitiesText(dictionary, 'remove_time_slot', 'Remove Time Slot')}
                                        onClick={() => create_page.handleRemoveTimeSlot(index)}
                                        disabled={saving || form.time_slots.length === 1}
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
                            <Button startIcon={<AddIcon />} onClick={create_page.handleAddPriceRule} disabled={saving}>
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
                                        onChange={event => create_page.handlePriceRuleChange(index, 'time_slot_index', event.target.value)}
                                        disabled={saving}
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
                                        onChange={event => create_page.handlePriceRuleChange(index, 'rule_type', event.target.value)}
                                        disabled={saving}
                                    >
                                        <MenuItem value="WEEKDAY">WEEKDAY</MenuItem>
                                        <MenuItem value="WEEKEND">WEEKEND</MenuItem>
                                        <MenuItem value="SPECIFIC_DATE">SPECIFIC_DATE</MenuItem>
                                    </TextField>
                                    <TextField
                                        type="date"
                                        label={facilitiesText(dictionary, 'field_specific_date', 'Specific Date')}
                                        value={rule.specific_date ? String(rule.specific_date).slice(0, 10) : ''}
                                        onChange={event => create_page.handlePriceRuleChange(index, 'specific_date', event.target.value)}
                                        disabled={saving || rule.rule_type !== 'SPECIFIC_DATE'}
                                        slotProps={{ inputLabel: { shrink: true } }}
                                    />
                                    <TextField
                                        required
                                        select
                                        label={facilitiesText(dictionary, 'field_price_adjustment_type', 'Adjustment Type')}
                                        value={rule.price_adjustment_type}
                                        onChange={event => create_page.handlePriceRuleChange(index, 'price_adjustment_type', event.target.value)}
                                        disabled={saving}
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
                                        onChange={event => create_page.handlePriceRuleChange(index, 'adjustment_value', event.target.value)}
                                        disabled={saving}
                                    />
                                    <TextField
                                        required
                                        type="number"
                                        label={facilitiesText(dictionary, 'field_priority', 'Priority')}
                                        value={rule.priority}
                                        onChange={event => create_page.handlePriceRuleChange(index, 'priority', event.target.value)}
                                        disabled={saving}
                                    />
                                    <IconButton
                                        aria-label={facilitiesText(dictionary, 'remove_price_rule', 'Remove Price Rule')}
                                        onClick={() => create_page.handleRemovePriceRule(index)}
                                        disabled={saving}
                                    >
                                        <DeleteIcon />
                                    </IconButton>
                                </Box>
                            ))}
                        </Stack>
                    </Stack>
                </Paper>

            </Stack>

            <EntityCardPickerModal
                open={create_page.building_modal_open}
                onClose={create_page.closeBuildingModal}
                title={facilitiesText(dictionary, 'building_picker_title', 'Select Building')}
                subtitle={facilitiesText(dictionary, 'building_picker_subtitle', 'Choose a building belonging to the selected project.')}
                items={create_page.building_modal_items}
                getKey={building => building.id}
                isSelected={building => Number(form.building_id) === building.id}
                onSelect={create_page.selectBuilding}
                renderIcon={(_building, selected) => (
                    <DomainIcon color={selected ? 'primary' : 'action'} sx={{ fontSize: 34 }} />
                )}
                renderTitle={building => (building.building_code ? `[${building.building_code}] ${building.name}` : building.name)}
                renderSubtitle={building => (
                    building.floor_count !== null && building.floor_count !== undefined
                        ? `${facilitiesText(dictionary, 'field_floor_count', 'Floors')}: ${building.floor_count}`
                        : '-'
                )}
                renderStatusChip={building => (building.status ? (
                    <Box>
                        <Chip size="small" color={getEntityStatusColor(building.status)} label={getEntityStatusLabel(dictionary, building.status)} />
                    </Box>
                ) : null)}
                loading={buildings_loading}
                error={buildings_error}
                onRetry={create_page.retryBuildingOptions}
                retryLabel={commonText(dictionary, 'retry', 'Retry')}
                emptyTitle={facilitiesText(dictionary, 'building_picker_empty_title', 'No building found')}
                emptyDescription={facilitiesText(dictionary, 'building_picker_empty_description', 'This project has no buildings yet.')}
                searchValue={create_page.building_modal_search_text}
                onSearchChange={create_page.setBuildingModalSearchText}
                searchLabel={commonText(dictionary, 'search', 'Search')}
                searchPlaceholder={facilitiesText(dictionary, 'building_picker_search_placeholder', 'Search by building code or name')}
            />
          </RequireWorkingProject>
        </ContentWrapper>
    )
}

export default FacilityCreatePage
