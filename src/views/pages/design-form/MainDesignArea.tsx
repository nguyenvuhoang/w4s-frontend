'use client';

import { useState } from 'react';
import LayoutBuilder from './LayoutBuilder';
import HeaderArea from './HeaderArea';
import { DeviceView } from '@/types';
import { getDictionary } from '@/utils/getDictionary';

type Props = {
    views: any[];
    setViews: (views: any[]) => void;
    dictionary: Awaited<ReturnType<typeof getDictionary>>
};

const MainDesignArea = ({ views, setViews, dictionary }: Props) => {
    const [selectedView, setSelectedView] = useState<DeviceView>('desktop');


    return (
        <main style={{ flex: 1, padding: '16px', overflow: 'auto' }}>
            {/* Preview and Device Buttons in One Row */}
            <HeaderArea selectedView={selectedView} setSelectedView={setSelectedView} dictionary={dictionary} />

            {/* Layout Builder */}
            <LayoutBuilder
                selectedView={selectedView}
            />

        </main>
    );
};

export default MainDesignArea;
