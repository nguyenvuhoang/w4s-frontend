import { useState, useCallback } from 'react';
import { fetchEmailDetail } from '../services/emailService';

export const useEmailDetailHandler = (token: string) => {
    const [emailDetail, setEmailDetail] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleViewDetail = useCallback(async (id: string | number) => {
        setLoading(true);
        setError(null);
        try {
            const result = await fetchEmailDetail(token, id);
            if (result.success) {
                setEmailDetail(result.data);
            } else {
                setError(result.error || 'Failed to fetch email details');
            }
        } catch (err) {
            setError('An unexpected error occurred');
        } finally {
            setLoading(false);
        }
    }, [token]);

    const handleBackToList = useCallback(() => {
        setEmailDetail(null);
        setError(null);
    }, []);

    return {
        emailDetail,
        loading,
        error,
        handleViewDetail,
        handleBackToList
    };
};
