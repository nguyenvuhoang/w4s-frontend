'use client'

import { getDictionary } from '@utils/getDictionary';
import ContentWrapper from '@features/dynamicform/components/layout/content-wrapper';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import {
    Box
} from '@mui/material';
import { Session } from 'next-auth';


const ServiceInstanceContent = ({
    session,
    dictionary
}: {
    session: Session | null
    dictionary: Awaited<ReturnType<typeof getDictionary>>
}) => {

    return (
        <ContentWrapper
            title={`${dictionary['setting'].serviceinstance}`}
            description={dictionary['setting'].serviceinstancedescription}
            icon={<SettingsOutlinedIcon sx={{ fontSize: 40, color: '#225087' }} />}
            dictionary={dictionary}
        >
            <Box sx={{ mt: 5, width: '100%' }}>

            </Box>

        </ContentWrapper>
    )
}

export default ServiceInstanceContent

