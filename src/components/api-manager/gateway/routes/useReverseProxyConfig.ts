'use client';

import { useEffect, useMemo, useState } from 'react';
import { Locale } from '@/configs/i18n';
import { learnAPIService } from '@/servers/system-service/services/learnapi.service';
import {
    ParsedReverseProxyCluster,
    ParsedReverseProxyRoute,
    ReverseProxyCluster,
    ReverseProxyConfig,
    ReverseProxyDestination,
    ReverseProxyHttpRequest,
    ReverseProxyResponseData,
    ReverseProxyRoute,
    ReverseProxyTransform
} from '@/types/yarp';

type DetailState =
    | { type: 'route'; item: ParsedReverseProxyRoute }
    | { type: 'cluster'; item: ParsedReverseProxyCluster }
    | null;

type EditState =
    | { type: 'route'; originalId: string; values: RouteEditValues }
    | { type: 'cluster'; originalId: string; values: ClusterEditValues }
    | null;

export interface RouteEditValues {
    id: string;
    ClusterId: string;
    Path: string;
    Transforms: string;
}

export interface ClusterEditValues {
    id: string;
    Address: string;
    ActivityTimeout: string;
    Version: string;
    VersionPolicy: string;
    AllowResponseBuffering: boolean;
}

export interface ValidationError {
    key: string;
    message: string;
}

interface UseReverseProxyConfigParams {
    initialConfig?: ReverseProxyConfig | null;
    sessionToken: string;
    locale: Locale;
}

const emptyConfig: ReverseProxyConfig = {
    Routes: {},
    Clusters: {}
};

const deepClone = <T,>(value: T): T => {
    if (typeof structuredClone === 'function') return structuredClone(value);
    return JSON.parse(JSON.stringify(value ?? null)) as T;
};

const normalizeConfig = (config?: ReverseProxyConfig | null): ReverseProxyConfig => ({
    Routes: deepClone(config?.Routes ?? {}),
    Clusters: deepClone(config?.Clusters ?? {})
});

const extractReverseProxyConfig = (response: unknown): ReverseProxyConfig => {
    const source = response as {
        payload?: { dataresponse?: { data?: ReverseProxyResponseData | { data?: ReverseProxyResponseData } | null } };
        dataresponse?: { data?: ReverseProxyResponseData | { data?: ReverseProxyResponseData } | null };
    };
    const data = source.payload?.dataresponse?.data ?? source.dataresponse?.data;
    const reverseProxyData = (
        data && typeof data === 'object' && 'data' in data
            ? (data as { data?: ReverseProxyResponseData }).data
            : data
    ) as ReverseProxyResponseData | null | undefined;

    return normalizeConfig(reverseProxyData?.ReverseProxy ?? emptyConfig);
};

const toRoutes = (routes?: ReverseProxyConfig['Routes']): ParsedReverseProxyRoute[] =>
    Object.entries(routes ?? {}).map(([id, route]) => ({
        id,
        ...(route ?? {})
    }));

const toClusters = (clusters?: ReverseProxyConfig['Clusters']): ParsedReverseProxyCluster[] =>
    Object.entries(clusters ?? {}).map(([id, cluster]) => ({
        id,
        ...(cluster ?? {})
    }));

const getDestinationEntries = (cluster?: ReverseProxyCluster | null): [string, ReverseProxyDestination | null][] =>
    Object.entries(cluster?.Destinations ?? {});

const getDestinationAddresses = (cluster?: ReverseProxyCluster | null): string[] =>
    getDestinationEntries(cluster)
        .map(([, destination]) => destination?.Address)
        .filter((address): address is string => Boolean(address));

const getPrimaryDestination = (cluster?: ReverseProxyCluster | null): [string, ReverseProxyDestination | null] | null => {
    const entries = getDestinationEntries(cluster);
    return entries.find(([key]) => key === 'primary') ?? entries[0] ?? null;
};

const transformToText = (transforms?: ReverseProxyTransform[] | null): string =>
    transforms?.length
        ? transforms
            .map(transform => Object.entries(transform).map(([key, value]) => `${key}: ${value ?? '-'}`).join(', '))
            .join(' | ')
        : 'No transform';

const toRouteEditValues = (route: ParsedReverseProxyRoute): RouteEditValues => ({
    id: route.id,
    ClusterId: route.ClusterId ?? '',
    Path: route.Match?.Path ?? '',
    Transforms: JSON.stringify(route.Transforms ?? [], null, 2)
});

const toClusterEditValues = (cluster: ParsedReverseProxyCluster): ClusterEditValues => {
    const primary = getPrimaryDestination(cluster);

    return {
        id: cluster.id,
        Address: primary?.[1]?.Address ?? '',
        ActivityTimeout: cluster.HttpRequest?.ActivityTimeout ?? '',
        Version: cluster.HttpRequest?.Version ?? '',
        VersionPolicy: cluster.HttpRequest?.VersionPolicy ?? '',
        AllowResponseBuffering: Boolean(cluster.HttpRequest?.AllowResponseBuffering)
    };
};

const parseTransforms = (value: string): ReverseProxyTransform[] | null => {
    const trimmed = value.trim();
    if (!trimmed) return [];

    const parsed = JSON.parse(trimmed);
    if (!Array.isArray(parsed)) throw new Error('Transforms must be a JSON array.');

    return parsed as ReverseProxyTransform[];
};

export function useReverseProxyConfig({ initialConfig, sessionToken, locale }: UseReverseProxyConfigParams) {
    const [originalConfig, setOriginalConfig] = useState<ReverseProxyConfig | null>(() => normalizeConfig(initialConfig));
    const [draftConfig, setDraftConfig] = useState<ReverseProxyConfig | null>(() => normalizeConfig(initialConfig));
    const [dirtyMap, setDirtyMap] = useState<Record<string, boolean>>({});
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [saving, setSaving] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [activeTab, setActiveTab] = useState(0);
    const [detail, setDetail] = useState<DetailState>(null);
    const [editState, setEditState] = useState<EditState>(null);
    const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
    const [statusMessage, setStatusMessage] = useState<{ severity: 'success' | 'error' | 'warning' | 'info'; text: string } | null>(null);

    useEffect(() => {
        const handler = (event: BeforeUnloadEvent) => {
            if (!hasUnsavedChanges) return;
            event.preventDefault();
            event.returnValue = '';
        };

        window.addEventListener('beforeunload', handler);
        return () => window.removeEventListener('beforeunload', handler);
    }, [hasUnsavedChanges]);

    const routes = useMemo(() => toRoutes(draftConfig?.Routes), [draftConfig?.Routes]);
    const clusters = useMemo(() => toClusters(draftConfig?.Clusters), [draftConfig?.Clusters]);

    const clusterById = useMemo(() => {
        const mapping = new Map<string, ParsedReverseProxyCluster>();
        clusters.forEach(cluster => mapping.set(cluster.id, cluster));
        return mapping;
    }, [clusters]);

    const routesByClusterId = useMemo(() => {
        const mapping = new Map<string, ParsedReverseProxyRoute[]>();

        routes.forEach(route => {
            const clusterId = route.ClusterId;
            if (!clusterId) return;

            const current = mapping.get(clusterId) ?? [];
            current.push(route);
            mapping.set(clusterId, current);
        });

        return mapping;
    }, [routes]);

    const filteredRoutes = useMemo(() => {
        const query = searchText.trim().toLowerCase();
        if (!query) return routes;

        return routes.filter(route => {
            const cluster = route.ClusterId ? clusterById.get(route.ClusterId) : undefined;
            const haystack = [
                route.id,
                route.ClusterId,
                route.Match?.Path,
                transformToText(route.Transforms),
                ...getDestinationAddresses(cluster)
            ].join(' ').toLowerCase();

            return haystack.includes(query);
        });
    }, [clusterById, routes, searchText]);

    const filteredClusters = useMemo(() => {
        const query = searchText.trim().toLowerCase();
        if (!query) return clusters;

        return clusters.filter(cluster => {
            const routeIds = routesByClusterId.get(cluster.id)?.map(route => route.id) ?? [];
            const haystack = [
                cluster.id,
                cluster.HttpRequest?.ActivityTimeout,
                cluster.HttpRequest?.Version,
                cluster.HttpRequest?.VersionPolicy,
                String(cluster.HttpRequest?.AllowResponseBuffering ?? ''),
                ...getDestinationAddresses(cluster),
                ...routeIds
            ].join(' ').toLowerCase();

            return haystack.includes(query);
        });
    }, [clusters, routesByClusterId, searchText]);

    const summary = useMemo(() => {
        const totalDestinations = clusters.reduce((total, cluster) => total + getDestinationEntries(cluster).length, 0);

        return {
            totalRoutes: routes.length,
            totalClusters: clusters.length,
            totalDestinations,
            modifiedItems: Object.keys(dirtyMap).length
        };
    }, [clusters, dirtyMap, routes]);

    const getClusterForRoute = (route?: ReverseProxyRoute | null) =>
        route?.ClusterId ? clusterById.get(route.ClusterId) : undefined;

    const getRoutesForCluster = (clusterId?: string | null) =>
        clusterId ? routesByClusterId.get(clusterId) ?? [] : [];

    const selectRoute = (route: ParsedReverseProxyRoute) => setDetail({ type: 'route', item: route });
    const selectCluster = (cluster: ParsedReverseProxyCluster) => setDetail({ type: 'cluster', item: cluster });
    const closeDetail = () => setDetail(null);

    const isDirty = (type: 'route' | 'cluster', id: string) => Boolean(dirtyMap[`${type}:${id}`]);

    const validateRoute = (values: RouteEditValues): ValidationError[] => {
        const errors: ValidationError[] = [];

        if (!values.id.trim()) errors.push({ key: 'route:id', message: 'Route key is required.' });
        if (!values.ClusterId.trim()) errors.push({ key: `route:${values.id || 'unknown'}`, message: 'ClusterId is required.' });
        if (!values.Path.trim()) errors.push({ key: `route:${values.id || 'unknown'}`, message: 'Match.Path is required.' });
        if (values.Path.trim() && !values.Path.trim().startsWith('/')) {
            errors.push({ key: `route:${values.id || 'unknown'}`, message: 'Match.Path must start with /.' });
        }

        try {
            parseTransforms(values.Transforms);
        } catch (error) {
            errors.push({ key: `route:${values.id || 'unknown'}`, message: error instanceof Error ? error.message : 'Transforms JSON is invalid.' });
        }

        return errors;
    };

    const validateCluster = (values: ClusterEditValues): ValidationError[] => {
        const errors: ValidationError[] = [];

        if (!values.id.trim()) errors.push({ key: 'cluster:id', message: 'Cluster key is required.' });
        if (!values.Address.trim()) errors.push({ key: `cluster:${values.id || 'unknown'}`, message: 'Cluster address is required.' });
        if (values.Address.trim() && !/^https?:\/\//i.test(values.Address.trim())) {
            errors.push({ key: `cluster:${values.id || 'unknown'}`, message: 'Cluster address must start with http:// or https://.' });
        }
        if (!values.ActivityTimeout.trim()) {
            errors.push({ key: `cluster:${values.id || 'unknown'}`, message: 'ActivityTimeout is required.' });
        }
        if (typeof values.AllowResponseBuffering !== 'boolean') {
            errors.push({ key: `cluster:${values.id || 'unknown'}`, message: 'AllowResponseBuffering must be boolean.' });
        }

        return errors;
    };

    const validateAllDraft = (config: ReverseProxyConfig | null = draftConfig): ValidationError[] => {
        const routeErrors = toRoutes(config?.Routes).flatMap(route => validateRoute(toRouteEditValues(route)));
        const clusterErrors = toClusters(config?.Clusters).flatMap(cluster => validateCluster(toClusterEditValues(cluster)));
        return [...routeErrors, ...clusterErrors];
    };

    const startEditRoute = (route: ParsedReverseProxyRoute) => {
        setEditState({ type: 'route', originalId: route.id, values: toRouteEditValues(route) });
        setStatusMessage(null);
    };

    const startEditCluster = (cluster: ParsedReverseProxyCluster) => {
        setEditState({ type: 'cluster', originalId: cluster.id, values: toClusterEditValues(cluster) });
        setStatusMessage(null);
    };

    const cancelEditRow = () => {
        setEditState(null);
        setValidationErrors([]);
    };

    const updateEditValues = (values: Partial<RouteEditValues | ClusterEditValues>) => {
        setEditState(current => {
            if (!current) return current;
            return {
                ...current,
                values: {
                    ...current.values,
                    ...values
                }
            } as EditState;
        });
    };

    const applyRouteDraft = (originalId: string, values: RouteEditValues) => {
        const errors = validateRoute(values);
        if (errors.length) {
            setValidationErrors(errors);
            setStatusMessage({ severity: 'error', text: errors[0].message });
            return false;
        }

        const nextId = values.id.trim();
        const transforms = parseTransforms(values.Transforms);
        const currentRoute = draftConfig?.Routes?.[originalId] ?? {};
        const nextRoute: ReverseProxyRoute = {
            ...currentRoute,
            ClusterId: values.ClusterId.trim(),
            Match: {
                ...(currentRoute.Match ?? {}),
                Path: values.Path.trim()
            },
            Transforms: transforms
        };

        setDraftConfig(current => {
            const next = normalizeConfig(current);
            const routesMap = { ...(next.Routes ?? {}) };
            delete routesMap[originalId];
            routesMap[nextId] = nextRoute;
            next.Routes = routesMap;
            return next;
        });
        setDirtyMap(current => {
            const next = { ...current };
            delete next[`route:${originalId}`];
            next[`route:${nextId}`] = true;
            return next;
        });
        setHasUnsavedChanges(true);
        setValidationErrors([]);
        setEditState(null);
        setStatusMessage({ severity: 'warning', text: 'Route changes applied to draft. Click Save All to persist.' });
        return true;
    };

    const applyClusterDraft = (originalId: string, values: ClusterEditValues) => {
        const errors = validateCluster(values);
        if (errors.length) {
            setValidationErrors(errors);
            setStatusMessage({ severity: 'error', text: errors[0].message });
            return false;
        }

        const nextId = values.id.trim();
        const currentCluster = draftConfig?.Clusters?.[originalId] ?? {};
        const destinations = { ...(currentCluster.Destinations ?? {}) };
        const primaryKey = getPrimaryDestination(currentCluster)?.[0] ?? 'primary';

        destinations[primaryKey] = {
            ...(destinations[primaryKey] ?? {}),
            Address: values.Address.trim()
        };

        const httpRequest: ReverseProxyHttpRequest = {
            ...(currentCluster.HttpRequest ?? {}),
            ActivityTimeout: values.ActivityTimeout.trim(),
            Version: values.Version.trim(),
            VersionPolicy: values.VersionPolicy.trim(),
            AllowResponseBuffering: values.AllowResponseBuffering
        };

        const nextCluster: ReverseProxyCluster = {
            ...currentCluster,
            Destinations: destinations,
            HttpRequest: httpRequest
        };

        setDraftConfig(current => {
            const next = normalizeConfig(current);
            const clustersMap = { ...(next.Clusters ?? {}) };
            delete clustersMap[originalId];
            clustersMap[nextId] = nextCluster;
            next.Clusters = clustersMap;
            return next;
        });
        setDirtyMap(current => {
            const next = { ...current };
            delete next[`cluster:${originalId}`];
            next[`cluster:${nextId}`] = true;
            return next;
        });
        setHasUnsavedChanges(true);
        setValidationErrors([]);
        setEditState(null);
        setStatusMessage({ severity: 'warning', text: 'Cluster changes applied to draft. Click Save All to persist.' });
        return true;
    };

    const buildUpdatePayload = () => ({
        learn_api: 'CMS_UPDATE_REVERSE_PROXY_CONFIG',
        fields: {
            ReverseProxy: draftConfig ?? emptyConfig
        }
    });

    const loadConfig = async () => {
        const response = await learnAPIService.getReverseProxyConfig({
            sessiontoken: sessionToken,
            language: locale
        });
        return extractReverseProxyConfig(response);
    };

    const reloadConfig = async (force = false) => {
        if (hasUnsavedChanges && !force) {
            const confirmed = window.confirm('You have unsaved changes. Refresh will discard the draft. Continue?');
            if (!confirmed) return;
        }

        setSaving(true);
        try {
            const latest = await loadConfig();
            setOriginalConfig(latest);
            setDraftConfig(deepClone(latest));
            setDirtyMap({});
            setHasUnsavedChanges(false);
            setValidationErrors([]);
            setEditState(null);
            setStatusMessage({ severity: 'success', text: 'Reverse Proxy config reloaded.' });
        } catch (error) {
            console.error('Reload reverse proxy config failed:', error);
            setStatusMessage({ severity: 'error', text: 'Failed to reload Reverse Proxy config.' });
        } finally {
            setSaving(false);
        }
    };

    const discardChanges = () => {
        setDraftConfig(deepClone(originalConfig ?? emptyConfig));
        setDirtyMap({});
        setHasUnsavedChanges(false);
        setValidationErrors([]);
        setEditState(null);
        setStatusMessage({ severity: 'info', text: 'Draft changes discarded.' });
    };

    const saveAllChanges = async () => {
        const errors = validateAllDraft();
        if (errors.length) {
            setValidationErrors(errors);
            setStatusMessage({ severity: 'error', text: errors[0].message });
            return;
        }

        if (!draftConfig || !hasUnsavedChanges) return;

        setSaving(true);
        try {
            await learnAPIService.updateReverseProxyConfig({
                sessiontoken: sessionToken,
                language: locale,
                reverseProxy: draftConfig
            });

            const latest = await loadConfig();
            setOriginalConfig(latest);
            setDraftConfig(deepClone(latest));
            setDirtyMap({});
            setHasUnsavedChanges(false);
            setValidationErrors([]);
            setEditState(null);
            setStatusMessage({ severity: 'success', text: 'Reverse Proxy config saved and reloaded.' });
        } catch (error) {
            console.error('Save reverse proxy config failed:', error);
            setStatusMessage({ severity: 'error', text: 'Failed to save Reverse Proxy config.' });
        } finally {
            setSaving(false);
        }
    };

    return {
        activeTab,
        applyClusterDraft,
        applyRouteDraft,
        buildUpdatePayload,
        cancelEditRow,
        closeDetail,
        clusters,
        detail,
        dirtyMap,
        discardChanges,
        draftConfig,
        editState,
        filteredClusters,
        filteredRoutes,
        getClusterForRoute,
        getDestinationAddresses,
        getDestinationEntries,
        getRoutesForCluster,
        hasUnsavedChanges,
        isDirty,
        loadConfig,
        originalConfig,
        reloadConfig,
        routes,
        saveAllChanges,
        saving,
        searchText,
        selectCluster,
        selectRoute,
        setActiveTab,
        setSearchText,
        startEditCluster,
        startEditRoute,
        statusMessage,
        summary,
        transformToText,
        updateEditValues,
        validationErrors
    };
}
