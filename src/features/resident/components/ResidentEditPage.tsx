'use client'

import { useEffect, useState } from 'react'
import type { SyntheticEvent } from 'react'

import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import PeopleAltIcon from '@mui/icons-material/PeopleAlt'
import { Box, Breadcrumbs, Button, Chip, Stack, Tab, Tabs, Typography } from '@mui/material'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

import type { Locale } from '@/configs/i18n'
import ContentWrapper from '@/features/dynamicform/components/layout/content-wrapper'
import { compactActionButtonSx } from '@/shared/components/forms/button-color/actionButtonSx'
import type { WorkflowErrorPresentation } from '@/shared/utils/workflowError'

import { useResidentAccountEditForm } from '../hooks/useResidentAccountEditForm'
import { useResidentChangeUsername } from '../hooks/useResidentChangeUsername'
import { useResidentProfileEditForm } from '../hooks/useResidentProfileEditForm'
import type { ResidentAccount, ResidentContext, ResidentDetail, ResidentListStatus } from '../types'
import ResidentDetailLoadState from './resident-detail/ResidentDetailLoadState'
import { getResidentDetailPageState } from './resident-detail/residentDetailErrorHelpers'
import ResidentAccountEditTab from './resident-edit/ResidentAccountEditTab'
import ResidentChangeUsernameDialog from './resident-edit/ResidentChangeUsernameDialog'
import ResidentProfileEditTab from './resident-edit/ResidentProfileEditTab'
import { getResidentStatusColor, getResidentStatusLabel, residentText, type ResidentDictionary } from './resident-list/residentListHelpers'

type DataResult<T> = {
    data: T | null
    error: WorkflowErrorPresentation | null
}

type Props = {
    dictionary: ResidentDictionary
    locale: Locale
    sessiontoken?: string
    residentId: number
    residentDetail: ResidentDetail | null
    detailError: WorkflowErrorPresentation | null
    contextResult: DataResult<ResidentContext>
    residentStatus?: string | null
    account?: ResidentAccount | null
    accountError?: string | null
}

type EditTabKey = 'profile' | 'account'

const ResidentEditPage = ({
    dictionary,
    locale,
    sessiontoken,
    residentId,
    residentDetail,
    detailError,
    contextResult,
    residentStatus,
    account = null,
    accountError = null
}: Props) => {
    const router = useRouter()
    const [activeTab, setActiveTab] = useState<EditTabKey>('profile')
    const general = contextResult.data?.general ?? null
    const status = (residentStatus as ResidentListStatus) || 'A'
    const detailHref = `/${locale}/resident/detail/${residentId}`
    const pageState = getResidentDetailPageState(residentDetail, detailError)

    const profileForm = useResidentProfileEditForm({
        dictionary,
        sessiontoken,
        language: locale,
        residentId,
        general,
        status,
        detail: residentDetail,
        onSaved: () => router.refresh()
    })

    const accountForm = useResidentAccountEditForm({
        dictionary,
        sessiontoken,
        language: locale,
        account,
        onSaved: () => router.refresh()
    })

    const changeUsername = useResidentChangeUsername({
        dictionary,
        sessiontoken,
        language: locale,
        residentId,
        general,
        status,
        detail: residentDetail,
        current_username: accountForm.form_values?.login_name ?? '',
        onChanged: new_username => {
            accountForm.applyLoginName(new_username)
            router.refresh()
        }
    })

    const isDirty = profileForm.isDirty || accountForm.isDirty

    useEffect(() => {
        if (!isDirty) return
        const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = '' }

        window.addEventListener('beforeunload', warn)

        return () => window.removeEventListener('beforeunload', warn)
    }, [isDirty])

    const confirmLeave = () => !isDirty || window.confirm(residentText(dictionary, 'edit_leave_confirm', 'Bạn có thay đổi chưa lưu. Rời khỏi trang mà không lưu?'))

    const handleTabChange = (_event: SyntheticEvent, value: EditTabKey) => {
        if (value === activeTab) return
        if (!confirmLeave()) return
        setActiveTab(value)
    }

    const handleBackToDetail = () => {
        if (!confirmLeave()) return
        router.push(detailHref)
    }

    return (
        <ContentWrapper
            title={residentText(dictionary, 'edit_page_title', 'Chỉnh sửa cư dân')}
            description={residentText(dictionary, 'edit_page_subtitle', 'Cập nhật hồ sơ cư dân và thông tin tài khoản đăng nhập.')}
            icon={<PeopleAltIcon sx={{ fontSize: 40, color: 'primary.main' }} />}
            dictionary={dictionary}
        >
            <Stack spacing={3} sx={{ mt: 3 }}>
                <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" gap={2}>
                    <Stack spacing={1}>
                        <Breadcrumbs>
                            <Typography color="text.secondary">{residentText(dictionary, 'resident', 'Cư dân')}</Typography>
                            <Link href={detailHref} style={{ color: 'inherit', textDecoration: 'none' }}>
                                {residentText(dictionary, 'detail_title', 'Chi tiết cư dân')}
                            </Link>
                            <Typography color="text.primary">{residentText(dictionary, 'edit_page_title', 'Chỉnh sửa cư dân')}</Typography>
                        </Breadcrumbs>
                        <Typography variant="h4" sx={{ fontWeight: 900 }}>{residentText(dictionary, 'edit_page_title', 'Chỉnh sửa cư dân')}</Typography>
                        {residentDetail && (
                            <Stack direction="row" gap={1} alignItems="center" flexWrap="wrap">
                                <Typography variant="body2" color="text.secondary">
                                    {residentDetail.resident_code} · {residentDetail.full_name}
                                </Typography>
                                <Chip size="small" color={getResidentStatusColor(status)} label={getResidentStatusLabel(dictionary, status)} />
                            </Stack>
                        )}
                    </Stack>
                    <Stack direction="row" gap={1} flexWrap="wrap" alignItems="center" justifyContent={{ xs: 'flex-start', md: 'flex-end' }}>
                        <Button variant="outlined" size="small" startIcon={<ArrowBackIcon />} onClick={handleBackToDetail} sx={compactActionButtonSx}>
                            {residentText(dictionary, 'edit_back_to_detail', 'Quay lại chi tiết cư dân')}
                        </Button>
                    </Stack>
                </Stack>

                {pageState === 'ready' ? (
                    <>
                        <Box
                            sx={{
                                borderRadius: 2,
                                overflow: 'hidden',
                                px: { xs: 1, sm: 2 },
                                background: theme => `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 55%, ${theme.palette.primary.dark} 100%)`
                            }}
                        >
                            <Tabs
                                value={activeTab}
                                onChange={handleTabChange}
                                aria-label={residentText(dictionary, 'edit_tabs_label', 'Các tab chỉnh sửa cư dân')}
                                textColor="inherit"
                                sx={{
                                    minHeight: 48,
                                    '& .MuiTabs-flexContainer': { gap: { xs: 2, sm: 4 } },
                                    '& .MuiTabs-indicator': { backgroundColor: 'common.white', height: 3, borderRadius: 1.5 },
                                    '& .MuiTab-root': { color: 'rgba(255,255,255,0.65)', fontWeight: 600, textTransform: 'none', minHeight: 48, p: 0 },
                                    '& .MuiTab-root.Mui-selected': { color: 'common.white', fontWeight: 800 }
                                }}
                            >
                                <Tab value="profile" label={residentText(dictionary, 'edit_tab_profile', 'Thông tin cư dân')} />
                                <Tab value="account" label={residentText(dictionary, 'edit_tab_account', 'Tài khoản đăng nhập')} />
                            </Tabs>
                        </Box>

                        <Box role="tabpanel" hidden={activeTab !== 'profile'}>
                            {activeTab === 'profile' && (
                                <ResidentProfileEditTab
                                    dictionary={dictionary}
                                    locale={locale}
                                    sessiontoken={sessiontoken}
                                    form_values={profileForm.form_values}
                                    form_errors={profileForm.form_errors}
                                    general_error={profileForm.general_error}
                                    saving={profileForm.saving}
                                    on_save={() => void profileForm.save()}
                                    on_update_form={profileForm.updateForm}
                                />
                            )}
                        </Box>

                        <Box role="tabpanel" hidden={activeTab !== 'account'}>
                            {activeTab === 'account' && (
                                <ResidentAccountEditTab
                                    dictionary={dictionary}
                                    account_available={accountForm.available}
                                    account_error={accountError}
                                    login_name={accountForm.form_values?.login_name ?? ''}
                                    on_change_username={changeUsername.openDialog}
                                />
                            )}
                            <ResidentChangeUsernameDialog
                                dictionary={dictionary}
                                open={changeUsername.open}
                                current_username={accountForm.form_values?.login_name ?? ''}
                                values={changeUsername.values}
                                field_errors={changeUsername.field_errors}
                                error={changeUsername.error}
                                submitting={changeUsername.submitting}
                                on_change={changeUsername.updateValue}
                                on_close={changeUsername.closeDialog}
                                on_confirm={() => void changeUsername.submit()}
                            />
                        </Box>
                    </>
                ) : (
                    <ResidentDetailLoadState
                        dictionary={dictionary}
                        state={pageState}
                        error={detailError}
                        backHref={detailHref}
                        retrying={false}
                        onRetry={() => router.refresh()}
                    />
                )}
            </Stack>
        </ContentWrapper>
    )
}

export default ResidentEditPage
