import { auth } from '@/auth';
import { generateAuthMetadata } from '@/components/layout/AuthLayout';
import ContentWrapper from '@/views/components/layout/content-wrapper';
import BackupTableIcon from '@mui/icons-material/BackupTable';
import { Locale } from '@/configs/i18n';
import { systemServiceApi } from '@/servers/system-service';
import { Transaction } from '@/types/bankType';
import { PageData } from '@/types/systemTypes';
import { getDictionary } from '@/utils/getDictionary';
import { isValidResponse } from '@/utils/isValidResponse';
import TransactionHistoryContent from '@/views/transaction/transaction-history';
import TransactionHistorySkeleton from '@/views/transaction/transaction-history/TransactionHistorySkeleton';
import TransactionHistoryError from '@/views/transaction/transaction-history/TransactionHistoryError';
import { Metadata } from 'next';
import { Session } from 'next-auth';
import { Suspense } from 'react';

export const metadata: Metadata = generateAuthMetadata('Transaction history');

const TransactionHistoryData = async (
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
            commandname: "SimpleSearchTransactionHistory",
            issearch: true,
            pageindex: 1,
            pagesize: 10,
            parameters: {
                searchtext: "",
                refnumber: '',
                transactionref: '',
                debitaccount: '',
                creditaccount: '',
                contractno: '',
                customername: '',
                cifnumber: '',
                license: '',
                fromdate: '',
                todate: '',
                status: 'ALL',
                transactiontype: 'ALL',
                schedule: false
            }
        },
        language: locale
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
            <TransactionHistoryError 
                executionId={executionId}
                errorInfo={errorInfo}
                dictionary={dictionary}
            />
        );
    }

    const transactionhistorydata = contractdataApi.payload.dataresponse.fo[0].input as PageData<Transaction>;
    
    return (
        <TransactionHistoryContent 
            session={session} 
            dictionary={dictionary} 
            locale={locale} 
            transactionhistorydata={transactionhistorydata} 
        />
    );
};

const TransactionHistory = async (props: { params: Promise<{ locale: Locale }> }) => {
    const { locale } = await props.params;

    const [dictionary, session] = await Promise.all([
        getDictionary(locale),
        auth(),
    ]);

    return (
        <ContentWrapper
            title={dictionary['transaction']?.transactionhistorytitle ?? 'Transaction history'}
            description={dictionary['transaction']?.transactionhistorydesc}
            icon={<BackupTableIcon sx={{ fontSize: 40, color: '#0C9150' }} />}
            dictionary={dictionary}
            issearch={true}
        >
            <Suspense fallback={<TransactionHistorySkeleton dictionary={dictionary} />}>
                <TransactionHistoryData session={session} locale={locale} dictionary={dictionary} />
            </Suspense>
        </ContentWrapper>
    );
};

export default TransactionHistory;