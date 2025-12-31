'use client'

import { Locale } from "@/configs/i18n";
import { FormInput } from "@/types/systemTypes";
import { getDictionary } from "@/utils/getDictionary";
import { parseClassToGrid } from "@/utils/parseClassToGrid";
import { v4 as uuidv4 } from 'uuid';
import RenderInputPreviewDefault from "./render-input-preview";
import RenderSelectPreviewDefault from "./render-select-preview";
import RenderTextAreaPreviewDefault from "./render-area-preview";
import RenderButtonPreviewDefault from "./render-button-preview";
import RenderTablePreviewDefault from "./render-table-preview";

export const RenderPreviewInput = (
    language: Locale,
    dictionary: Awaited<ReturnType<typeof getDictionary>>,
    input: FormInput,
    index: number,
) => {

    //State

    const gridProps = parseClassToGrid(input.default?.class || '');
    const uniqueKey = `${input.default?.id || input.default?.code}-${index}-${uuidv4()}`;

    switch (input.inputtype) {
        case 'cTextInput':
            return (
                <RenderInputPreviewDefault
                    key={uniqueKey}
                    input={input}
                    gridProps={gridProps}
                    language={language}
                />
            )

        case 'jSelect':
            return (
                <RenderSelectPreviewDefault
                    key={uniqueKey}
                    input={input}
                    gridProps={gridProps}
                    language={language}
                />
            )

        case 'cTextArea':
            return (
                <RenderTextAreaPreviewDefault
                    key={uniqueKey}
                    input={input}
                    gridProps={gridProps}
                />
            )
        case 'cTableDefault':
            return (
                <RenderTablePreviewDefault
                    key={uniqueKey}
                    input={input}
                    gridProps={gridProps}
                />
            )
        case 'cButton':
            return (
                <RenderButtonPreviewDefault
                    key={uniqueKey}
                    input={input}
                    gridProps={gridProps}
                />
            )

        default:
            return (
                <div key={uniqueKey}>
                    Unsupported input type: {input.inputtype}
                </div>
            );
    }
};
