'use client'

import { useEffect } from 'react';


import { useRouter } from 'next/navigation';

import { signOut } from 'next-auth/react';

const RedirectToLogout = ({ shouldRedirect }: { shouldRedirect: boolean }) => {

    const router = useRouter();

    useEffect(() => {
        const handleLogout = async () => {
            try {
                await signOut({ redirect: false })
                router.push('/login');
            } catch (error) {
                console.error('Logout failed:', error);
            }
        };

        if (shouldRedirect) {
            handleLogout();
        }
    }, [router, shouldRedirect]);

    return null;
};

export default RedirectToLogout;
