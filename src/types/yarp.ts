export type ReverseProxyPrimitive = string | number | boolean | null;

export interface ReverseProxyTransform {
    [key: string]: ReverseProxyPrimitive;
}

export interface ReverseProxyDestination {
    Address?: string | null;
    [key: string]: ReverseProxyPrimitive | undefined;
}

export interface ReverseProxyHttpRequest {
    ActivityTimeout?: string | null;
    Version?: string | null;
    VersionPolicy?: string | null;
    AllowResponseBuffering?: boolean | null;
    [key: string]: ReverseProxyPrimitive | undefined;
}

export interface ReverseProxyRoute {
    ClusterId?: string | null;
    Match?: {
        Path?: string | null;
        [key: string]: ReverseProxyPrimitive | undefined;
    } | null;
    Transforms?: ReverseProxyTransform[] | null;
    [key: string]: ReverseProxyPrimitive | ReverseProxyTransform[] | ReverseProxyRoute['Match'] | undefined;
}

export interface ReverseProxyCluster {
    Destinations?: Record<string, ReverseProxyDestination | null> | null;
    HttpRequest?: ReverseProxyHttpRequest | null;
    [key: string]: ReverseProxyPrimitive | Record<string, ReverseProxyDestination | null> | ReverseProxyHttpRequest | undefined;
}

export interface ReverseProxyConfig {
    Routes?: Record<string, ReverseProxyRoute | null> | null;
    Clusters?: Record<string, ReverseProxyCluster | null> | null;
}

export interface ReverseProxyResponseData {
    ReverseProxy?: ReverseProxyConfig | null;
}

export interface ParsedReverseProxyRoute extends ReverseProxyRoute {
    id: string;
}

export interface ParsedReverseProxyCluster extends ReverseProxyCluster {
    id: string;
}

export type YarpRoute = ParsedReverseProxyRoute;
export type YarpCluster = ParsedReverseProxyCluster;

export interface YarpConfig extends ReverseProxyConfig {}
