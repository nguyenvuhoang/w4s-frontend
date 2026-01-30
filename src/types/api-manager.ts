export type UserRole = 'Admin' | 'Operator' | 'Viewer';

export type Method = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';

export interface Api {
    id: string;
    name: string;
    description: string;
    version: string; // Current active version
    status: 'published' | 'unpublished' | 'deprecated';
    type: 'rest' | 'graphql' | 'websocket';
    createdAt: string;
    updatedAt: string;
    ownerId: string;
    labels: string[];
}

export interface ApiVersion {
    id: string;
    apiId: string;
    name: string; // v1.0.0
    status: 'current' | 'deprecated' | 'archived';
    changelog?: string;
    createdAt: string;
}

export interface Endpoint {
    id: string;
    apiId: string;
    versionId: string;
    path: string;
    method: Method;
    description?: string;
    timeout: number;
}

export interface ProductPlan {
    id: string;
    name: string;
    description: string;
    apis: string[]; // List of API IDs
    quota: {
        limit: number;
        period: 'second' | 'minute' | 'hour' | 'day' | 'month';
    };
    approvalRequired: boolean;
    status: 'published' | 'draft' | 'archived';
}

export interface Consumer {
    id: string;
    username: string;
    customId?: string;
    tags: string[];
    createdAt: string;
    type: 'internal' | 'external';
    orgName?: string;
    contactEmail?: string;
}

export interface Subscription {
    id: string;
    consumerId: string;
    productId: string;
    status: 'active' | 'pending' | 'rejected' | 'revoked';
    createdAt: string;
    expiresAt?: string;
}

export interface ApiKey {
    id: string;
    key: string; // Masked in list, plain when created
    consumerId: string;
    name?: string;
    status: 'active' | 'revoked';
    createdAt: string;
    lastUsedAt?: string;
}

export interface OAuthClient {
    id: string;
    consumerId: string;
    name: string;
    clientId: string;
    clientSecret: string; // Should be handled carefully
    redirectUris: string[];
    grants: string[];
    status: 'active' | 'revoked';
}

export interface Policy {
    id: string;
    name: string;
    type: 'rate-limit' | 'cors' | 'jwt-verify' | 'ip-restriction' | 'request-transformer' | 'response-transformer';
    configuration: Record<string, any>;
    description?: string;
    icon?: string; // Icon name
}

// Policy Attachment
export interface PolicyAttachment {
    id: string;
    policyId: string;
    targetType: 'api' | 'version' | 'endpoint';
    targetId: string;
    order: number;
    enabled: boolean;
}

export interface Route {
    id: string;
    name?: string;
    paths: string[];
    methods?: Method[];
    protocols: ('http' | 'https')[];
    hosts?: string[];
    stripPath: boolean;
    preserveHost: boolean;
    upstreamId: string;
}

export interface Upstream {
    id: string;
    name: string;
    algorithm: 'round-robin' | 'least-connections' | 'consistent-hashing';
    targets: {
        target: string; // host:port
        weight: number;
    }[];
    healthCheckPath?: string;
}

export interface QuotaRule {
    id: string;
    name: string;
    targetType: 'consumer' | 'group' | 'ip';
    targetValue: string;
    limit: number;
    window: number; // seconds
    policy: 'count' | 'leaky-bucket';
}

export interface LogItem {
    id: string;
    requestId: string;
    timestamp: string;
    apiId?: string;
    consumerId?: string;
    method: string;
    path: string;
    statusCode: number;
    latency: number;
    clientIp: string;
    userAgent: string;
}

export interface AnalyticsPoint {
    timestamp: string;
    requests: number;
    latencyAvg: number;
    latencyP99: number;
    errors_4xx: number;
    errors_5xx: number;
}

export interface Environment {
    id: string;
    name: string; // dev, staging, prod
    color: string;
    variables: {
        key: string;
        value: string; // Masked
        isSecret: boolean;
    }[];
}

// Permission
export type Permission =
    | 'api.read' | 'api.write' | 'api.deploy'
    | 'product.read' | 'product.write'
    | 'subscription.read' | 'subscription.manage'
    | 'consumer.read' | 'consumer.write'
    | 'credential.manage'
    | 'policy.write'
    | 'logs.read'
    | 'analytics.read'
    | 'env.write'
    | 'settings.write';

export interface User {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    avatar?: string;
}
