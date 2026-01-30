'use client'

import { useMemo, useCallback } from 'react'
import { ResponseDefaultData } from '@shared/types'
import { OpenAPIType } from '@shared/types/systemTypes'

export type ClientStatus = 'ACTIVE' | 'REVOKED' | 'EXPIRED' | 'INACTIVE'

export type ClientView = {
    ClientId: string | null
    ClientSecret: string | null
    DisplayName: string | null
    Environment: string | null
    Scopes: string[]
    BICCode: string | null
    ExpiredOnUtc: string | null
    IsRevoked: boolean
    IsActive: boolean
    CreatedOnUtc: string | null
    CreatedBy: string | null
    LastUsedOnUtc: string | null
    UsageCount: number
    Id: number | string | null
    AccessTokenTtlSeconds: number
    AccessTokenMaxTtlSeconds: number
    AccessTokenMaxUses: number | null
    AccessTokenTrustedIPs: string[]
    ClientSecretTrustedIPs: string[]
    ClientSecretDescription: string | null
    ClientSecretExpiresOnUtc: string | null
}

export type SecretRow = {
    id: string
    masked: string
    description: string
    uses: number
    expires: string | null
}

export type AuthDetails = {
    accessTokenTtl: number
    accessTokenMaxTtl: number
    accessTokenMaxUses: number | null
    accessTokenTrustedIps: string[]
    clientSecretTrustedIps: string[]
}

function toArray(v: any): string[] {
    if (Array.isArray(v)) return v
    return String(v ?? '')
        .split(',')
        .map((s: string) => s.trim())
        .filter(Boolean)
}

export default function useOpenApiView(
    openAPIdata: ResponseDefaultData<OpenAPIType> | any
) {
    const raw =
        openAPIdata?.payload?.dataresponse?.fo?.[0]?.input.data ||
        openAPIdata?.data ||
        openAPIdata

    // 2) Map -> ClientView
    const client: ClientView = useMemo(() => {
        const c = raw || {}
        return {
            ClientId: c.ClientId ?? c.clientid ?? null,
            ClientSecret: c.ClientSecret ?? c.clientsecret ?? null,
            DisplayName: c.DisplayName ?? c.displayname ?? null,
            Environment: c.Environment ?? c.environment ?? null,
            Scopes: toArray(c.Scopes ?? c.scopes),
            BICCode: c.BICCode ?? c.biccode ?? null,
            ExpiredOnUtc: c.ExpiredOnUtc ?? c.expiredonutc ?? null,
            IsRevoked: !!(c.IsRevoked ?? c.isrevoked),
            IsActive: !!(c.IsActive ?? c.isactive),
            CreatedOnUtc: c.CreatedOnUtc ?? c.createdonutc ?? null,
            CreatedBy: c.CreatedBy ?? c.createdby ?? null,
            LastUsedOnUtc: c.LastUsedOnUtc ?? c.lastusedonutc ?? null,
            UsageCount: Number(c.UsageCount ?? c.usagecount ?? 0),
            Id: c.id ?? c.Id ?? null,

            AccessTokenTtlSeconds: Number(
                c.AccessTokenTtlSeconds ?? c.accesstokenttlseconds ?? 2592000
            ),
            AccessTokenMaxTtlSeconds: Number(
                c.AccessTokenMaxTtlSeconds ?? c.accesstokenmaxttlseconds ?? 2592000
            ),
            AccessTokenMaxUses: c.AccessTokenMaxUses ?? c.accesstokenmaxuses ?? null,
            AccessTokenTrustedIPs: toArray(c.AccessTokenTrustedIPs ?? c.accesstokentrustedips),
            ClientSecretTrustedIPs: toArray(c.ClientSecretTrustedIPs ?? c.clientsecrettrustedips),
            ClientSecretDescription: c.ClientSecretDescription ?? c.clientsecretdescription ?? null,
            ClientSecretExpiresOnUtc: c.ClientSecretExpiresOnUtc ?? c.clientsecretexpiresonutc ?? null
        }
    }, [raw])

    // 3) Status
    const status: ClientStatus = useMemo(() => {
        if (client.IsRevoked) return 'REVOKED'
        const now = Date.now()
        const exp = client.ExpiredOnUtc ? Date.parse(client.ExpiredOnUtc) : Number.POSITIVE_INFINITY
        if (!client.IsActive) return 'INACTIVE'
        if (exp < now) return 'EXPIRED'
        return 'ACTIVE'
    }, [client])

    // 4) Auth details cho card pháº£i
    const authDetails: AuthDetails = useMemo(
        () => ({
            accessTokenTtl: client.AccessTokenTtlSeconds,
            accessTokenMaxTtl: client.AccessTokenMaxTtlSeconds,
            accessTokenMaxUses: client.AccessTokenMaxUses,
            accessTokenTrustedIps: client.AccessTokenTrustedIPs,
            clientSecretTrustedIps: client.ClientSecretTrustedIPs
        }),
        [client]
    )

    // 5) Secrets (náº¿u sau dÃ¹ng multi-secret thÃ¬ map list tháº­t vÃ o Ä‘Ã¢y)
    const maskSecret = useCallback((s?: string | null) => (s ? `${s.slice(0, 4)}***` : '-'), [])
    const secrets: SecretRow[] = useMemo(
        () => [
            {
                id: '1',
                masked: maskSecret(client.ClientSecret ?? ''),
                description: client.ClientSecretDescription ?? client.DisplayName ?? 'Default',
                uses: client.UsageCount ?? 0,
                expires: client.ClientSecretExpiresOnUtc ?? client.ExpiredOnUtc ?? null
            }
        ],
        [client, maskSecret]
    )

    // 6) Helpers
    const fmtDate = useCallback(
        (iso?: string | null) => (iso ? (iso.includes('T') ? iso.split('T')[0] : iso) : '-'),
        []
    )
    const fmtDateTime = useCallback(
        (iso?: string | null) => (iso ? (iso.includes('T') ? iso.replace('T', ' ').slice(0, 16) : iso) : '-'),
        []
    )
    const copy = useCallback(async (text?: string | null) => {
        if (!text) return
        try {
            await navigator.clipboard.writeText(text)
        } catch {
            // ignore
        }
    }, [])

    return { client, status, authDetails, secrets, maskSecret, fmtDate, fmtDateTime, copy }
}


