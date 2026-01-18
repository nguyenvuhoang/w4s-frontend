'use client'

import { Locale } from "@/configs/i18n";
import { MobileContent } from "@/types/systemTypes";
import { getDictionary } from "@/utils/getDictionary";
import { v4 as uuidv4 } from 'uuid';
import RenderDateTimePreview from "./render-datetime-preview";
import RenderLookupPreviewDefault from "./render-lookup-preview";
import RenderMultiPreviewDefault from "./render-multi-preview";
import RenderTablePreviewDefault from "./render-table-preview";
import RenderTextboxPreviewDefault from "./render-textbox-preview";
import RenderButtonPreviewDefault from "./render-button-preview";


export const RenderPreviewMobileInput = (
    language: Locale,
    dictionary: Awaited<ReturnType<typeof getDictionary>>,
    content: MobileContent,
    index: number,
) => {

    const uniqueKey = `${content.viewTemplateID}-${index}-${uuidv4()}`;
    switch (content.type) {
        case 'label':
            return (
                <></>
            )
        case 'text':
        case 'mask':
        case 'currency':
            return (
                <RenderTextboxPreviewDefault
                    key={uniqueKey}
                    language={language}
                    dictionary={dictionary}
                    content={content}
                />
            )
        case 'lookup':
            return (
                <RenderLookupPreviewDefault
                    key={uniqueKey}
                    language={language}
                    dictionary={dictionary}
                    content={content}
                />
            )
        case 'date':
            return (
                <RenderDateTimePreview
                    key={uniqueKey}
                    language={language}
                    dictionary={dictionary}
                    content={content}
                />
            )
        case 'table':
            return (
                <RenderTablePreviewDefault
                    key={uniqueKey}
                    language={language}
                    dictionary={dictionary}
                    content={content}
                />
            )
        case 'button':
            return (
                <RenderButtonPreviewDefault
                    key={uniqueKey}
                    language={language}
                    dictionary={dictionary}
                    content={content}
                />
            )
        case 'multi':
            return (
                <RenderMultiPreviewDefault
                    key={uniqueKey}
                    language={language}
                    dictionary={dictionary}
                    content={content}
                />
            )
        default:
            return (
                <div key={uniqueKey}>
                    {dictionary['common'].unsupporttype}: {content.type}
                </div>
            );
    }
};
