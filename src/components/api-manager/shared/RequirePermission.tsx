'use client';

import React, { useEffect, useState } from 'react';
import { getCurrentUser, hasPermission } from '@/lib/api-manager/rbac';
import { Permission, User } from '@/types/api-manager';

interface RequirePermissionProps {
    permission: Permission;
    children: React.ReactNode;
    fallback?: React.ReactNode;
}

export default function RequirePermission({ permission, children, fallback = null }: RequirePermissionProps) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getCurrentUser().then(u => {
            setUser(u);
            setLoading(false);
        });
    }, []);

    if (loading) return null; // Or a skeleton
    if (!user || !hasPermission(user, permission)) {
        return <>{fallback}</>;
    }

    return <>{children}</>;
}
