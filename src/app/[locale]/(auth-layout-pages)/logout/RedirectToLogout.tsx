'use client'

import { useEffect } from 'react';


import { useRouter } from '@shared/hooks/useRouter';

import { signOut } from 'next-auth/react';
import { getLocalizedUrl } from '@utils/i18n';
import type { Locale } from '@/configs/i18n';

const RedirectToLogout = ({ shouldRedirect, locale }: { shouldRedirect: boolean; locale: Locale }) => {

    const router = useRouter();

    useEffect(() => {
        const handleLogout = async () => {
            try {
                // Invalidate the session on the backend BEFORE clearing the Next.js session
                // below. The real backend token never reaches the browser (see src/auth.ts)
                // — /api/logout resolves it itself, server-side, from the session cookie.
                await fetch('/api/logout', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ reason: 'manual' })
                })
            } catch {} finally {
                try {
                    await signOut({ redirect: false })
                    router.push(getLocalizedUrl('/login', locale));
                } catch {}
            }
        };

        if (shouldRedirect) {
            handleLogout();
        }
    }, [locale, router, shouldRedirect]);

    return null;
};

export default RedirectToLogout;
