import AddIcon from '@mui/icons-material/Add'
import HomeWorkIcon from '@mui/icons-material/HomeWork'
import RestartAltIcon from '@mui/icons-material/RestartAlt'
import { Avatar, Box, Button, Card, CardContent, CardHeader, Divider, Grid, Stack, Typography } from '@mui/material'
import { RefObject } from 'react'
import { Control, useController } from 'react-hook-form'

import type { Locale } from '@/configs/i18n'
import type { WorkingProjectOption } from '@/@core/stores/useWorkingProjectStore'
import ApartmentLookup from '@/shared/components/apartment-lookup/ApartmentLookup'
import type { ApartmentLookupOption } from '@/shared/services/apartmentLookupService'
import { formatProjectLabel } from '@/shared/services/projectLookupService'
import { ResidentApartmentFormValue, ResidentProfileFormValues } from '../../types'
import { ApartmentListTable } from './ApartmentListTable'
import { FormSelectField, FormTextField, ResidentDictionary, text } from './formControls'

type Props = {
    control: Control<ResidentProfileFormValues>
    dict: ResidentDictionary
    sessiontoken?: string
    locale: Locale | string
    requiredMessage: string
    emptyLabel: string
    workingProject: WorkingProjectOption | null
    editingApartmentId: string | null
    isApartmentRelationshipLocked: boolean
    residentRoleOptions: Array<{ value: string, label: string }>
    isLoadingResidentRoleOptions?: boolean
    residentRoleOptionsErrorMessage?: string
    relationshipOptions: Array<{ value: string, label: string }>
    isLoadingRelationshipOptions?: boolean
    relationshipOptionsErrorMessage?: string
    apartments: ResidentApartmentFormValue[]
    highlightedApartmentId: string | null
    listRef: RefObject<HTMLDivElement | null>
    onApartmentChange: (apartment: ApartmentLookupOption | null) => void
    onResidentRoleChange: (role: string) => void
    onApartmentRelationshipChange: (relationship: string) => void
    onAddOrUpdateApartment: () => void
    onResetApartmentForm: () => void
    onEditApartment: (row: ResidentApartmentFormValue) => void
    onRemoveApartment: (id: string) => void
}

export function ApartmentResidencySection({
    control,
    dict,
    sessiontoken,
    locale,
    requiredMessage,
    emptyLabel,
    workingProject,
    editingApartmentId,
    isApartmentRelationshipLocked,
    residentRoleOptions,
    isLoadingResidentRoleOptions,
    residentRoleOptionsErrorMessage,
    relationshipOptions,
    isLoadingRelationshipOptions,
    relationshipOptionsErrorMessage,
    apartments,
    highlightedApartmentId,
    listRef,
    onApartmentChange,
    onResidentRoleChange,
    onApartmentRelationshipChange,
    onAddOrUpdateApartment,
    onResetApartmentForm,
    onEditApartment,
    onRemoveApartment
}: Props) {
    const apartmentProjectId = useController({ control, name: 'apartmentProjectId' })
    const apartmentCode = useController({ control, name: 'apartmentCode' })

    return (
        <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', boxShadow: '0 4px 20px 0 rgba(0,0,0,0.05)' }}>
            <CardHeader
                avatar={<Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40 }}><HomeWorkIcon sx={{ fontSize: 24, color: 'white' }} /></Avatar>}
                title={<Typography variant="h6" sx={{ fontWeight: 800 }}>{text(dict, 'section_apartment_residency', 'Thông tin cư trú tại căn hộ')}</Typography>}
                subheader={workingProject ? (
                    <Typography variant="body2" color="text.secondary">
                        {text(dict, 'residency_project_label', 'Dự án')}: {formatProjectLabel(workingProject)}
                    </Typography>
                ) : undefined}
                sx={{ p: 3, pb: 0, mb: 2 }}
            />
            <Divider sx={{ mx: 3 }} />
            <CardContent>
                <Grid container spacing={5}>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <ApartmentLookup
                            sessiontoken={sessiontoken}
                            language={locale}
                            projectId={apartmentProjectId.field.value ? Number(apartmentProjectId.field.value) : null}
                            label={text(dict, 'apartment_code', 'Apartment Code')}
                            required
                            displayValue={apartmentCode.field.value ?? ''}
                            error={Boolean(apartmentCode.fieldState.error)}
                            helperText={apartmentCode.fieldState.error?.message}
                            placeholder={apartmentProjectId.field.value
                                ? text(dict, 'select_placeholder', '-- Select --')
                                : text(dict, 'select_project_first', 'Please select project first')
                            }
                            onChange={onApartmentChange}
                            messages={{
                                searchTitle: text(dict, 'apartment_search_title', 'Search apartment'),
                                apartmentCodeLabel: text(dict, 'apartment_code', 'Apartment code'),
                                apartmentTypeLabel: text(dict, 'apartment_type', 'Apartment type'),
                                searchButtonLabel: text(dict, 'search', 'Search'),
                                selectLabel: text(dict, 'select', 'Select'),
                                emptyText: text(dict, 'no_apartment_found', 'No apartment found.')
                            }}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <FormTextField
                            control={control}
                            name="apartmentTypeLabel"
                            label={text(dict, 'apartment_type', 'Apartment Type')}
                            requiredMessage={requiredMessage}
                            disabled
                        />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <FormTextField
                            control={control}
                            name="electricMeterCode"
                            label={text(dict, 'electric_meter_code', 'Electric Meter Code')}
                            requiredMessage={requiredMessage}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <FormTextField
                            control={control}
                            name="waterMeterCode"
                            label={text(dict, 'water_meter_code', 'Water Meter Code')}
                            requiredMessage={requiredMessage}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <FormSelectField
                            control={control}
                            name="residentRole"
                            label={text(dict, 'role', 'Quyền cư dân')}
                            options={residentRoleOptions}
                            required
                            requiredMessage={requiredMessage}
                            emptyLabel={emptyLabel}
                            loading={isLoadingResidentRoleOptions}
                            loadingLabel={text(dict, 'role_options_loading', 'Đang tải danh sách...')}
                            externalErrorMessage={residentRoleOptionsErrorMessage}
                            onValueChange={onResidentRoleChange}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <FormSelectField
                            control={control}
                            name="apartmentRelationship"
                            label={text(dict, 'relationship_type', 'Loại cư dân')}
                            options={relationshipOptions}
                            requiredMark
                            requiredMessage={requiredMessage}
                            emptyLabel={emptyLabel}
                            disabled={isApartmentRelationshipLocked}
                            loading={isLoadingRelationshipOptions}
                            loadingLabel={text(dict, 'relationship_options_loading', 'Đang tải danh sách...')}
                            externalErrorMessage={relationshipOptionsErrorMessage}
                            onValueChange={onApartmentRelationshipChange}
                        />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                        <FormTextField control={control} name="moveInDate" label={text(dict, 'move_in_date', 'Ngày bắt đầu ở')} type="date" requiredMessage={requiredMessage} />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                        <Stack direction="row" gap={2} flexWrap="wrap">
                            <Button type="button" variant="contained" startIcon={<AddIcon />} onClick={onAddOrUpdateApartment}>
                                {editingApartmentId ? text(dict, 'update_apartment', 'Cập nhật căn hộ') : text(dict, 'add_apartment', 'Thêm căn hộ')}
                            </Button>
                            <Button type="button" variant="outlined" color="inherit" startIcon={<RestartAltIcon />} onClick={onResetApartmentForm}>
                                {text(dict, 'clear_apartment_form', 'Làm mới thông tin căn hộ')}
                            </Button>
                        </Stack>
                    </Grid>
                </Grid>

                <Divider sx={{ my: 4 }} />

                <Box ref={listRef}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
                        {text(dict, 'apartment_list_title', 'Danh sách căn hộ đã thêm')} ({apartments.length})
                    </Typography>
                    <ApartmentListTable
                        dict={dict}
                        apartments={apartments}
                        onEditApartment={onEditApartment}
                        onRemoveApartment={onRemoveApartment}
                        highlightedApartmentId={highlightedApartmentId}
                    />
                </Box>
            </CardContent>
        </Card>
    )
}
