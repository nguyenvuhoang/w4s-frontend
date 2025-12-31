
'use client'

import ActionButtonGroup from '@/components/ActionButtonGroup';
import TabPanel from '@/components/tab/tab-panel';
import { WORKFLOWCODE } from '@/data/WorkflowCode';
import { systemServiceApi } from '@/servers/system-service';
import { PageContentProps } from '@/types';
import { getDictionary } from '@/utils/getDictionary';
import { isValidResponse } from '@/utils/isValidResponse';
import { parseMaybeJson } from '@/utils/parseMaybeJson';
import SwalAlert from '@/utils/SwalAlert';
import ContentWrapper from '@/views/components/layout/content-wrapper';
import AutoAwesomeMosaicIcon from '@mui/icons-material/AutoAwesomeMosaic';
import {
    Box,
    Tab,
    Tabs
} from '@mui/material';
import { Session } from 'next-auth';
import { useState } from 'react';
import BankAccountInfo from './bank-account';
import ContractInfo from './contract-Info';
import CustomerInfo from './customer-info';
import RejectReasonModal from './RejectReasonModal';
import UserAccountInfo from './user-account';
import { normalizePhone } from '@/utils/normalizePhone';
import KYCInfo from './kyc-info';
import GLAccountInfo from '../contract-management-view-content/gl-account';
import { Locale } from '@/configs/i18n';
import { Customer } from '@/types/bankType';

interface ContractDictionary {
    title: string;
    description: string;
    contractInfo: string;
    customerInfo: string;
    kycinformation: string;
    bankAccountInfo: string;
    userAccountInfo: string;
    glAccountInfo: string;
}

type TabKey = 'contractInfo' | 'customerInfo' | 'kycinformation' | 'bankAccountInfo' | 'userAccountInfo' | 'glAccountInfo';
interface TabConfig {
    key: TabKey;
    component: React.ComponentType<{ contractdata: any, dictionary: Awaited<ReturnType<typeof getDictionary>>; session: Session | null; locale?: Locale }>;
    showCondition?: (contractdata: any) => boolean;
}


const tabConfig: TabConfig[] = [
    { key: 'contractInfo', component: ContractInfo },
    { key: 'customerInfo', component: CustomerInfo },
    {
        key: 'kycinformation',
        component: KYCInfo,
        showCondition: (contractdata) => contractdata?.contractlevelid === 1 || contractdata?.contractlevelid === '1'
    },
    { key: 'bankAccountInfo', component: BankAccountInfo },
    { key: 'userAccountInfo', component: UserAccountInfo },
    { key: 'glAccountInfo', component: GLAccountInfo }

];


type RequestItem = {
    refid: string;
    actioncode?: string;
    status?: string;
    reason?: string;
    createdby?: string;
    createdonutc?: string;
};

const APPROVEABLE_STATUSES = ['P', 'PendingReview', 'W', 'G'];
const REJECTABLE_STATUSES = ['P', 'PendingReview', 'W', 'G'];
const ContractManagementApproveContent = ({ dictionary, session, locale, contractdata }: PageContentProps) => {
    const [tabValue, setTabValue] = useState(0);
    const [loading, setLoading] = useState(false);
    const [rejectOpen, setRejectOpen] = useState(false);

    const visibleTabs = tabConfig.filter(tab =>
        !tab.showCondition || tab.showCondition(contractdata)
    );
    const getPendingRequest = (cd: any): RequestItem | undefined => {
        const rp = parseMaybeJson<RequestItem>(cd?.requestpending);
        if (rp?.status === 'P') return rp;
        const list = cd?.requests as RequestItem[] | undefined;
        return list?.find(x => x?.status === 'P');
    };

    const getPendingRefId = (cd: any) => getPendingRequest(cd)?.refid;
    const pendingRefId = getPendingRefId(contractdata);
    const dataRef = `${contractdata?.contractnumber}${pendingRefId ? ` ; ${pendingRefId}` : ''}${contractdata?.contracttype ? ` ; ${contractdata?.contracttype}` : ''}`;

    const getActionCode = (cd: any) => {
        const ac = getPendingRequest(cd)?.actioncode;
        if (ac) return ac;
        if (cd?.status === 'G') return 'DELETE';
        return undefined;
    };
    const handleCreateNew = async (status: 'A' | 'R', reason?: string) => {
        setLoading(true);
        try {

            let source: Customer;
            if (typeof contractdata?.customer_any === 'string') {
                source = JSON.parse(contractdata.customer_any);
            } else {
                source = contractdata?.customer_any || {} as Customer;
            }

            const approvedContractData = {
                username: normalizePhone(source.tel),
                firstname: source.firstname || '',
                middlename: source.middlename || '',
                lastname: source.lastname || source.fullname || '',
                gender: source.sex === 'M' ? 1 : 0,
                address: `${source.township || ''}, ${source.region || ''}, ${source.nation || ''}`.replace(/^,\s*|,\s*$/g, ''),
                email: source.email || '',
                phone: normalizePhone(source.tel),
                status, // 'A' or 'R'
                userlevel: contractdata.userlevel,
                policyid: contractdata.policyid,
                contract_number: contractdata.contractnumber,
                birthday: source.dob || '',
                currentstatus: contractdata.status,
                contracttype: contractdata.contracttype ?? 'IND',
                reason: reason || '',
                usertype: contractdata.usertype
            };

            const updateAPI = await systemServiceApi.updateSystemData({
                sessiontoken: session?.user?.token as string,
                workflowid: WORKFLOWCODE.BO_CONTRACT_TRANSITION_STATUS,
                data: approvedContractData
            });


            if (
                !isValidResponse(updateAPI) ||
                (updateAPI.payload.dataresponse.error && updateAPI.payload.dataresponse.error.length > 0)
            ) {
                const { execute_id, info } = updateAPI.payload.dataresponse.error[0];
                SwalAlert('error', `[${execute_id}] - ${info}`, 'center');
                return;
            }

            const messageKey = status === 'A' ? 'contractapprovesuccess' : 'contractrejectsuccess';
            SwalAlert('success', `${dictionary['contract'][messageKey]}`, 'center', false, false, true);

        } catch (error) {
            console.error(`Error during contract ${status === 'A' ? 'approval' : 'rejection'}:`, error);
        } finally {
            setLoading(false);
        }
    };

    const handlePendingDecision = async (decision: 'A' | 'R', reason?: string) => {
        if (!session?.user?.token) return;

        const refid = getPendingRefId(contractdata);
        const actioncode = getActionCode(contractdata);

        if (!refid) {
            SwalAlert('error', dictionary?.common?.norefid, 'center');
            return;
        }

        setLoading(true);
        try {
            const payload = {
                refid,
                actioncode,
                status: decision,
                reason: reason ?? '',
                contractnumber: contractdata?.contractnumber,
                currentstatus: contractdata?.status,
            };

            const res = await systemServiceApi.updateSystemData({
                sessiontoken: session.user.token as string,
                workflowid: WORKFLOWCODE.BO_CONTRACT_VERIFICATION_STATUS,
                data: payload,
            });

            if (!isValidResponse(res) || (res.payload?.dataresponse?.error?.length > 0)) {
                const { execute_id, info } = res.payload.dataresponse.error[0];
                SwalAlert('error', `[${execute_id}] - ${info}`, 'center');
                return;
            }

            const msgKey = decision === 'A' ? 'contractapprovesuccess' : 'contractrejectsuccess';
            SwalAlert('success', `${dictionary?.contract?.[msgKey]}`, 'center', false, false, true);
            // optional: refresh/re-fetch
            // router.refresh?.(); // hoặc window.location.reload();
        } catch (e) {
            console.error('handlePendingDecision error:', e);
            SwalAlert('error', dictionary?.common?.unknownerror ?? 'Unexpected error', 'center');
        } finally {
            setLoading(false);
        }
    };

    const isPendingFlow = !!getPendingRequest(contractdata);
    const actioncode = getActionCode(contractdata);
    const handleApprove = async () => {
        if (isPendingFlow && actioncode != 'CREATE') {
            await handlePendingDecision('A');
        } else {
            await handleCreateNew('A');
        }
    }
    const handleReject = () => setRejectOpen(true);

    // Khi confirm lý do từ modal: rẽ 2 case tương tự
    const handleRejectConfirm = async (reason: string) => {
        if (isPendingFlow) {
            await handlePendingDecision('R', reason);
        } else {
            await handleCreateNew('R', reason);
        }
        setRejectOpen(false);
    };


    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setTabValue(newValue);
    };

    const renderTabs = () => (
        <Tabs
            value={tabValue}
            onChange={handleTabChange}
            className="rounded-t-lg"
            sx={{
                backgroundColor: '#225087',
                color: 'white',
                '& .MuiTab-root': {
                    color: 'white',
                    fontWeight: 500,
                    textTransform: 'none',
                },
                '& .Mui-selected': {
                    backgroundColor: '#1780AC',
                    color: 'white !important',
                },
                '& .MuiTabs-indicator': {
                    display: 'none',
                },
            }}
        >
            {visibleTabs.map((tab, index) => (
                <Tab
                    key={index}
                    label={(dictionary['contract'] as unknown as ContractDictionary)[tab.key] || tab.key}
                    disableRipple
                />
            ))}
        </Tabs>
    );

    const renderTabPanels = () => (
        visibleTabs.map((tab, index) => {
            const Component = tab.component;
            return (
                <TabPanel key={index} value={tabValue} index={index}>
                    <Component contractdata={contractdata} dictionary={dictionary} session={session} />
                </TabPanel>
            );
        })
    );

    return (
        <ContentWrapper
            title={`${dictionary['contract'].title} - ${dictionary['common'].approve} & ${dictionary['common'].reject}`}
            description={dictionary['contract'].description}
            icon={<AutoAwesomeMosaicIcon sx={{ fontSize: 40, color: '#225087' }} />}
            dataref={dataRef}
            dictionary={dictionary}
        >
            <Box sx={{ mt: 2, width: '100%' }} className="mx-auto">
                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                    {renderTabs()}
                </Box>
                {renderTabPanels()}
            </Box>
            {(APPROVEABLE_STATUSES.includes(contractdata?.status ?? '') ||
                REJECTABLE_STATUSES.includes(contractdata?.status ?? '')) && (
                    <ActionButtonGroup
                        onApprove={handleApprove}
                        onReject={handleReject}
                        loading={loading}
                        approveLabel={dictionary['common'].approve}
                        rejectLabel={dictionary['common'].reject}
                    />
                )}

            <RejectReasonModal
                open={rejectOpen}
                onClose={() => setRejectOpen(false)}
                onConfirm={handleRejectConfirm}
                loading={loading}
                dictionary={dictionary}
            />

        </ContentWrapper>
    );
};

export default ContractManagementApproveContent;