'use client';

import WrapperContentPage from "@/@layouts/styles/shared/WrapperContentPage";
import NoData from "@/components/layout/shared/card/nodata";
import LoadingSubmit from "@/components/LoadingSubmit";
import { Locale } from "@/configs/i18n";
import { FormDesignDetail } from "@/types/systemTypes";
import { getDictionary } from "@/utils/getDictionary";
import { getLocalizedName } from "@/utils/getLocalizedName";
import {
    Box,
    Divider,
    Icon,
    NoSsr,
    Stack,
    Typography
} from '@mui/material';
import { Session } from "next-auth";
import { useState } from "react";
import RenderLayout from "../components/layout";


type PageProps = {
    formdesigndetail: FormDesignDetail
    session: Session | null
    language: Locale
    dictionary: Awaited<ReturnType<typeof getDictionary>>;
    renderviewdata?: any
    ismodify?: boolean
    roleTask?: any
}

const DynamicPageGeneric = ({ formdesigndetail, session, language, dictionary, renderviewdata, ismodify, roleTask }: PageProps) => {
    // State
    const [loading, setLoading] = useState(false)
    const [advancedsearch, setAdvancedSearch] = useState<Record<string, unknown>>();

    const { form_id, info, list_layout } = formdesigndetail || {
        form_id: null,
        info: null,
        list_layout: null
    };
    const getIconName = (iconInput?: string): string => {
        if (!iconInput) return 'account_balance';
        return iconInput
            .replace(/([A-Z])/g, '_$1')
            .toLowerCase()
            .replace(/^_/, '');
    };

    const isFormDeclared = form_id && info && list_layout;
    return (
        <NoSsr>
            <WrapperContentPage>
                <Box className="relative">
                    {loading &&
                        <LoadingSubmit loadingtext={dictionary['common'].loading} position="fixed" />
                    }
                    {isFormDeclared ?
                        <>
                            <Box
                                sx={{
                                    padding: 5,
                                    backgroundColor: 'background.default',
                                    borderRadius: 2,
                                    boxShadow: 1
                                }}
                            >
                                <Stack spacing={2}>
                                    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                                        <Icon sx={{ fontSize: 40, color: 'primary.main' }}>
                                            {getIconName(info?.url_input)}
                                        </Icon>
                                        <Typography
                                            variant="h4"
                                            sx={{
                                                fontWeight: "bold",
                                                color: 'primary.main'
                                            }}
                                        >
                                            {getLocalizedName(info?.lang_form, language)}
                                        </Typography>
                                    </Box>
                                    <Typography
                                        variant="body1"
                                        sx={{ color: 'primary.main' }}
                                    >
                                        {getLocalizedName(info?.des, language)}
                                    </Typography>
                                </Stack>
                                <Divider sx={{ mt: 2 }} />
                            </Box>


                            <Box sx={{ padding: 10 }}>
                                <RenderLayout
                                    datalayout={list_layout}
                                    rules={info.ruleStrong}
                                    session={session}
                                    form_id={form_id}
                                    setLoading={setLoading}
                                    dictionary={dictionary}
                                    language={language}
                                    renderviewdata={renderviewdata}
                                    advancedsearch={advancedsearch}
                                    setAdvancedSearch={setAdvancedSearch}
                                    ismodifydefault={ismodify}
                                    roleTask={roleTask}
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
        </NoSsr>
    );
};

export default DynamicPageGeneric;
