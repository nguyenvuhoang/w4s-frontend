'use client'

import { getDictionary } from "@/utils/getDictionary";
import Info from "./Info";
import PreviewLayout from "./layout";
import MobileInfo from "./mobile-info";
import MobileLayout from "./mobile-layout";
import XMLViewer from "./XMLViewer";

export const renderInterface = (
    data: any,
    previewtype: string,
    app: string,
    dictionary: Awaited<ReturnType<typeof getDictionary>>,
    datatype?: string
) => {
    if (datatype === "XML") {
        return <XMLViewer xmlData={data} dictionary={dictionary} />;
    }
    switch (previewtype) {
        case 'info':
            return app === 'mobile' ? (
                <MobileInfo data={data} dictionary={dictionary} />
            ) : (
                <Info data={data} />
            );
        case 'layout':
            return app === 'mobile' ? (
                <MobileLayout data={data} dictionary={dictionary} />
            ) : (
                <PreviewLayout data={data} dictionary={dictionary} />
            )
    }
};
