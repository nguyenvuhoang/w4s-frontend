// useBankAccountHandler.ts
'use client';

import { useState } from 'react';
import SwalAlert from '@utils/SwalAlert';
import { WORKFLOWCODE } from '@/data/WorkflowCode';
import { workflowService } from '@/servers/system-service';
import { Contract, Contractaccount } from '@shared/types/bankType';
import { Session } from 'next-auth';

export const useUpdateBankAccountHandler = ({
    contract,
    session,
    dictionary,
    onAfterSync
}: {
    contract: Contract;
    session: Session | null;
    dictionary: any;
    onAfterSync?: (accounts: Contractaccount[]) => void;
}) => {
    const [loading, setLoading] = useState(false);

    const handleSync = async () => {
        try {
            setLoading(true);
            const response = await workflowService.runFODynamic({
                sessiontoken: session?.user?.token,
                workflowid: WORKFLOWCODE.BO_SYNC_BANK_ACCOUNT,
                input: { contractnumber: contract.contractnumber, is_digital: true }
            });

            if (response.status !== 200) {
                SwalAlert('error', dictionary['account'].syncfailed, 'center');
                return;
            }

            const errs = response.payload?.dataresponse?.errors ?? [];
            if (errs.length) {
                SwalAlert('error', errs.map((e: any) => e.info ?? e).join(', '), 'center');
                return;
            }

            // ðŸ‘‰ cá»‘ gáº¯ng láº¥y list account tá»« fo
            const fo = response.payload?.dataresponse.data.input ?? [];
            let accounts: Contractaccount[] = [];
            for (const item of fo) {
                const input = item?.input ?? {};
                if (Array.isArray(input.accounts)) { accounts = input.accounts; break; }
                if (Array.isArray(input.data)) { accounts = input.data; break; }
            }

            onAfterSync?.(accounts);
            SwalAlert('success', dictionary['account'].syncsuccess, 'center', false, false, false);
        } catch (error) {
            console.error('Error syncing:', error);
            SwalAlert('error', dictionary['account'].syncfailed, 'center');
        } finally {
            setLoading(false);
        }
    };

    return { loading, handleSync };
};

