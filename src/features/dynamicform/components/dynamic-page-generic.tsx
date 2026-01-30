'use client';

import LoadingSubmit from "@components/LoadingSubmit";
import { Locale } from "@/configs/i18n";
import { FormDesignDetail } from "@shared/types/systemTypes";
import { getDictionary } from "@utils/getDictionary";
import {
    Box
} from '@mui/material';
import { Session } from "next-auth";
import { useState } from "react";
import RenderLayout from "./layout";


type PageProps = {
    formdesigndetail: FormDesignDetail
    session: Session | null
    language: Locale
    dictionary: Awaited<ReturnType<typeof getDictionary>>;
    renderviewdata?: any
    ismodify?: boolean
    roleTask?: any
}

const DynamicPageGeneric = ({
    formdesigndetail,
    session,
    language,
    dictionary,
    renderviewdata,
    ismodify,
    roleTask
}: PageProps) => {
    // State
    const [loading, setLoading] = useState(false)
    const [advancedsearch, setAdvancedSearch] = useState<Record<string, unknown>>();

    const { form_id, info, list_layout } = formdesigndetail || {
        form_id: null,
        info: null,
        list_layout: null
    };
    return (
        <Box className="relative">
            {loading &&
                <LoadingSubmit loadingtext={dictionary['common'].loading} position="fixed" />
            }
            <>
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
            </>

        </Box>
    );
};

export default DynamicPageGeneric;

