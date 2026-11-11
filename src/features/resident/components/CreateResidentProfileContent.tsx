'use client'

import { useEffect, useMemo, useRef } from 'react'

import ApartmentIcon from '@mui/icons-material/Apartment'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import UploadFileIcon from '@mui/icons-material/UploadFile'
import RestartAltIcon from '@mui/icons-material/RestartAlt'
import SaveIcon from '@mui/icons-material/Save'
import { Box, Button, Grid } from '@mui/material'
import { useRouter } from '@shared/hooks/useRouter'

import ContentWrapper from '@/features/dynamicform/components/layout/content-wrapper'
import RequireWorkingProject from '@/shared/components/project-context/RequireWorkingProject'
import { useWorkingProject } from '@/@core/stores/useWorkingProjectStore'
import { useCodeListCaptionMap } from '@/shared/hooks/useCodeListCaptionMap'
import { buildCodeListOptions } from '@/shared/utils/buildCodeListOptions'
import { useCreateResidentProfileForm } from '../hooks/useCreateResidentProfileForm'
import { ResidentPageProps } from '../types'
import {
    RESIDENT_RELATIONSHIP_CODE_GROUP,
    RESIDENT_RELATIONSHIP_CODE_NAME,
    RESIDENT_ROLE_CODE_GROUP,
    RESIDENT_ROLE_CODE_NAME
} from './resident-list/residentListHelpers'
import { ApartmentResidencySection } from './create-resident-profile/ApartmentResidencySection'
import { AppAccountSection } from './create-resident-profile/AppAccountSection'
import { OwnerInformationSection } from './create-resident-profile/OwnerInformationSection'
import { ResidentActivationQrDialog } from './create-resident-profile/ResidentActivationQrDialog'
import { ResidentDictionary, text } from './create-resident-profile/formControls'

type Props = ResidentPageProps

export default function CreateResidentProfileContent({ dictionary, session, locale }: Props) {
    const router = useRouter()
    const workingProject = useWorkingProject()
    const dictCommon = dictionary['common'] || ({} as Record<string, string>)
    const dict = dictionary['resident'] || ({} as ResidentDictionary)
    const requiredMessage = text(dict, 'validation_required', '{field} is required')
    const emptyLabel = text(dict, 'select_placeholder', '-- Select --')
    const apartmentListRef = useRef<HTMLDivElement>(null)

    // Both code lists are loaded once here (the form's parent) and reused for every apartment
    // card — the create form never fetches either list per row, and they load independently so
    // a failure/slow response on one never blocks the other field.
    const {
        items: residentRoleCodeItems,
        isLoading: isLoadingResidentRoleCodes,
        error: residentRoleCodesError
    } = useCodeListCaptionMap({
        code_group: RESIDENT_ROLE_CODE_GROUP,
        code_name: RESIDENT_ROLE_CODE_NAME,
        language: locale
    })

    const {
        items: relationshipCodeItems,
        isLoading: isLoadingRelationshipCodes,
        error: relationshipCodesError
    } = useCodeListCaptionMap({
        code_group: RESIDENT_RELATIONSHIP_CODE_GROUP,
        code_name: RESIDENT_RELATIONSHIP_CODE_NAME,
        language: locale
    })

    const residentRoleOptions = useMemo(
        () => buildCodeListOptions(
            residentRoleCodeItems.filter(item => item.visible === true && Boolean(item.code_value?.trim())),
            locale
        ),
        [residentRoleCodeItems, locale]
    )

    const relationshipOptions = useMemo(
        () => buildCodeListOptions(relationshipCodeItems, locale),
        [relationshipCodeItems, locale]
    )

    const residentRoleOptionsErrorMessage = residentRoleCodesError
        ? text(dict, 'role_options_load_error', 'Unable to load resident role list.')
        : undefined

    const relationshipOptionsErrorMessage = relationshipCodesError
        ? text(dict, 'relationship_options_load_error', 'Unable to load resident type list.')
        : undefined

    const {
        form,
        saving,
        apartments,
        editingApartmentId,
        isApartmentRelationshipLocked,
        is_app_account_locked,
        created_resident_activation,
        highlightedApartmentId,
        showPassword,
        resetForm,
        closeActivationQrDialog,
        submitProfile,
        selectApartment,
        handleResidentRoleChange,
        handleApartmentRelationshipChange,
        addOrUpdateApartment,
        editApartment,
        removeApartment,
        resetApartmentForm,
        generatePassword,
        togglePasswordVisibility
    } = useCreateResidentProfileForm(session, locale, {
        success: text(dict, 'create_success', 'Resident profile created successfully'),
        failure: text(dict, 'create_failed', 'Create resident profile failed'),
        phoneRequired: text(dict, 'create_phone_required', 'Please enter a phone number.'),
        emailRequired: text(dict, 'email_required', 'Please enter an email.'),
        invalidEmail: text(dict, 'validation_email', 'Email format is invalid.'),
        residentRoleRequired: text(dict, 'validation_resident_role_required', 'Please select a resident role.'),
        apartmentRequired: text(dict, 'validation_apartment_required', 'Project code and apartment code are required'),
        apartmentDuplicated: text(dict, 'validation_apartment_duplicated', 'Apartment code already exists in the list'),
        apartmentListRequired: text(dict, 'validation_apartment_list_required', 'Please add at least one apartment before saving.'),
        ownerRoleRequiresOwnerRelationship: text(dict, 'validation_owner_role_requires_owner_relationship', 'Resident Role Owner can only use Resident Type Owner.'),
        nonOwnerRoleCannotUseOwnerRelationship: text(dict, 'validation_non_owner_role_cannot_use_owner_relationship', 'Non-owner Resident Roles cannot use Resident Type Owner.'),
        invalidRoleRelationshipMapping: text(dict, 'validation_invalid_role_relationship_mapping', 'Resident Type is invalid for the selected Resident Role.')
    }, dict, workingProject, relationshipOptions, residentRoleOptions, () => router.push(`/${locale}/resident/list`))
    const { control, setValue } = form

    const handleProfileSubmit = () => {
        void submitProfile()
    }

    // A newly added/updated apartment row sets highlightedApartmentId — ride that same signal to
    // bring the list into view, instead of tracking a separate "just submitted" flag.
    useEffect(() => {
        if (highlightedApartmentId) {
            apartmentListRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
    }, [highlightedApartmentId])

    const handleCancel = () => {
        if (window.history.length > 1) {
            router.back()
            return
        }

        router.push(`/${locale}/dashboards`)
    }

    const handleOpenImportPage = () => {
        router.push(`/${locale}/resident/import`)
    }

    return (
        <ContentWrapper
            title={text(dict, 'create_title', 'Create Resident Profile')}
            description={text(dict, 'create_description', 'Resident Management - Create Resident Profile')}
            icon={<ApartmentIcon sx={{ fontSize: 40, color: 'primary.main' }} />}
            actions={(
                <Button variant="contained" startIcon={<UploadFileIcon />} onClick={handleOpenImportPage}>
                    {text(dict, 'bulk_import_action', 'Bulk Import')}
                </Button>
            )}
            dictionary={dictionary}
            issearch
        >
            <RequireWorkingProject dictionary={dictionary} sessiontoken={session?.user?.token ?? undefined} language={locale}>
            <Box sx={{ my: 5, width: '100%' }}>
                <form onSubmit={(event) => {
                    event.preventDefault()
                    handleProfileSubmit()
                }}>
                    <Grid container spacing={3}>
                        <Grid size={{ xs: 12, md: 8 }}>
                            <OwnerInformationSection
                                control={control}
                                dict={dict}
                                requiredMessage={requiredMessage}
                                emptyLabel={emptyLabel}
                                sessiontoken={session?.user?.token ?? undefined}
                                locale={locale}
                                setValue={setValue}
                            />
                        </Grid>

                        <Grid size={{ xs: 12, md: 4 }}>
                            <AppAccountSection
                                control={control}
                                dict={dict}
                                requiredMessage={requiredMessage}
                                is_app_account_locked={is_app_account_locked}
                                showPassword={showPassword}
                                onGeneratePassword={generatePassword}
                                onTogglePasswordVisibility={togglePasswordVisibility}
                            />
                        </Grid>

                        <Grid size={{ xs: 12 }}>
                            <ApartmentResidencySection
                                control={control}
                                dict={dict}
                                sessiontoken={session?.user?.token ?? undefined}
                                locale={locale}
                                requiredMessage={requiredMessage}
                                emptyLabel={emptyLabel}
                                workingProject={workingProject}
                                editingApartmentId={editingApartmentId}
                                isApartmentRelationshipLocked={isApartmentRelationshipLocked}
                                residentRoleOptions={residentRoleOptions}
                                isLoadingResidentRoleOptions={isLoadingResidentRoleCodes}
                                residentRoleOptionsErrorMessage={residentRoleOptionsErrorMessage}
                                relationshipOptions={relationshipOptions}
                                isLoadingRelationshipOptions={isLoadingRelationshipCodes}
                                relationshipOptionsErrorMessage={relationshipOptionsErrorMessage}
                                apartments={apartments}
                                highlightedApartmentId={highlightedApartmentId}
                                listRef={apartmentListRef}
                                onApartmentChange={selectApartment}
                                onResidentRoleChange={handleResidentRoleChange}
                                onApartmentRelationshipChange={handleApartmentRelationshipChange}
                                onAddOrUpdateApartment={addOrUpdateApartment}
                                onResetApartmentForm={resetApartmentForm}
                                onEditApartment={editApartment}
                                onRemoveApartment={removeApartment}
                            />
                        </Grid>
                    </Grid>

                    <Box
                        sx={{
                            position: 'sticky',
                            bottom: 0,
                            zIndex: 10,
                            mt: 4,
                            py: 2,
                            display: 'flex',
                            gap: 2,
                            justifyContent: 'flex-start',
                            bgcolor: 'background.paper',
                            borderTop: '1px solid',
                            borderColor: 'divider'
                        }}
                    >
                        <Button variant="outlined" color="secondary" startIcon={<ArrowBackIcon />} onClick={handleCancel} disabled={saving}>
                            {dictCommon.cancel || text(dict, 'cancel', 'Cancel')}
                        </Button>
                        <Button type="submit" variant="contained" startIcon={<SaveIcon />} disabled={saving}>
                            {saving ? text(dict, 'saving', 'Saving...') : text(dict, 'save_profile', 'Save profile')}
                        </Button>
                        <Button type="button" variant="outlined" color="inherit" startIcon={<RestartAltIcon />} onClick={resetForm} disabled={saving}>
                            {dictCommon.reset || text(dict, 'reset', 'Reset')}
                        </Button>
                    </Box>
                </form>
                <ResidentActivationQrDialog
                    dict={dict}
                    open={Boolean(created_resident_activation)}
                    activation={created_resident_activation}
                    onClose={closeActivationQrDialog}
                />
            </Box>
            </RequireWorkingProject>
        </ContentWrapper>
    )
}
