'use client'

import { useState } from 'react';
import { useFormContext } from 'react-hook-form';
import SwalAlert from '@/utils/SwalAlert';
import { handleSearchAPI } from '@/@core/components/cButton/handleSearchAPI';
import { createTxFo } from '@/utils/createTxFo';
import { WORKFLOWCODE } from '@/data/WorkflowCode';
import { systemServiceApi } from '@/servers/system-service';

export const useCustomerContract = ({ session, dictionary }: { session: any; dictionary: any }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [regionOptionsLocal, setRegionOptionsLocal] = useState<any[]>([]);
    const [townshipOptionsLocal, setTownshipOptionsLocal] = useState<any[]>([]);
    const [districtOptionsLocal, setDistrictOptionsLocal] = useState<any[]>([]);
    const [villageOptionsLocal, setVillageOptionsLocal] = useState<any[]>([]);
    const [formDisabled, setFormDisabled] = useState(false);

    const {
        setValue,
        getValues,
        trigger,
        reset,
        setFocus,
    } = useFormContext();

    const convertToDate = (val?: string): string => {
        if (!val) return '';
        const parts = val.split('/');
        return parts.length === 3 ? `${parts[2]}-${parts[1]}-${parts[0]}` : val;
    };

    const handleSearchCif = async (cif: string) => {
        if (!cif) return;
        setIsLoading(true);
        const contracttype = getValues('contractpurpose');
        try {
            const response = await systemServiceApi.runBODynamic({
                sessiontoken: session?.user?.token,
                txFo: {
                    bo: [
                        {
                            use_microservice: true,
                            input: {
                                workflowid: WORKFLOWCODE.BO_CTM_INFO_BY_CUSTOMER,
                                learn_api: 'cbs_workflow_execute',
                                fields: {
                                    is_digital: true,
                                    customercode: cif,
                                    contracttype: contracttype,
                                },
                            },
                        },
                    ],
                },
            });

            const data = response?.payload?.dataresponse?.fo?.[0]?.input;
            if (data) {
                const error = response?.payload?.dataresponse?.fo?.[0]?.input?.error_message;
                if (error) {
                    SwalAlert('error', error || dictionary['contract'].cannotfindcustomer.replace('{0}', cif), 'center');
                    return;
                }
            }

            setValue('fullname', data.fullname ?? '');
            setValue('birthday', convertToDate(data.dob));
            setValue('idcard', data.repid ?? '');
            setValue('issuedate', convertToDate(data.iddt));
            setValue('issueplace', data.idplace ?? '');
            setValue('gender', data.gender);
            setValue('phone', data.phone ?? '');
            setValue('email', data.email ?? '');
            setValue('country', data.nation ?? 'LA');
            await handleChangeCountry(data.nation);
            setValue('branch', data.branchid?.toString().padStart(4, '0'));
            setValue('residentaddress', data.address ?? '');
            setValue('shortname', data.faname ?? '');
            setValue('customertype', data.ctype);
            setValue('city', data.city ?? 'NKL');
            await handleChangeCity(data.city);
            setValue('district', data.district ?? '');
            await handleChangeDistrict(data.district);
            setValue('village', data.village ?? '');
            setValue('fmbook', data.fmbook ?? '');
            setValue('repidtype', data.repidtype ?? '');
            setValue('sector', data.sector ?? '');
            setValue('ctmsize', data.ctmsize ?? '');
            setValue('categories', data.categories ?? '');

            await trigger();

            const [depositAccountRes, loanAccountRes] = await Promise.all([
                systemServiceApi.runBODynamic({
                    sessiontoken: session?.user?.token,
                    txFo: {
                        bo: [
                            {
                                use_microservice: true,
                                input: {
                                    workflowid: WORKFLOWCODE.BO_CTM_GET_DEPOSIT_ACCOUNT,
                                    learn_api: 'cbs_workflow_execute',
                                    fields: { is_digital: true, customercode: cif },
                                },
                            },
                        ],
                    },
                }),
                systemServiceApi.runBODynamic({
                    sessiontoken: session?.user?.token,
                    txFo: {
                        bo: [
                            {
                                use_microservice: true,
                                input: {
                                    workflowid: WORKFLOWCODE.BO_CTM_GET_LOAN_ACCOUNT,
                                    learn_api: 'cbs_workflow_execute',
                                    fields: { is_digital: true, customercode: cif },
                                },
                            },
                        ],
                    },
                }),
            ]);

            const depositAccounts = depositAccountRes?.payload?.dataresponse?.fo?.[0]?.input?.items ?? [];
            const loanAccounts = loanAccountRes?.payload?.dataresponse?.fo?.[0]?.input?.items ?? [];
            const allAccounts = [...depositAccounts, ...loanAccounts];

            if (allAccounts.length > 0) {
                setValue('account', allAccounts);
                await trigger();
            } else {
                SwalAlert('error', dictionary['contract'].customerhavenoaccount.replace('{0}', cif), 'center');
                const cifValue = getValues('cifnumber');
                reset({ cifnumber: cifValue });
                setFormDisabled(true);
                setTimeout(() => setFocus('cifnumber'), 100);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleChangeCountry = async (countryCode: string) => {
        try {
            const resRegion = await handleSearchAPI(session, createTxFo('SimpleSearchRegion'), 1, 9999, '', { countrycode: countryCode });
            const newRegions = resRegion?.items?.map((i: any) => ({ value: i.regioncode, label: i.regionname })) ?? [];

            setRegionOptionsLocal(newRegions);
            setValue('region', '');
            setValue('townshipname', '');
        } catch (error) {
            console.error('Failed to fetch regions:', error);
        }
    };

    const handleChangeRegion = async (regionCode: string) => {
        try {
            const resTownship = await handleSearchAPI(session, createTxFo('SimpleSearchTownership'), 1, 9999, '', { regioncode: regionCode });
            const newTownships = resTownship?.items?.map((i: any) => ({ value: i.townshipcode, label: i.townshipname })) ?? [];

            setTownshipOptionsLocal(newTownships);
            setValue('townshipname', '');
        } catch (error) {
            console.error('Failed to fetch townships:', error);
        }
    };

    const handleChangeCity = async (cityCode: string) => {
        try {
            const resDistrict = await handleSearchAPI(session, createTxFo('SimpleSearchDistrictOption'), 1, 9999, '', { citycode: cityCode });
            const newDistrict = resDistrict?.items?.map((i: any) => ({ value: i.districtcode, label: i.districtname })) ?? [];

            setDistrictOptionsLocal(newDistrict);
            setValue('district', '');
            setValue('village', '');
        } catch (error) {
            console.error('Failed to fetch district:', error);
        }
    };

    const handleChangeDistrict = async (districtCode: string) => {
        try {
            const resVillage = await handleSearchAPI(session, createTxFo('SimpleSearchVillageOption'), 1, 9999, '', { districtcode: districtCode });
            const newVillage = resVillage?.items?.map((i: any) => ({ value: i.villagecode, label: i.villagename })) ?? [];

            setVillageOptionsLocal(newVillage);
            setValue('village', '');
        } catch (error) {
            console.error('Failed to fetch village:', error);
        }
    };

    return {
        isLoading,
        formDisabled,
        regionOptionsLocal,
        townshipOptionsLocal,
        districtOptionsLocal,
        villageOptionsLocal,
        handleSearchCif,
        handleChangeCountry,
        handleChangeRegion,
        handleChangeCity,
        handleChangeDistrict,
    };
};
