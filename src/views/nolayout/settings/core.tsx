'use client'

import { CoreConfigData } from '@shared/types/bankType';
import { getDictionary } from '@utils/getDictionary';
import CoreSetting from '@/views/components/console-admin/Core';
import ContentWrapper from '@features/dynamicform/components/layout/content-wrapper';
import HubIcon from '@mui/icons-material/Hub';
import {
    Box
} from '@mui/material';
import { Session } from 'next-auth';


const CoreBankingConnectionSettingContent = ({
    session,
    dictionary,
    configdata
}: {
    session: Session | null
    dictionary: Awaited<ReturnType<typeof getDictionary>>
    configdata: CoreConfigData
}) => {

    return (
        <ContentWrapper
            title={`${dictionary['setting'].coresetting}`}
            description={dictionary['setting'].coresettingdescription}
            icon={<HubIcon sx={{ fontSize: 40, color: '#225087' }} />}
            dictionary={dictionary}
        >
            <Box sx={{ mt: 5, width: '100%' }}>
                <CoreSetting session={session} dictionary={dictionary} configdata={configdata} />
            </Box>

        </ContentWrapper>
    )
}

export default CoreBankingConnectionSettingContent

