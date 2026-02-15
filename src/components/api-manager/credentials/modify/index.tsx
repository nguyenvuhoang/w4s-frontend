import { Box, Typography } from '@mui/material'
import ApiIcon from '@mui/icons-material/Api'

import ContentWrapper from '@/features/dynamicform/components/layout/content-wrapper'
import ModifyForm from './ModifyForm'
import { PageProps } from '../add/types'
import { OpenAPIType } from '@/shared/types/systemTypes'

type ModifyProps = PageProps & {
    data: OpenAPIType
}

export default function OpenAPIModifyContent({ dictionary, session, locale, data }: ModifyProps) {
    const dict = dictionary['openapi'] || ({} as any)
    const dictCommon = dictionary['common'] || ({} as any)

    if (!data) {
        return (
            <ContentWrapper
                title={dict.title || 'OpenAPI Client'}
                description={dictCommon.modify || 'Modify details'}
                icon={<ApiIcon sx={{ fontSize: 40, color: 'primary.main' }} />}
                dictionary={dictionary}
            >
                <Box sx={{ my: 5, textAlign: 'center' }}>
                    <Typography color="text.secondary">{dictCommon.nodata || 'No data found'}</Typography>
                </Box>
            </ContentWrapper>
        )
    }

    return (
        <ContentWrapper
            title={`${dict.title} - ${dictCommon.modify || 'Modify'}`}
            description={dict.description}
            icon={<ApiIcon sx={{ fontSize: 40, color: 'primary.main' }} />}
            dictionary={dictionary}
            issearch
        >
            <ModifyForm
                data={data}
                dictionary={dictionary}
                session={session}
                locale={locale}
            />
        </ContentWrapper>
    )
}
