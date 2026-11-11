import { useState } from 'react';

type ActionHandlerOptions = {
    onSuccess?: () => void;
    onError?: (error: unknown) => void;
    showLoadingLog?: boolean;
};

export const useActionHandler = () => {
    const [loading, setLoading] = useState(false);

    const execute = async (
        actionName: string,
        action: () => Promise<void>,
        options?: ActionHandlerOptions
    ) => {
        setLoading(true);
        try {
            if (options?.showLoadingLog) {
            }

            await action();

            options?.onSuccess?.();
        } catch (error) {
            options?.onError?.(error);
        } finally {
            setLoading(false);
        }
    };

    return { execute, loading };
};
