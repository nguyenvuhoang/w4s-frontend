import NoData from '@/components/layout/shared/card/nodata';
import { formService } from '@/servers/system-service';
import { FormInput, RuleStrong } from '@/types/systemTypes';
import LoadingSubmit from '@/components/LoadingSubmit';
import Application from '@/@core/lib/libSupport';
import { useEffect, useState } from 'react';
import { Locale } from '@/configs/i18n';
import { Session } from 'next-auth';
import { Box } from '@mui/material';

import RenderLayout from './layout';


type Props = {
    input: FormInput;
    gridProps: Record<string, number>;
    session: Session | null;
    formData: any;
    setFormData: (data: any) => void;
    language: Locale;
    rules: RuleStrong[];
    setLoading: (loading: boolean) => void;
    dictionary: any;
    renderviewdata?: any;
    ismodify?: boolean;
    searchtextdefault?: string;
    advancedsearchdefault?: string;
};

const DynamicSameMainComponent = ({ input, session, language, dictionary, renderviewdata, ismodify, searchtextdefault, advancedsearchdefault }: Props) => {
    const [pageContent, setPageContent] = useState<any | null>(null);
    const [loading, setLocalLoading] = useState(true);
    const [advancedsearch, setAdvancedSearch] = useState<any>();

    useEffect(() => {
        const loadPageContent = async () => {
            try {
                setLocalLoading(true);
                const response = await formService.loadFormInfo({
                    sessiontoken: session?.user?.token as string,
                    language: language,
                    formid: input.config.callform, // Use the `callform` field in the input config
                });

                if (
                    response.status === 200 &&
                    response.payload?.dataresponse?.data &&
                    response.payload.dataresponse.data.input
                ) {
                    const detail = response.payload.dataresponse.data.input;

                    setPageContent(detail.form_design_detail);
                } else {
                    Application.AppException("#DynamicSameMain", response.payload.error[0].code, "Error");
                }
            } catch (error) {
                Application.AppException("#DynamicSameMain", String(error), "Error");
            } finally {
                setLocalLoading(false);
            }
        };

        loadPageContent();
    }, [input, session, language]);


    return (
        <Box className="relative">
            {loading && <LoadingSubmit loadingtext={dictionary['common'].loading} />}
            {pageContent ? (
                <Box sx={{ padding: 10 }}>
                    <RenderLayout
                        datalayout={pageContent.list_layout}
                        rules={pageContent.info.ruleStrong}
                        session={session}
                        form_id={pageContent.form_id}
                        setLoading={setLocalLoading}
                        dictionary={dictionary}
                        language={language}
                        renderviewdata={renderviewdata}
                        ismodifydefault={ismodify}
                        searchtextdefault={searchtextdefault}
                        advancedsearch={advancedsearch}
                        setAdvancedSearch={setAdvancedSearch}
                        isNested={true}
                    />
                </Box>
            ) : (
                <Box
                    display="flex"
                    justifyContent="center"
                    alignItems="center"
                    height="calc(100vh - 64px)"
                    sx={{
                        flexDirection: 'column',
                    }}
                >
                    <NoData text={dictionary['common'].nodataform} width={100} height={100} />
                </Box>
            )}
        </Box>
    );
};

export default DynamicSameMainComponent;
