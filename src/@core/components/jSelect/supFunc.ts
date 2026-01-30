/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState } from 'react';
import { systemServiceApi } from '@/servers/system-service';
import { Session } from 'next-auth';
import { Locale } from '@/configs/i18n';
import { replaceAtFields } from '@utils/replaceAtFields';

const getDataNull = (config: any) => {
    if (config.data_mode === 'cdlist') {
        return {
            c_cdlist: {
                cdid: 'select_null',
                caption: 'All',
            },
        };
    } else {
        const key_array = config.key_selected?.split('.') || [];
        const temp_array = config.selected_view_format?.split('.') || [];
        key_array[2] = temp_array[temp_array.length - 1];
        const data_return: { [key: string]: { [key: string]: string } } = {};
        data_return[key_array[0]] = {
            [key_array[1]]: 'select_null',
            [key_array[2]]: 'All',
        };
        return data_return;
    }
};

const setKeySelect = (data_result: any[]) => {
    for (let i = 0; i < data_result.length; i++) {
        data_result[i]['key_jselect'] = i;
    }
    return data_result;
};

export const getDataConfig = async (
    config: any,
    session: Session | null,
    language: Locale,
    parameter?: any
): Promise<any[]> => {
    if (!config) return [];

    let data_query: any[] = [];
    const { json_data } = config;
    switch (config.data_mode) {
        case 'learnapi':
            const txFoArray = JSON.parse(config.txFo);
            const updatedData = replaceAtFields(txFoArray, parameter);
            // Ã©p language vÃ o parameters
            if (updatedData.fields?.parameters && 'language' in updatedData.fields.parameters) {
                updatedData.fields.parameters.language = language;
            }
            const getQueryDataApi = await systemServiceApi.runBODynamic({
                sessiontoken: session?.user?.token as string,
                txFo: updatedData
            });
            data_query = getQueryDataApi.payload.dataresponse.data.result || getQueryDataApi.payload.dataresponse.data.items || [];
            break;

        case 'cdlist':
            const cdgrp = config?.cdlist?.cdgrp || '';
            const cdname = config?.cdlist?.cdname || '';
            if (cdgrp && cdname) {
                const getCdlistApi = await systemServiceApi.getCdList({
                    sessiontoken: session?.user?.token as string,
                    language,
                    codegroup: cdgrp,
                    codename: cdname,
                });
                data_query = getCdlistApi.payload.dataresponse.data.items || [];
            }
            break;
    }

    let data_result: any[] = json_data ? JSON.parse(json_data) : [];
    data_result = data_result.concat(data_query);
    if (config.isHasDataNull === 'true') {
        data_result.unshift(getDataNull(config));
    }

    return setKeySelect(data_result);
};



export const useReportConfig = (
    ddlstore: any,
    session: Session | null,
) => {

    const [data, setData] = useState<any[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            if (!ddlstore) return;

            let data_query: any[] = [];

            const getQueryDataApi = await systemServiceApi.runBODynamic({
                sessiontoken: session?.user?.token as string,
                txFo: {
                    workflowid: 'SYS_EXECUTE_SQL',
                    commandname: ddlstore,
                    issearch: true,
                    pageindex: 1,
                    pagesize: 999999,
                    parameters: {
                        searchtext: ""
                    }
                }
            });

            data_query = getQueryDataApi.payload.dataresponse.data.result || getQueryDataApi.payload.dataresponse.data.items || [];

            let data_result: any[] = [];
            let data_json: any = [];
            data_result = data_json.concat(data_query) || [];
            setData(data_result);
        };

        fetchData();
    }, [ddlstore, session]);

    return data;
};

