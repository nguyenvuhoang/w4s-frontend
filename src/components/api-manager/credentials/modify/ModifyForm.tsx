'use client'

import { Box, Grid } from '@mui/material'
import { useRouter } from 'next/navigation'
import { Locale } from '@/configs/i18n'
import { getLocalizedUrl } from '@/shared/utils/i18n'
import { AuthDetailsCard, BasicInfoCard, FormActions } from '../add/components'
import { useModifyCredentialForm } from './hooks/useModifyCredentialForm'
import { OpenAPIType } from '@/shared/types/systemTypes'
import { Session } from 'next-auth'
import { getDictionary } from '@/shared/utils/getDictionary'

type ModifyFormProps = {
    data: OpenAPIType
    dictionary: Awaited<ReturnType<typeof getDictionary>>
    session: Session | null
    locale: Locale
}

export default function ModifyForm({ data, dictionary, session, locale }: ModifyFormProps) {
    const router = useRouter()
    const dict = dictionary['openapi'] || ({} as any)
    const dictCommon = dictionary['common'] || ({} as any)

    const { form, saving, resetForm, onSubmit } = useModifyCredentialForm(session, data, locale)
    const { control, handleSubmit } = form

    const handleBack = () => router.push(getLocalizedUrl('/api-manager/credentials/', locale as Locale))

    return (
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
    )
}
