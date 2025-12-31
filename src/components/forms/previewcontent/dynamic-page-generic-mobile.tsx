'use client';

import WrapperContentPage from "@/@layouts/styles/shared/WrapperContentPage";
import NoData from "@/components/layout/shared/card/nodata";
import { Locale } from "@/configs/i18n";
import { FormLayoutMobile } from "@/types/systemTypes";
import { getDictionary } from "@/utils/getDictionary";
import {
    Box
} from '@mui/material';
import RenderLayoutMobilePreview from "./layoutpreviewmobile/layoutpreview";


type PageProps = {
    formlayout: FormLayoutMobile[]
    language: Locale
    dictionary: Awaited<ReturnType<typeof getDictionary>>
}

const DynamicPageGenericMobilePreview = ({ formlayout, language, dictionary }: PageProps) => {
    return (
        <WrapperContentPage>
            <Box className="relative">
                {formlayout ?
                    <>
                        <Box sx={{ padding: 5 }}>
                            <RenderLayoutMobilePreview
                                language={language}
                                dictionary={dictionary}
                                layout={formlayout}
                            />
                        </Box>
                    </> :
                    <Box
                        display="flex"
                        justifyContent="center"
                        alignItems="center"
                        height="100vh"
                    >
                        <NoData text={dictionary['common'].nodataform} width={100} height={100} />
                    </Box>
                }
            </Box>
        </WrapperContentPage>
    );
};

export default DynamicPageGenericMobilePreview;
