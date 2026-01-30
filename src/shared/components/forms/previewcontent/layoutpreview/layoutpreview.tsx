'use client';

import { Locale } from '@/configs/i18n';
import { FormLayout } from '@shared/types/systemTypes';
import { getDictionary } from '@utils/getDictionary';
import { useState } from 'react';
import { RenderPreView } from './preview';
import { RenderPreviewTabs } from './previewtab';


const RenderLayoutPreview = (
    language: Locale,
    dictionary: Awaited<ReturnType<typeof getDictionary>>,
    layout: FormLayout
) => {

    const [activeTab, setActiveTab] = useState(0);

    // Separate views into tabs and non-tabs
    const tabViews = (layout.list_view || []).filter((view) => view.isTab === 'true');
    const nonTabViews = (layout.list_view || []).filter(
        (view) => view.isTab === 'false' || view.isTab === undefined || view.isTab === null
    );

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setActiveTab(newValue);
    };

    return (
        <div
            key={layout.name || `layout-${layout.name}`}
            style={{ marginBottom: '48px' }}
        >
            {/* Render Non-Tab Views */}
            {nonTabViews.map((view) =>
                RenderPreView(
                    language,
                    dictionary,
                    view
                )
            )}

            {/* Render Tabs */}
            {tabViews.length > 0 &&
                RenderPreviewTabs(
                    language,
                    dictionary,
                    tabViews,
                    activeTab,
                    handleTabChange
                )}
        </div>
    );
};

export default RenderLayoutPreview;

