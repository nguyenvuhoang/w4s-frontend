import { User, Permission, UserRole } from '@/types/api-manager';

// Mock current user
export const getCurrentUser = async (): Promise<User> => {
    return {
        id: 'user-admin',
        name: 'Admin User',
        email: 'admin@system.local',
        role: 'Admin',
        avatar: 'https://i.pravatar.cc/150?u=admin'
    };
};

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
    Admin: [
        'api.read', 'api.write', 'api.deploy',
        'product.read', 'product.write',
        'subscription.read', 'subscription.manage',
        'consumer.read', 'consumer.write',
        'credential.manage',
        'policy.write',
        'logs.read', 'analytics.read',
        'env.write', 'settings.write'
    ],
    Operator: [
        'api.read', 'api.deploy',
        'product.read',
        'subscription.read', 'subscription.manage',
        'consumer.read',
        'logs.read', 'analytics.read'
    ],
    Viewer: [
        'api.read',
        'product.read',
        'subscription.read',
        'consumer.read',
        'logs.read', 'analytics.read'
    ]
};

export const hasPermission = (user: User, requiredPermission: Permission): boolean => {
    if (user.role === 'Admin') return true;
    const perms = ROLE_PERMISSIONS[user.role] || [];
    return perms.includes(requiredPermission);
};

export const hasRole = (user: User, ...roles: UserRole[]): boolean => {
    return roles.includes(user.role);
};
