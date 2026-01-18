import { auth } from '@/auth';
import { generateAuthMetadata } from '@/components/layout/AuthLayout';
import { Locale } from '@/configs/i18n';
import { systemServiceApi } from '@/servers/system-service';
import { ContractType } from '@/types/bankType';
import { PageData } from '@/types/systemTypes';
import { getDictionary } from '@/utils/getDictionary';
import { isValidResponse } from '@/utils/isValidResponse';
import ContractManagementApproveSearchContent from '@/views/contracts/contract-management-search';
import ContractApproveSearchSkeleton from '@/views/contracts/contract-management-search/ContractApproveSearchSkeleton';
import ContractApproveSearchError from '@/views/contracts/contract-management-search/ContractApproveSearchError';
import { Metadata } from 'next';
import { Session } from 'next-auth';
import { Suspense } from 'react';
import ContentWrapper from '@/views/components/layout/content-wrapper';
import BackupTableIcon from '@mui/icons-material/BackupTable'

export const metadata: Metadata = generateAuthMetadata('Verify for contract');

const ContractManagementApproveData = async (
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
            commandname: "ApproveContract",
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
    });

    if (
        !isValidResponse(contractdataApi) ||
        (contractdataApi.payload.dataresponse.error && contractdataApi.payload.dataresponse.error.length > 0)
    ) {
        const error = contractdataApi.payload.dataresponse.error?.[0];
        const executionId = error?.execute_id;
        const errorInfo = error?.info;

        console.log(
            'ExecutionID:',
            executionId + ' - ' + errorInfo
        );

        return (
            <ContractApproveSearchError
                executionId={executionId}
                errorInfo={errorInfo}
                dictionary={dictionary}
            />
        );
    }

    const contractdata = contractdataApi.payload.dataresponse.fo[0].input as PageData<ContractType>;

    return (
        <ContractManagementApproveSearchContent
            session={session}
            dictionary={dictionary}
            locale={locale}
            contractdata={contractdata}
        />
    );
};

const ContractManagementApproveSearch = async (props: { params: Promise<{ locale: Locale }> }) => {
    const { locale } = await props.params;

    const [dictionary, session] = await Promise.all([
        getDictionary(locale),
        auth(),
    ]);

    return (
        <ContentWrapper
            title={dictionary['contract'].approvecontract}
            description={dictionary['contract'].description}
            icon={<BackupTableIcon sx={{ fontSize: 40, color: '#0C9150' }} />}
            dictionary={dictionary}
        >
            <Suspense fallback={<ContractApproveSearchSkeleton dictionary={dictionary} />}>
                <ContractManagementApproveData session={session} locale={locale} dictionary={dictionary} />
            </Suspense>
        </ContentWrapper>
    );
};

export default ContractManagementApproveSearch;