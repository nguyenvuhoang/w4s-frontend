'use client';

import { Locale } from '@/configs/i18n';
import { FormLayoutMobile } from '@shared/types/systemTypes';
import { getDictionary } from '@utils/getDictionary';
import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { RenderMobilePreView } from './preview-mobile';


const RenderLayoutMobilePreview = ({
    language,
    dictionary,
    layout,
}: {
    language: Locale;
    dictionary: Awaited<ReturnType<typeof getDictionary>>
    layout: FormLayoutMobile[];
}

) => {

    const [activeTab, setActiveTab] = useState(0);

    // Separate views into tabs and non-tabs
    const tabViews = layout.filter((view) => view.isTab);
    const nonTabViews = layout.filter(
        (view) => !view.isTab || view.isTab === undefined || view.isTab === null
    );

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setActiveTab(newValue);
    };


    return (
        <div
            key={`${uuidv4()}`}
            style={{ marginBottom: '48px' }}
        >
            {/* Render Non-Tab Views */}
            {nonTabViews.map((view) =>
                RenderMobilePreView(
                    language,
                    dictionary,
                    view
                )
            )}

            {/* Render Tabs */}
            {/* {tabViews.length > 0 &&
                RenderPreviewTabs(
                    language,
                    dictionary,
                    tabViews,
                    activeTab,
                    handleTabChange
                )} */}
        </div>
    );
};

export default RenderLayoutMobilePreview;

