import { useState } from 'react';
import { setStarEmail } from '../services/emailService';
import { useSession } from 'next-auth/react';

export const useEmailStarHandler = () => {
    const { data: session } = useSession();
    const [loadingId, setLoadingId] = useState<string | number | null>(null);

    const handleToggleStar = async (id: string | number) => {
        if (!session?.user?.token) return false;

        setLoadingId(id);
        const result = await setStarEmail(session.user.token, id);
        setLoadingId(null);

        return result.success;
    };

    return {
        handleToggleStar,
        starLoadingId: loadingId
    };
};
