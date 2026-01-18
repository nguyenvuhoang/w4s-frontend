import { handleGetCodeList } from '@/@core/components/cButton/handleGetCodeList';
import { auth } from '@/auth';
import { generateAuthMetadata } from '@/components/layout/AuthLayout';
import Spinner from '@/components/spinners';
import { Locale } from '@/configs/i18n';
import { workflowService } from '@/servers/system-service';
import { AccountChartType } from '@/types/bankType';
import { PageData } from '@/types/systemTypes';
import { getDictionary } from '@/utils/getDictionary';
import { isValidResponse } from '@/utils/isValidResponse';
import AccountCommonManagementContent from '@/views/accounting/account-common';
import { Metadata } from 'next';

export const metadata: Metadata = generateAuthMetadata('Contract management');

type PageProps = {
    params: Promise<{ locale: Locale }>;
};

const AccountCommonManagement = async (props: PageProps) => {
    const params = await props.params;
    const { locale } = params;

    const [dictionary, session] = await Promise.all([getDictionary(locale), auth()]);

    // 1) Load dữ liệu bảng chính
    const accountChartApi = await workflowService.runFODynamic({
        sessiontoken: session?.user?.token as string,
        workflowid: 'BO_EXECUTE_SQL_FROM_ACT',
        input: {
            commandname: 'SimpleSearchAccountChart',
            issearch: true,
            pageindex: 1,
            pagesize: 10,
            parameters: {
                searchtext: '',
                currency: '',
                classification: 'ALL',
                balanceside: 'ALL',
                group: 'ALL',
                branchcode: '',
                accountnumber: ''
            },
        },
        language: locale,
    });

    const hasError =
        !isValidResponse(accountChartApi) ||
        ((accountChartApi?.payload?.dataresponse?.errors ?? []).length > 0);

    if (hasError) {
        const err0 = accountChartApi?.payload?.dataresponse?.errors?.[0];
        if (err0) {
            console.log('ExecutionID:', `${err0.execute_id} - ${err0.info}`);
        }
        return <Spinner />;
    }

    const AccountCommondata =
        (accountChartApi.payload.dataresponse.data.input as PageData<AccountChartType>) ?? {
            items: [],
            total: 0,
            pageindex: 1,
            pagesize: 10,
        };

    const [resAccountClassification, resAccountGroup] =
        await Promise.all([
            handleGetCodeList(session, 'ACT', 'ACCLS', locale),
            handleGetCodeList(session, 'ACT', 'ACGRP', locale),

        ]);

    const accountClassificationOptions =
        resAccountClassification?.items?.map((i: any) => ({ value: i.codeid, label: i.caption })) ??
        [];
    const acccountLevelOptions =
        resAccountGroup?.items?.map((i: any) => ({ value: i.codeid, label: i.caption })) ??
        [];


    return (
        <AccountCommonManagementContent
            session={session}
            dictionary={dictionary}
            locale={locale}
            AccountCommondata={AccountCommondata}
            accountClassificationOptions={accountClassificationOptions}
            accountLevelOptions={acccountLevelOptions}
        />
    );
};

export default AccountCommonManagement;
