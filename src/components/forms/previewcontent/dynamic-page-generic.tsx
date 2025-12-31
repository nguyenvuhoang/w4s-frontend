'use client';

import WrapperContentPage from "@/@layouts/styles/shared/WrapperContentPage";
import NoData from "@/components/layout/shared/card/nodata";
import { Locale } from "@/configs/i18n";
import { FormLayout } from "@/types/systemTypes";
import { getDictionary } from "@/utils/getDictionary";
import {
    Box
} from '@mui/material';
import RenderLayoutPreview from "./layoutpreview/layoutpreview";


type PageProps = {
    formlayout: FormLayout[]
    language: Locale
    dictionary: Awaited<ReturnType<typeof getDictionary>>
}

const DynamicPageGenericPreview = ({ formlayout, language, dictionary }: PageProps) => {

    return (
        <WrapperContentPage>
            <Box className="relative">
                {formlayout ?
                    <>
                        <Box sx={{ padding: 10 }}>
                            {
                                formlayout.map((layout) =>
                                    RenderLayoutPreview(
                                        language,
                                        dictionary,
                                        layout
                                    )
                                )
                            }
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

export default DynamicPageGenericPreview;
