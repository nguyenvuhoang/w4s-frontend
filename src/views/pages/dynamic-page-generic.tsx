'use client';

import WrapperContentPage from "@/@layouts/styles/shared/WrapperContentPage";
import NoData from "@/components/layout/shared/card/nodata";
import LoadingSubmit from "@/components/LoadingSubmit";
import { Locale } from "@/configs/i18n";
import { FormDesignDetail } from "@/types/systemTypes";
import { getDictionary } from "@/utils/getDictionary";
import { getLocalizedName } from "@/utils/getLocalizedName";
import * as Icons from '@mui/icons-material';
import {
    Box,
    Divider,
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
}

const DynamicPageGeneric = ({ formdesigndetail, session, language, dictionary, renderviewdata, ismodify }: PageProps) => {
    // State
    const [loading, setLoading] = useState(false)
    const [advancedsearch, setAdvancedSearch] = useState<any>();

    const { form_id, info, list_layout } = formdesigndetail || {
        form_id: null,
        info: null,
        list_layout: null
    };

    const DynamicIcon = info?.url_input && (Icons as any)[info?.url_input] ? (Icons as any)[info?.url_input] : Icons.AccountBalance;

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
                                    backgroundColor: "#f9f9f9",
                                    borderRadius: 2,
                                    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)"
                                }}
                            >
                                <Stack spacing={2}>
                                    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                                        <DynamicIcon sx={{ fontSize: 40, color: "#225087" }} />
                                        <Typography
                                            variant="h4"
                                            sx={{
                                                fontWeight: "bold",
                                                color: "#225087"
                                            }}
                                        >
                                            {getLocalizedName(info?.lang_form, language)}
                                        </Typography>
                                    </Box>
                                    <Typography
                                        variant="body1"
                                        sx={{ color: "#225087" }}
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
