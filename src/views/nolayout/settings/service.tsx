'use client'

import { getDictionary } from '@/utils/getDictionary'
import Settings from '@/views/components/console-admin/Settings';
import ContentWrapper from '@/views/components/layout/content-wrapper'
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import {
    Box
} from '@mui/material'
import { Session } from 'next-auth'


const ServiceSettingsContent = ({
    session,
    dictionary
}: {
    session: Session | null
    dictionary: Awaited<ReturnType<typeof getDictionary>>
}) => {

    return (
        <ContentWrapper
            title={`${dictionary['setting'].servicesetting}`}
            description={dictionary['setting'].servicesettingdescription}
            icon={<SettingsOutlinedIcon sx={{ fontSize: 40, color: '#225087' }} />}
            dictionary={dictionary}
        >
            <Box sx={{ mt: 5, width: '100%' }}>
                <Settings session={session} dictionary={dictionary} />
            </Box>

        </ContentWrapper>
    )
}

export default ServiceSettingsContent
