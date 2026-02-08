import { useState } from 'react';
import { setImportantEmail } from '../services/emailService';
import { useSession } from 'next-auth/react';

export const useEmailImportantHandler = () => {
    const { data: session } = useSession();
    const [loadingId, setLoadingId] = useState<string | number | null>(null);

    const handleToggleImportant = async (id: string | number) => {
        if (!session?.user?.token) return false;

        setLoadingId(id);
        const result = await setImportantEmail(session.user.token, id);
        setLoadingId(null);

        return result.success;
    };

    return {
        handleToggleImportant,
        importantLoadingId: loadingId
    };
};
