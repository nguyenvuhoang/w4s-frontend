'use client'

import ApiIcon from '@mui/icons-material/Api'
import { Box, Grid } from '@mui/material'
import { Locale } from '@/configs/i18n'
import { useRouter } from '@shared/hooks/useRouter'

import ContentWrapper from '@/features/dynamicform/components/layout/content-wrapper'
import { getLocalizedUrl } from '@/shared/utils/i18n'
import { AuthDetailsCard, BasicInfoCard, FormActions } from './components'
import { useCredentialForm } from './hooks/useCredentialForm'
import { PageProps } from './types'

export default function OpenAPIAddContent({ dictionary, session, locale }: PageProps) {
    const router = useRouter()
    const dict = dictionary['openapi'] || ({} as any)
    const dictCommon = dictionary['common'] || ({} as any)

    const { form, saving, resetForm, onSubmit } = useCredentialForm(session, locale)
    const { control, handleSubmit } = form

    const handleBack = () => router.push(getLocalizedUrl('/api-manager/credentials/', locale as Locale))

    return (
        <ContentWrapper
            title={`${dict.title} - ${dictCommon.add || 'Add'}`}
            description={dict.description}
            icon={<ApiIcon sx={{ fontSize: 40, color: 'primary.main' }} />}
            dictionary={dictionary}
            issearch
        >
            <Box sx={{ my: 5, width: '100%' }}>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <Grid container spacing={3}>
                        {/* Left: Basic Info */}
                        <Grid size={{ xs: 12, md: 6 }}>
                            <BasicInfoCard
                                control={control}
                                dict={dict}
                            />
                        </Grid>

                        {/* Right: Auth Details */}
                        <Grid size={{ xs: 12, md: 6 }}>
                            <AuthDetailsCard control={control} dict={dict} />
                        </Grid>

                        {/* Actions */}
                        <Grid size={{ xs: 12 }}>
                            <FormActions
                                saving={saving}
                                onReset={resetForm}
                                onBack={handleBack}
                                dictCommon={dictCommon}
                            />
                        </Grid>
                    </Grid>
                </form>
            </Box>
        </ContentWrapper>
    )
}
