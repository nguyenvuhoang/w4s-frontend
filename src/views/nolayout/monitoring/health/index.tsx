'use client'

import { getDictionary } from '@/utils/getDictionary';
import ContentWrapper from '@features/dynamicform/components/layout/content-wrapper';
import ScreenshotMonitorIcon from '@mui/icons-material/ScreenshotMonitor';
import {
    Box
} from '@mui/material';
import { Session } from 'next-auth';

const MonitoringHealthContent = ({
    session,
    dictionary,
}: {
    session: Session | null
    dictionary: Awaited<ReturnType<typeof getDictionary>>
}) => {

    return (
        <ContentWrapper
            title={`${dictionary['setting'].monitoringhealth}`}
            description={dictionary['setting'].monitoringhealthdescription}
            icon={<ScreenshotMonitorIcon sx={{ fontSize: 40, color: '#225087' }} />}
            dictionary={dictionary}
        >
            <Box sx={{ mt: 5, width: '100%' }}>
            </Box>

        </ContentWrapper>
    )
}

export default MonitoringHealthContent
