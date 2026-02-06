'use client'

import ApiIcon from '@mui/icons-material/Api'
import { Box, Grid } from '@mui/material'

import ContentWrapper from '@/features/dynamicform/components/layout/content-wrapper'
import { AuthDetailsCard, BasicInfoCard, FormActions } from './components'
import { useCredentialForm } from './hooks/useCredentialForm'
import { PageProps } from './types'

export default function OpenAPIAddContent({ dictionary, session }: PageProps) {
    const dict = dictionary['openapi'] || ({} as any)
    const dictCommon = dictionary['common'] || ({} as any)

    const { form, saving, addScope, removeScope, resetForm, onSubmit } = useCredentialForm(session)
    const { control, handleSubmit, watch } = form

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
                                scopes={watch('Scopes') || []}
                                onAddScope={addScope}
                                onRemoveScope={removeScope}
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
                                dictCommon={dictCommon}
                            />
                        </Grid>
                    </Grid>
                </form>
            </Box>
        </ContentWrapper>
    )
}
