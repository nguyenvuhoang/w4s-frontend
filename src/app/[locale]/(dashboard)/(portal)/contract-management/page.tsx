import { auth } from '@/auth';
import { generateAuthMetadata } from '@/components/layout/AuthLayout';
import { Locale } from '@/configs/i18n';
import { systemServiceApi } from '@/servers/system-service';
import { ContractType } from '@/types/bankType';
import { PageData } from '@/types/systemTypes';
import { getDictionary } from '@/utils/getDictionary';
import { isValidResponse } from '@/utils/isValidResponse';
import ContentWrapper from '@/views/components/layout/content-wrapper';
import ContractManagementContent from '@/views/contracts/contract-management';
import ContractManagementSkeleton from '@/views/contracts/contract-management/ContractManagementSkeleton';
import ContractManagementError from '@/views/contracts/contract-management/ContractManagementError';
import BackupTableIcon from '@mui/icons-material/BackupTable';
import { Metadata } from 'next';
import { Session } from 'next-auth';
import { Suspense } from 'react';

export const metadata: Metadata = generateAuthMetadata('Contract management');


const ContractManagementData = async (
    {
        session,
        locale,
        dictionary
    }: {
        session: Session | null,
        locale: Locale,
        dictionary: Awaited<ReturnType<typeof getDictionary>>
    }
) => {
    const contractdataApi = await systemServiceApi.runFODynamic({
        sessiontoken: session?.user?.token as string,
        workflowid: "SYS_EXECUTE_SQL",
        input: {
            commandname: "SimpleSearchContract",
            issearch: true,
            pageindex: 1,
            pagesize: 10,
            parameters: {
                searchtext: "",
                contractnumber: "",
                phonenumber: "",
                cifnumber: "",
                fullname: "",
                idcard: "",
                status: "",
                contracttype: "ALL",
                contractlevel: "ALL"
            }
        },
        language: locale
    });

    if (
        !isValidResponse(contractdataApi) ||
        (contractdataApi.payload.dataresponse.errors && contractdataApi.payload.dataresponse.errors.length > 0)
    ) {
        const error = contractdataApi.payload.dataresponse.errors?.[0];
        const executionId = error?.execute_id;
        const errorInfo = error?.info;

        console.log(
            'ExecutionID:',
            executionId + ' - ' + errorInfo
        );

        return (
            <ContractManagementError
                executionId={executionId}
                errorInfo={errorInfo}
                dictionary={dictionary}
            />
        );
    }

    const contractdata = contractdataApi.payload.dataresponse.data as unknown as PageData<ContractType>;
    return (
        <ContractManagementContent session={session} dictionary={dictionary} locale={locale} contractdata={contractdata} />
    )
}

const ContractManagement = async (props: { params: Promise<{ locale: Locale }> }) => {
    const { locale } = await props.params;

    const [dictionary, session] = await Promise.all([
        getDictionary(locale),
        auth(),
    ]);



    return (
        <ContentWrapper
            title={dictionary['contract'].title}
            description={dictionary['contract'].description}
            icon={<BackupTableIcon sx={{ fontSize: 40, color: '#0C9150' }} />}
            dictionary={dictionary}
            issearch={true}
        >
            <Suspense fallback={<ContractManagementSkeleton dictionary={dictionary} />}>
                <ContractManagementData session={session} locale={locale} dictionary={dictionary} />
            </Suspense>
        </ContentWrapper>
    );
};

export default ContractManagement;