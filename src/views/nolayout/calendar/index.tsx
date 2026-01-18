'use client';

import { Locale } from '@/configs/i18n';
import { PageContentProps } from '@/types';
import { getDictionary } from '@/utils/getDictionary';
import ContentWrapper from '@features/dynamicform/components/layout/content-wrapper';
import { Session } from 'next-auth';


// MUI
import { ContractType } from '@/types/bankType';
import { PageData } from '@/types/systemTypes';
import { Box } from '@mui/material';
import CalendarMain from './CalendarMain';
import { useState } from 'react';
import { CalendarColors, CalendarColorsDetail } from '@/types/calendarTypes';


type PageProps = PageContentProps & {
    dictionary: Awaited<ReturnType<typeof getDictionary>>;
    session: Session | null;
    locale: Locale;
    calendarData: PageData<ContractType>
};

const calendarsColor: CalendarColors = {
    Personal: 'success',
    Business: 'primary',
    Family: 'warning',
    Holiday: 'primary',
    ETC: 'info'
}
const calendarsColorDetail: CalendarColorsDetail = {
    A: 'success',
    P: 'warning',
    R: 'error',
    C: 'info'
}

const CalendarContent = ({
    dictionary
}: PageProps) => {
    const [calendarApi, setCalendarApi] = useState<null | any>(null)
    const [leftSidebarOpen, setLeftSidebarOpen] = useState<boolean>(false)

    const handleSelectEvent = () => { }
    const handleLeftSidebarToggle = () => setLeftSidebarOpen(!leftSidebarOpen)
    const handleAddEventSidebarToggle = () => { }

    return (
        <ContentWrapper
            title={dictionary['calendar']?.title}
            description={dictionary['calendar']?.description}
            icon={<></>}
            dictionary={dictionary}
            issearch={false}
        >
            <Box sx={{ my: 5, width: '100%' }}>
                <CalendarMain
                    events={[]}
                    updateEvent={() => { }}
                    calendarApi={calendarApi}
                    calendarsColor={calendarsColor}
                    calendarsColorDetail={calendarsColorDetail}
                    setCalendarApi={setCalendarApi}
                    handleSelectEvent={handleSelectEvent}
                    handleLeftSidebarToggle={handleLeftSidebarToggle}
                    handleAddEventSidebarToggle={handleAddEventSidebarToggle}
                    editTable={false}
                    eventStartEditable={false}
                />
            </Box>
        </ContentWrapper>
    );
};

export default CalendarContent;
