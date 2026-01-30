'use client';

import { WORKFLOWCODE } from '@/data/WorkflowCode';
import { workflowService } from '@/servers/system-service';
import { PostingType } from '@shared/types/bankType';
import SwalAlert from '@utils/SwalAlert';
import { Session } from 'next-auth';
import { useCallback, useEffect, useRef, useState } from 'react';

export const usePostingHandler = ({
    txrefid,
    session,
    dictionary
}: {
    txrefid: string;
    session: Session | null;
    dictionary: any;
}) => {
    const [loading, setLoading] = useState(false);
    const [postingData, setPostingData] = useState<PostingType[]>([]);

    const hasFetchedRef = useRef(false);

    const handleSync = useCallback(async () => {
        if (!txrefid) return;

        try {
            setLoading(true);

            const response = await workflowService.runFODynamic({
                sessiontoken: session?.user?.token,
                workflowid: WORKFLOWCODE.BO_GET_GL_POSTING,
                input: {
                    core_banking_transacion_id: txrefid,
                    is_digital: true
                }
            });

            if (response.status === 200) {
                const hasError = response.payload.dataresponse.errors.length > 0;
                const errorMessage = response.payload.dataresponse.errors.join(', ');

                if (hasError) {
                    SwalAlert('error', errorMessage, 'center');
                } else {
                    setPostingData(
                        response.payload.dataresponse.data.items as PostingType[]
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
    }, [txrefid, session?.user?.token, dictionary]);

    useEffect(() => {
        if (hasFetchedRef.current) return;
        if (!txrefid) return;

        hasFetchedRef.current = true;
        handleSync();
    }, [handleSync, txrefid]);

    return {
        loading,
        postingData
    };
};

