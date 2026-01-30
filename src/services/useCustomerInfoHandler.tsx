'use client';

import { WORKFLOWCODE } from '@/data/WorkflowCode';
import { workflowService } from '@/servers/system-service';
import SwalAlert from '@utils/SwalAlert';
import { Session } from 'next-auth';
import { useState } from 'react';

export const useCustomerInfoHandler = ({
    customerCode,
    customertype,
    session,
    dictionary
}: {
    customerCode: string | undefined;
    customertype: string | undefined;
    session: Session | null;
    dictionary: any;
}) => {
    const [loading, setLoading] = useState(false);

    const handleSync = async () => {
        try {
            setLoading(true);
            const response = await workflowService.runFODynamic({
                sessiontoken: session?.user?.token,
                workflowid: WORKFLOWCODE.BO_SYNC_CUSTOMER_INFO,
                input: {
                    customer_code: customerCode?.trim() || '',
                    customer_type: customertype?.trim() || '',
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

