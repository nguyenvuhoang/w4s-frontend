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
                console.log(`${actionName} started...`);
            }

            await action();

            console.log(`${actionName} success`);
            options?.onSuccess?.();
        } catch (error) {
            console.error(`${actionName} failed:`, error);
            options?.onError?.(error);
        } finally {
            setLoading(false);
        }
    };

    return { execute, loading };
};
