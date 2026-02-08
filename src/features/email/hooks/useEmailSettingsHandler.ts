'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { fetchEmailSettings } from '../services/emailService';

export interface EmailConfig {
    id: number;
    config_id: string;
    host: string;
    port: number;
    sender: string;
    password: string;
    enable_tls: boolean;
    email_test: string;
}

export const useEmailSettingsHandler = () => {
    const { data: session } = useSession();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [config, setConfig] = useState<EmailConfig | null>(null);
    const [showPassword, setShowPassword] = useState(false);

    const loadConfig = async () => {
        if (!session?.user?.token) return;

        try {
            setLoading(true);
            const result = await fetchEmailSettings(session.user.token);
            if (result.success) {
                setConfig(result.data);
            } else {
                // Fallback / default data if none found in API
                setConfig({
                    id: 1,
                    config_id: "main_mail",
                    host: "smtp.gmail.com",
                    port: 587,
                    sender: "nguyenvuhoangxx@gmail.com",
                    password: "qgcc vrbt nnpt grmj",
                    enable_tls: true,
                    email_test: "nguyenvuhoangz@gmail.com"
                });
            }
        } catch (err) {
            setError('Could not load email configuration.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadConfig();
    }, [session?.user?.token]);

    const togglePasswordVisibility = () => setShowPassword(!showPassword);

    const handleSave = async () => {
        // To be implemented
        console.log('Saving config:', config);
    };

    return {
        config,
        loading,
        error,
        showPassword,
        togglePasswordVisibility,
        handleSave,
        setConfig
    };
};
