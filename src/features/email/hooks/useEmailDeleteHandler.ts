'use client';

import SwalAlert from '@/shared/utils/SwalAlert';
import { useSession } from 'next-auth/react';
import { useState } from 'react';
import { deleteEmails } from '../services/emailService';

export const useEmailDeleteHandler = (onSuccess?: () => void) => {
    const { data: session } = useSession();
    const [deleting, setDeleting] = useState(false);

    const handleDelete = async (ids: (string | number)[]) => {
        if (!session?.user?.token || ids.length === 0) return;

        setDeleting(true);
        try {
            const result = await deleteEmails(session.user.token, ids);
            if (result.success) {
                SwalAlert('Emails deleted successfully', 'success', 'center', false, false, true);
                if (onSuccess) {
                    onSuccess();
                }
            }
        } catch (error) {
            console.error('Failed to delete emails:', error);
        } finally {
            setDeleting(false);
        }
    };

    return {
        handleDelete,
        deleting
    };
};
