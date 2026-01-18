'use client'

import { handleSearchAPI } from '@/@core/components/cButton/handleSearchAPI';
import Application from '@/@core/lib/libSupport';
import { Locale } from '@/configs/i18n';
import { formService } from '@/servers/system-service';
import { FormInput, PageData, RuleStrong } from '@/types/systemTypes';
import { getDictionary } from '@/utils/getDictionary';
import AcUnitIcon from '@mui/icons-material/AcUnit';
import SearchIcon from '@mui/icons-material/Search';
import { Grid, IconButton, InputAdornment, TextField } from '@mui/material';
import { Session } from 'next-auth';
import { useState } from 'react';
import LookupModal from '../../../../../views/components/loopkup/modal';
import { isFieldHidden } from '../rule/isFieldHidden';
import { isFieldRequired } from '../rule/isFieldRequired';
import { disableField } from '../rule/disableField';

type Props = {
    input: FormInput;
    gridProps: Record<string, number>;
    formData: any;
    session: Session | null
    language: Locale;
    rules: RuleStrong[];
    onChange?: (fieldCode: string, value: string) => void;
    dictionary: Awaited<ReturnType<typeof getDictionary>>;
    renderviewdata?: any
};

const RenderLookupDefault = ({
    input,
    gridProps,
    formData,
    session,
    language,
    rules,
    onChange,
    dictionary,
    renderviewdata
}: Props) => {

    const [pageContent, setPageContent] = useState<any | null>(null);
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [datasearch, setDatasearch] = useState<PageData<any>>();

    const columnKey = input.config.structable_read.split('.').pop();

    const value = formData[columnKey] ?? '';

    const hidden = isFieldHidden(rules, columnKey);
    const required = isFieldRequired(input);
    const disable = disableField(rules, columnKey)


    const handleLookupClick = async () => {
        try {
            setLoading(true);
            const response = await formService.loadFormInfo({
                sessiontoken: session?.user?.token as string,
                language: language,
                formid: input.config.callform, // Use the `callform` field in the input config
            });

            if (
                response.status === 200 &&
                response.payload?.dataresponse?.data &&
                response.payload.dataresponse.data.data
            ) {
                const detail = response.payload.dataresponse.data.data;

                const txFo_ = JSON.parse(input.config.txFo);

                const responseLookup = await handleSearchAPI(session, txFo_, 1, 10);
                setPageContent(detail.form_design_detail);
                setDatasearch(responseLookup);
                setIsModalOpen(true);

            } else {
                Application.AppException("#HandleLookupClick", response.payload.error[0].code, "Error");
            }
        } catch (error) {
            console.error('Error fetching lookup data:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Grid size={gridProps} sx={{ marginBottom: '16px' }} display={hidden ? 'none' : 'block'}>
                <TextField
                    fullWidth
                    size="small"
                    placeholder={input.default.condition || ''}
                    variant="outlined"
                    type="text"
                    value={value}
                    label={
                        <>
                            {input.lang?.title?.[language] || input.default?.name || 'Text Input'}
                            {required && <span style={{ color: 'red' }}> *</span>}
                        </>
                    }
                    slotProps={{
                        input: {
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton
                                        onClick={handleLookupClick}
                                        edge="end"
                                        aria-label="lookup"
                                        sx={{ color: '#1976d2' }}
                                        disabled={disable}
                                    >
                                        <SearchIcon />
                                    </IconButton>
                                    {required ? <AcUnitIcon sx={{ color: 'red !important' }} /> : null}
                                </InputAdornment>
                            )
                        }
                    }}
                    onChange={(e) => {
                        const newValue = e.target.value;
                        if (onChange) {
                            onChange(columnKey, newValue);
                        }
                    }}
                    disabled={disable}
                />
            </Grid>

            <LookupModal
                isModalOpen={isModalOpen}
                setIsModalOpen={setIsModalOpen}
                input={input}
                dictionary={dictionary}
                pageContent={pageContent}
                session={session}
                language={language}
                renderviewdata={renderviewdata}
                loading={loading}
                setLoading={setLoading}
                datasearch={datasearch}
            />


        </>
    );
};

export default RenderLookupDefault;
