export interface YarpRoute {
    id: string; // Internal ID for table
    ClusterId: string;
    Match: {
        Path: string;
    };
    Transforms?: {
        [key: string]: any;
    }[];
}

export interface YarpCluster {
    id: string; // Internal ID for table
    Destinations: {
        [key: string]: {
            Address: string;
        };
    };
    HttpRequest?: {
        ActivityTimeout?: string;
        Version?: string;
        VersionPolicy?: string;
        AllowResponseBuffering?: boolean;
    };
}

export interface YarpConfig {
    Routes: {
        [key: string]: Omit<YarpRoute, 'id'>;
    };
    Clusters: {
        [key: string]: Omit<YarpCluster, 'id'>;
    };
}
