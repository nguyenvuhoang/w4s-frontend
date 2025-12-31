// useBankAccountHandler.ts
'use client';

import { useState } from 'react';
import SwalAlert from '@/utils/SwalAlert';
import { WORKFLOWCODE } from '@/data/WorkflowCode';
import { systemServiceApi } from '@/servers/system-service';
import { Contract, Contractaccount } from '@/types/bankType';
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
            const response = await systemServiceApi.runFODynamic({
                sessiontoken: session?.user?.token,
                workflowid: WORKFLOWCODE.BO_SYNC_BANK_ACCOUNT,
                input: { contractnumber: contract.contractnumber, is_digital: true }
            });

            if (response.status !== 200) {
                SwalAlert('error', dictionary['account'].syncfailed, 'center');
                return;
            }

            const errs = response.payload?.dataresponse?.error ?? [];
            if (errs.length) {
                SwalAlert('error', errs.map((e: any) => e.info ?? e).join(', '), 'center');
                return;
            }

            // 👉 cố gắng lấy list account từ fo
            const fo = response.payload?.dataresponse?.fo ?? [];
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
