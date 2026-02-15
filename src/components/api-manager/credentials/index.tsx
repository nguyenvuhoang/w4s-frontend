import ApiIcon from '@mui/icons-material/Api'
import { Box } from '@mui/material'

import ContentWrapper from '@/features/dynamicform/components/layout/content-wrapper'
import { OpenAPIType, PageContentProps, PageData } from '@/shared/types'
import { getDictionary } from '@/shared/utils/getDictionary'
import { Locale } from '@/configs/i18n'
import { Session } from 'next-auth'
import OpenAPIList from './OpenAPIList'

type PageProps = PageContentProps & {
    openAPIdata: PageData<OpenAPIType>
    dictionary: Awaited<ReturnType<typeof getDictionary>>
    session: Session | null
    locale: Locale
}

export default function OpenAPIManagementContent({ dictionary, openAPIdata, session, locale }: PageProps) {
    const dict = dictionary['openapi'] || ({} as any)

    return (
        <ContentWrapper
            title={dict.title || 'OpenAPI Clients'}
            description={dict.description || 'Manage API clients & keys'}
            icon={<ApiIcon sx={{ fontSize: 40, color: '#0C9150' }} />}
            dictionary={dictionary}
            issearch
        >
            <Box sx={{ my: 5, width: '100%' }}>
                <OpenAPIList
                    openAPIdata={openAPIdata}
                    dictionary={dictionary}
                    session={session}
                    locale={locale}
                />
            </Box>
        </ContentWrapper>
    )
}
