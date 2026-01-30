'use client';

import { getDictionary } from '@utils/getDictionary';
import { NoSsr } from '@mui/material';
import { Session } from 'next-auth';
import { useState } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Layout } from 'react-grid-layout';
import MainDesignArea from './design-form/MainDesignArea';
import SidebarControls from './design-form/sidebar';

const DesignForm = ({ dictionary }: {
    dictionary: Awaited<ReturnType<typeof getDictionary>>
    session: Session | null
    action: string
}) => {
    const [views, setViews] = useState<Layout[]>([]);

    return (
        <>
            <NoSsr />
            <DndProvider backend={HTML5Backend}>
                <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
                    {/* Sidebar */}
                    <SidebarControls />

                    {/* Main Design Area */}
                    <MainDesignArea views={views} setViews={setViews} dictionary={dictionary} />
                </div>
            </DndProvider>
        </>
    );
};

export default DesignForm;

