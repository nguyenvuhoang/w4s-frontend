export interface InfisicalLoginRequest {
    clientId: string;
    clientSecret: string;
}

export interface InfisicalLoginResponse {
    accessToken: string;
    expiresIn: number;
    accessTokenMaxTTL: number;
    tokenType: string;
}

export interface InfisicalWorkspace {
    id: string;
    name: string;
    slug: string;
    orgId: string;
}

export interface InfisicalEnvironment {
    id: string;
    name: string;
    slug: string;
}

export interface InfisicalSecret {
    id: string;
    secretKey: string;
    secretValue: string;
    type: 'shared' | 'personal';
    environment: string;
    workspace: string;
}

export interface InfisicalWorkspacesResponse {
    workspaces: InfisicalWorkspace[];
}

export interface InfisicalEnvironmentsResponse {
    environments: InfisicalEnvironment[];
}

export interface InfisicalSecretsResponse {
    secrets: InfisicalSecret[];
}
