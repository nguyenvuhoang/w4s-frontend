'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { sendEmail } from '../services/emailService';
import { Locale } from '@/configs/i18n';
import { useParams } from 'next/navigation';

export const useComposeEmailHandler = (onClose: () => void) => {
    const { data: session } = useSession();
    const params = useParams();
    const locale = (params?.locale as Locale) || 'en';

    const [recipient, setRecipient] = useState('');
    const [subject, setSubject] = useState('');
    const [content, setContent] = useState('');
    const [sending, setSending] = useState(false);

    const handleSend = async () => {
        if (!session?.user?.token) return;

        setSending(true);
        try {
            const result = await sendEmail(
                session.user.token,
                { recipient, subject, content },
                locale
            );
            if (result.success) {
                // Clear form and close
                setRecipient('');
                setSubject('');
                setContent('');
                onClose();
            }
        } catch (error) {
            console.error('Failed to send email:', error);
        } finally {
            setSending(false);
        }
    };

    return {
        recipient,
        setRecipient,
        subject,
        setSubject,
        content,
        setContent,
        sending,
        handleSend,
    };
};
