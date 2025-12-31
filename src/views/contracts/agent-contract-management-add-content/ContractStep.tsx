'use client';

import FormField from '@/@core/components/form-field';
import { selectOptionsPurpose } from '@/data/meta';
import { WORKFLOWCODE } from '@/data/WorkflowCode';
import { systemServiceApi } from '@/servers/system-service';
import { PageContentProps } from '@/types';
import AcUnitIcon from '@mui/icons-material/AcUnit';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import { Grid, InputAdornment } from '@mui/material';
import dayjs from 'dayjs';
import { useEffect, useRef } from 'react';
import { useFormContext } from 'react-hook-form';

const ContractStep = ({ dictionary, session }: PageContentProps) => {
    const {
        control,
        formState: { errors },
        setValue,
        getValues
    } = useFormContext();

    //Data

    const selectOptionsType = [
        { value: 'INDIVIDUAL', label: 'Individual' },
        { value: 'BUSINESS', label: 'Business' },
    ];


    const selectOptionsStatus = [
        { value: 'INITIAL', label: 'Initial' },
        { value: 'PENDING', label: 'Pending' },
        { value: 'ACTIVE', label: 'Active' },
        { value: 'SUSPENDED', label: 'Suspended' },
        { value: 'CLOSED', label: 'Closed' },
    ];

    const didInitDefaultDate = useRef(false);
    const didInitContract = useRef(false);


    useEffect(() => {
        const currentNumber = getValues('contractNumber');
        if (currentNumber) return;

        const fetchContract = async () => {
            try {
                const response = await systemServiceApi.runBODynamic({
                    sessiontoken: session?.user?.token as string,
                    txFo: {
                        bo: [
                            {
                                use_microservice: true,
                                input: {
                                    workflowid: WORKFLOWCODE.GENERATE_CONTRACT_NUMBER,
                                    learn_api: 'cbs_workflow_execute',
                                },
                            },
                        ],
                    },
                });

                if (response.status === 200 && response.payload?.dataresponse?.fo) {
                    const contractnumber =
                        response.payload.dataresponse.fo[0]?.input?.contractnumber as string;
                    setValue('contractNumber', contractnumber);
                }
            } catch (error) {
                console.error('❌ Error fetching contract number:', error);
            }
        };

        fetchContract();
    }, [setValue, session?.user?.token, getValues]);


    useEffect(() => {
        if (didInitDefaultDate.current) return;
        didInitDefaultDate.current = true;

        const now = dayjs().format('YYYY-MM-DD');
        const toDate = dayjs().add(20, 'year').format('YYYY-MM-DD');

        setValue('fromdate', now);
        setValue('todate', toDate);
    }, [setValue]);


    useEffect(() => {
        if (didInitContract.current) return;
        didInitContract.current = true;

        setValue('contractpurpose', 'AM');
        setValue('contracttype', 'BUSINESS');
        setValue('contractstatus', 'INITIAL');
    }, [setValue]);

    return (
        <Grid container spacing={5}>
            <Grid size={{ xs: 12, md: 6 }}>
                <FormField
                    name="contractNumber"
                    label={dictionary['contract'].contractnumber}
                    type="text"
                    placeholder={dictionary['contract'].contractnumber}
                    control={control}
                    errors={errors}
                    rules={{
                        required: `${dictionary['common'].fieldrequired.replace(
                            '{field}',
                            dictionary['contract'].contractnumber
                        )}`,
                    }}
                    endAdornment={
                        <InputAdornment
                            position="end"
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                animation: errors['contractNumber']
                                    ? 'spin 1s linear infinite'
                                    : 'none',
                            }}
                        >
                            <AcUnitIcon sx={{ color: 'red !important' }} />
                        </InputAdornment>
                    }
                    size="small"
                    disabled={true}
                />
            </Grid>


            <Grid size={{ xs: 12, md: 6 }}>
                <FormField
                    name="contractstatus"
                    label={dictionary['contract'].contractstatus || 'Contract Status'}
                    type="select"
                    control={control}
                    errors={errors}
                    rules={{
                        required: `${dictionary['common'].fieldrequired.replace(
                            '{field}',
                            dictionary['contract'].contractstatus || 'Contract Status'
                        )}`,
                    }}
                    size="small"
                    options={selectOptionsStatus}
                    disabled
                />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
                <FormField
                    name="fromdate"
                    label={dictionary['contract'].fromdate}
                    type="date"
                    control={control}
                    errors={errors}
                    rules={{
                        required: `${dictionary['common'].fieldrequired.replace(
                            '{field}',
                            dictionary['contract'].fromdate
                        )}`,
                    }}
                    size="small"
                    endAdornment={
                        <span style={{ display: 'flex', alignItems: 'center' }}>
                            <CalendarTodayIcon sx={{ marginRight: 1, color: "green" }} />
                        </span>
                    }
                    disabled
                />
            </Grid>


            <Grid size={{ xs: 12, md: 6 }}>
                <FormField
                    name="todate"
                    label={dictionary['contract'].todate}
                    type="date"
                    control={control}
                    errors={errors}
                    rules={{
                        required: `${dictionary['common'].fieldrequired.replace(
                            '{field}',
                            dictionary['contract'].todate
                        )}`,
                    }}
                    size="small"
                    endAdornment={
                        <span style={{ display: 'flex', alignItems: 'center' }}>
                            <CalendarTodayIcon sx={{ marginRight: 1, color: "green" }} />
                        </span>
                    }
                    disabled
                />
            </Grid>


            <Grid size={{ xs: 12, md: 6 }}>
                <FormField
                    name="contractpurpose"
                    label={dictionary['contract'].contractpurpose}
                    type="select"
                    control={control}
                    errors={errors}
                    rules={{
                        required: `${dictionary['common'].fieldrequired.replace(
                            '{field}',
                            dictionary['contract'].contractpurpose
                        )}`,
                    }}
                    size="small"
                    options={selectOptionsPurpose}
                    disabled
                />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
                <FormField
                    name="contracttype"
                    label={dictionary['contract'].contracttype}
                    type="select"
                    control={control}
                    errors={errors}
                    rules={{
                        required: `${dictionary['common'].fieldrequired.replace(
                            '{field}',
                            dictionary['contract'].contracttype
                        )}`,
                    }}
                    size="small"
                    options={selectOptionsType}
                    disabled
                />
            </Grid>


        </Grid>
    );
};

export default ContractStep;
