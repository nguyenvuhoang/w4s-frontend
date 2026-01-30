import {
    Api, ApiVersion, Endpoint, ProductPlan, Consumer, Subscription,
    ApiKey, OAuthClient, Policy, PolicyAttachment, Route, Upstream,
    QuotaRule, LogItem, AnalyticsPoint, Environment
} from '@/types/api-manager';

export type {
    Api, ApiVersion, Endpoint, ProductPlan, Consumer, Subscription,
    ApiKey, OAuthClient, Policy, PolicyAttachment, Route, Upstream,
    QuotaRule, LogItem, AnalyticsPoint, Environment
};

export interface ApiSpecDraft {
    id: string;
    apiId?: string; // If related to existing API
    title: string;
    status: 'PENDING' | 'PROCESSING' | 'DONE' | 'FAILED';
    sourceType: 'PDF' | 'OPENAPI' | 'WSDL';
    fileName: string;
    fileUrl?: string; // Path to temp file
    extractedJson?: any; // The structure extracted from PDF
    openApiSpec?: string; // The generated OpenAPI YAML/JSON
    validationErrors?: string[];
    createdAt: Date;
}

class ApiManagerStore {
    apis: Api[] = [];
    versions: ApiVersion[] = [];
    drafts: ApiSpecDraft[] = [];
    endpoints: Endpoint[] = [];
    products: ProductPlan[] = [];
    consumers: Consumer[] = [];
    subscriptions: Subscription[] = [];
    apiKeys: ApiKey[] = [];
    oauthClients: OAuthClient[] = [];
    policies: Policy[] = [];
    policyAttachments: PolicyAttachment[] = [];
    routes: Route[] = [];
    upstreams: Upstream[] = [];
    quotaRules: QuotaRule[] = [];
    logs: LogItem[] = [];
    analytics: AnalyticsPoint[] = [];
    environments: Environment[] = [];

    constructor() {
        this.seed();
    }

    private seed() {
        // Seed APIs
        this.apis = [
            {
                id: 'api-1', name: 'Payment Service', description: 'Process payments and refunds',
                version: 'v1.0.0', status: 'published', type: 'rest',
                createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
                ownerId: 'admin', labels: ['finance', 'core']
            },
            {
                id: 'api-2', name: 'User Service', description: 'User management endpoints',
                version: 'v2.1', status: 'published', type: 'graphql',
                createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
                ownerId: 'admin', labels: ['core', 'users']
            },
        ];

        // Seed Consumers
        this.consumers = [
            {
                id: 'cons-1', username: 'partner-app', type: 'external',
                createdAt: new Date().toISOString(), tags: ['partner', 'gold'],
                orgName: 'Acme Corp', contactEmail: 'dev@acme.com'
            },
            {
                id: 'cons-2', username: 'mobile-app', type: 'internal',
                createdAt: new Date().toISOString(), tags: ['mobile'],
                orgName: 'Our Mobile Team'
            }
        ];

        // Seed Products
        this.products = [
            {
                id: 'prod-1', name: 'Gold Tier', description: 'High limits for partners',
                apis: ['api-1', 'api-2'], approvalRequired: true,
                quota: { limit: 10000, period: 'day' }, status: 'published'
            },
            {
                id: 'prod-2', name: 'Free Tier', description: 'For testing',
                apis: ['api-2'], approvalRequired: false,
                quota: { limit: 100, period: 'hour' }, status: 'published'
            }
        ];

        // Seed Subscriptions
        this.subscriptions = [
            {
                id: 'sub-1', consumerId: 'cons-1', productId: 'prod-1', status: 'active', createdAt: new Date().toISOString()
            }
        ];

        // Seed Analytics
        const now = Date.now();
        for (let i = 0; i < 24; i++) {
            this.analytics.push({
                timestamp: new Date(now - i * 3600000).toISOString(),
                requests: Math.floor(Math.random() * 1000),
                latencyAvg: Math.floor(Math.random() * 100 + 20),
                latencyP99: Math.floor(Math.random() * 200 + 50),
                errors_4xx: Math.floor(Math.random() * 10),
                errors_5xx: Math.floor(Math.random() * 2),
            });
        }

        // Seed more initial data as needed implicitly by empty arrays or component default handling
    }
}

// Use global to persist across hot reloads in dev
const store = global.__apiManagerStore || new ApiManagerStore();

if (process.env.NODE_ENV !== 'production') {
    global.__apiManagerStore = store;
}

export { store };

declare global {
    var __apiManagerStore: ApiManagerStore | undefined;
}
