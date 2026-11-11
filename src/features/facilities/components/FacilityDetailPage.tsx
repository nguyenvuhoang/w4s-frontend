'use client'

import ApartmentIcon from '@mui/icons-material/Apartment'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import BlockIcon from '@mui/icons-material/Block'
import EditIcon from '@mui/icons-material/Edit'
import { Alert, Box, Button, Chip, Link, Paper, Snackbar, Stack, Typography } from '@mui/material'
import { useRouter } from '@shared/hooks/useRouter'
import type { ReactNode } from 'react'

import ContentWrapper from '@/features/dynamicform/components/layout/content-wrapper'
import { PermissionGuard } from '@shared/permissions/PermissionGuard'

import { useFacilityDetail } from '../hooks/useFacilityDetail'
import type { FacilitiesDictionary, FacilityCategoryItem, FacilityItem } from '../types'
import FacilityCreateDialog from './facility-list/FacilityCreateDialog'
import FacilityDeactivateDialog from './facility-list/FacilityDeactivateDialog'
import {
    commonText,
    facilitiesText,
    formatFacilityMoney,
    formatNullableNumber,
    getBooleanLabel,
    getFacilityStatusColor,
    getFacilityStatusLabel
} from './facility-list/facilityListHelpers'

type Props = {
    dictionary: FacilitiesDictionary
    locale: string
    sessiontoken?: string
    facility: FacilityItem | null
    category_options: FacilityCategoryItem[]
    error?: string | null
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

const FacilityDetailPage = ({ dictionary, locale, sessiontoken, facility: initial_facility, category_options, error }: Props) => {
    const router = useRouter()

    if (!initial_facility) {
        return (
            <ContentWrapper
                title={facilitiesText(dictionary, 'facilities_title', 'Facilities')}
                description={facilitiesText(dictionary, 'list_subtitle', 'Manage facilities belonging to the project.')}
                icon={<ApartmentIcon sx={{ fontSize: 40, color: 'primary.main' }} />}
                dictionary={dictionary}
            >
                <Stack spacing={3} sx={{ mt: 3 }}>
                    <Button
                        variant="outlined"
                        startIcon={<ArrowBackIcon />}
                        sx={{ alignSelf: 'flex-start' }}
                        onClick={() => router.push(`/${locale}/facilities/facilities?tab=facilities`)}
                    >
                        {commonText(dictionary, 'back', 'Back')}
                    </Button>
                    <Alert severity="error">
                        {error || facilitiesText(dictionary, 'facility_id_not_found', 'Facility ID was not found')}
                    </Alert>
                </Stack>
            </ContentWrapper>
        )
    }

    return (
        <FacilityDetailContent
            dictionary={dictionary}
            locale={locale}
            sessiontoken={sessiontoken}
            initial_facility={initial_facility}
            category_options={category_options}
        />
    )
}

const FacilityDetailContent = ({
    dictionary,
    locale,
    sessiontoken,
    initial_facility,
    category_options
}: {
    dictionary: FacilitiesDictionary
    locale: string
    sessiontoken?: string
    initial_facility: FacilityItem
    category_options: FacilityCategoryItem[]
}) => {
    const detail = useFacilityDetail({
        dictionary,
        locale,
        sessiontoken,
        language: locale,
        initial_facility,
        category_options
    })

    const { facility } = detail

    return (
        <ContentWrapper
            title={facility.name || facility.facility_code}
            description={facilitiesText(dictionary, 'facilities_title', 'Facilities')}
            icon={<ApartmentIcon sx={{ fontSize: 40, color: 'primary.main' }} />}
            dictionary={dictionary}
        >
            <Stack spacing={3} sx={{ mt: 3 }}>
                <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" gap={2}>
                    <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={detail.goBack}>
                        {commonText(dictionary, 'back', 'Back')}
                    </Button>

                    <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="flex-end" gap={1}>
                        <PermissionGuard href="/facilities/facilities" action="MODIFY">
                            <Button variant="contained" startIcon={<EditIcon />} onClick={detail.handleOpenEdit}>
                                {commonText(dictionary, 'edit', 'Edit')}
                            </Button>
                        </PermissionGuard>
                        <PermissionGuard href="/facilities/facilities" action="MODIFY">
                            <Button
                                variant="outlined"
                                color="warning"
                                startIcon={<BlockIcon />}
                                onClick={detail.handleOpenDeactivate}
                                disabled={facility.status === 'I'}
                            >
                                {facilitiesText(dictionary, 'deactivate', 'Deactivate')}
                            </Button>
                        </PermissionGuard>
                    </Stack>
                </Stack>

                <Paper sx={{ p: { xs: 2, md: 3 }, borderRadius: 2, border: 1, borderColor: 'divider' }}>
                    <Stack spacing={2.25}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center" gap={2}>
                            <Typography variant="h5" sx={{ fontWeight: 800, color: '#225087' }}>
                                {facilitiesText(dictionary, 'facilities_title', 'Facilities')}
                            </Typography>
                            <Chip
                                size="small"
                                color={getFacilityStatusColor(facility.status)}
                                label={getFacilityStatusLabel(dictionary, facility.status)}
                            />
                        </Stack>

                        {facility.id !== undefined && (
                            <DetailRow label="ID">
                                <Typography>{displayText(facility.id)}</Typography>
                            </DetailRow>
                        )}
                        <DetailRow label={facilitiesText(dictionary, 'field_facility_code', 'Facility Code')}>
                            <Typography sx={{ fontWeight: 800 }}>{displayText(facility.facility_code)}</Typography>
                        </DetailRow>
                        <DetailRow label={facilitiesText(dictionary, 'field_facility_name', 'Facility Name')}>
                            <Typography>{displayText(facility.name)}</Typography>
                        </DetailRow>
                        <DetailRow label={facilitiesText(dictionary, 'project_id', 'Project ID')}>
                            <Typography>{displayText(facility.project_id)}</Typography>
                        </DetailRow>
                        <DetailRow label={facilitiesText(dictionary, 'facility_category', 'Facility Category')}>
                            <Typography>{facility.facility_category_name || displayText(facility.facility_category_id)}</Typography>
                        </DetailRow>
                        <DetailRow label={facilitiesText(dictionary, 'field_description', 'Description')}>
                            <Typography sx={{ overflowWrap: 'anywhere' }}>{displayText(facility.description)}</Typography>
                        </DetailRow>
                        <DetailRow label={facilitiesText(dictionary, 'field_image_url', 'Image URL')}>
                            {facility.image_url ? (
                                <Stack spacing={1}>
                                    <Box
                                        component="img"
                                        src={facility.image_url}
                                        alt={facility.name}
                                        sx={{ width: 96, height: 72, objectFit: 'cover', borderRadius: 1, border: 1, borderColor: 'divider' }}
                                    />
                                    <Link href={facility.image_url} target="_blank" rel="noopener noreferrer" sx={{ overflowWrap: 'anywhere' }}>
                                        {facility.image_url}
                                    </Link>
                                </Stack>
                            ) : (
                                <Typography color="text.secondary">-</Typography>
                            )}
                        </DetailRow>
                        <DetailRow label={facilitiesText(dictionary, 'field_terms_url', 'Terms URL')}>
                            {facility.terms_url ? (
                                <Link href={facility.terms_url} target="_blank" rel="noopener noreferrer" sx={{ overflowWrap: 'anywhere' }}>
                                    {facility.terms_url}
                                </Link>
                            ) : (
                                <Typography color="text.secondary">-</Typography>
                            )}
                        </DetailRow>
                        <DetailRow label={facilitiesText(dictionary, 'field_require_deposit', 'Require Deposit')}>
                            <Typography>{getBooleanLabel(dictionary, facility.require_deposit)}</Typography>
                        </DetailRow>
                        <DetailRow label={facilitiesText(dictionary, 'field_deposit_amount', 'Deposit Amount')}>
                            <Typography>{formatFacilityMoney(facility.deposit_amount, locale)}</Typography>
                        </DetailRow>
                        <DetailRow label={facilitiesText(dictionary, 'field_max_slots_per_day', 'Max Slots Per Day')}>
                            <Typography>{formatNullableNumber(facility.max_slots_per_day)}</Typography>
                        </DetailRow>
                        <DetailRow label={facilitiesText(dictionary, 'field_advance_booking_days', 'Advance Booking Days')}>
                            <Typography>{formatNullableNumber(facility.advance_booking_days)}</Typography>
                        </DetailRow>
                        <DetailRow label={facilitiesText(dictionary, 'field_display_order', 'Display Order')}>
                            <Typography>{formatNullableNumber(facility.display_order)}</Typography>
                        </DetailRow>
                    </Stack>
                </Paper>
            </Stack>

            <FacilityCreateDialog
                key={detail.edit_key}
                dictionary={dictionary}
                locale={locale}
                open={detail.edit_open}
                loading={detail.edit_loading}
                error={detail.edit_error}
                mode={detail.edit_mode}
                form_mode="update"
                created_facility={null}
                updated_facility={detail.updated_facility}
                editing_facility={facility}
                category_options={category_options}
                categories_loading={false}
                project_options={[]}
                projects_loading={false}
                default_project_id={facility.project_id}
                on_close={detail.handleCloseEdit}
                on_submit={detail.handleUpdateFacility}
                on_create_another={() => {}}
                on_edit_again={detail.handleEditAgain}
                on_project_change={() => {}}
            />

            <FacilityDeactivateDialog
                dictionary={dictionary}
                open={detail.deactivate_open}
                loading={detail.deactivate_loading}
                on_close={detail.handleCloseDeactivate}
                on_confirm={() => void detail.handleDeactivateFacility()}
            />

            <Snackbar
                open={Boolean(detail.mutation_notice)}
                autoHideDuration={4000}
                onClose={detail.handleCloseMutationNotice}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert
                    severity={detail.mutation_notice?.severity ?? 'success'}
                    variant="filled"
                    onClose={detail.handleCloseMutationNotice}
                >
                    {detail.mutation_notice?.message}
                </Alert>
            </Snackbar>
        </ContentWrapper>
    )
}

export default FacilityDetailPage
