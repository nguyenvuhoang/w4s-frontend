'use client';

import { useState } from 'react';
import SwalAlert from '@/utils/SwalAlert';
import { WORKFLOWCODE } from '@/data/WorkflowCode';
import { workflowService } from '@/servers/system-service';
import { Contract } from '@/types/bankType';
import { Session } from 'next-auth';

export const useBankAccountHandler = ({
    contract,
    session,
    dictionary
}: {
    contract: Contract;
    session: Session | null;
    dictionary: any;
}) => {
    const [loading, setLoading] = useState(false);

    const handleSync = async () => {
        try {
            setLoading(true);
            const response = await workflowService.runFODynamic({
                sessiontoken: session?.user?.token,
                workflowid: WORKFLOWCODE.BO_SYNC_BANK_ACCOUNT,
                input: {
                    contractnumber: contract.contractnumber,
                    is_digital: true
                }
            });

            if (response.status === 200) {
                const hasError = response.payload.dataresponse.errors.length > 0;
                const errorMessage = response.payload.dataresponse.errors.join(', ');
                if (hasError) {
                    SwalAlert('error', errorMessage, 'center');
                } else {
                    SwalAlert(
                        'success',
                        dictionary['account'].syncsuccess,
                        'center',
                        false,
                        false,
                        true,
                        () => window.location.reload()
                    );
                }
            } else {
                SwalAlert('error', dictionary['account'].syncfailed, 'center');
            }
        } catch (error) {
            console.error('Error syncing:', error);
            SwalAlert('error', dictionary['account'].syncfailed, 'center');
        } finally {
            setLoading(false);
        }
    };

    return { loading, handleSync };
};
