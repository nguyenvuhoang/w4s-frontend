import { Session } from 'next-auth'
import { useCallback, useState } from 'react'
import { useForm } from 'react-hook-form'

import { systemServiceApi } from '@/servers/system-service'
import { isValidResponse } from '@/shared/utils/isValidResponse'
import SwalAlert from '@/shared/utils/SwalAlert'
import { DEFAULT_FORM_VALUES, FormValues } from '../types'

const fromLocalDT = (v: string) => (v ? new Date(v).toISOString() : null)

export function useCredentialForm(session: Session | null) {
    const [saving, setSaving] = useState(false)

    const form = useForm<FormValues>({ defaultValues: DEFAULT_FORM_VALUES })
    const { watch, setValue, reset } = form

    const addScope = useCallback((val: string) => {
        const trimmed = val.trim()
        if (!trimmed) return
        const current = watch('Scopes')
        if (!current.includes(trimmed)) {
            setValue('Scopes', [...current, trimmed])
        }
    }, [watch, setValue])

    const removeScope = useCallback((val: string) => {
        setValue('Scopes', (watch('Scopes') || []).filter(x => x !== val))
    }, [watch, setValue])

    const resetForm = useCallback(() => {
        reset(DEFAULT_FORM_VALUES)
    }, [reset])

    const onSubmit = useCallback(async (data: FormValues) => {
        // Validations
        if (data.AccessTokenTtlSeconds <= 0) {
            SwalAlert('error', 'TTL must be > 0', 'center')
            return
        }
        if (data.AccessTokenMaxTtlSeconds < data.AccessTokenTtlSeconds) {
            SwalAlert('error', 'Max TTL must be ≥ TTL', 'center')
            return
        }
        if (data.AccessTokenMaxUses !== '' && Number(data.AccessTokenMaxUses) < 0) {
            SwalAlert('error', 'Max uses must be ≥ 0', 'center')
            return
        }

        const payload = {
            client_id: data.ClientId,
            display_name: data.DisplayName,
            environment: data.Environment,
            scopes: (data.Scopes ?? []).join(','),
            bic_code: data.BICCode || null,
            expired_on_utc: fromLocalDT(data.ExpiredOnUtc),
            is_active: data.IsActive,

            access_token_ttl_seconds: Number(data.AccessTokenTtlSeconds),
            access_token_max_ttl_seconds: Number(data.AccessTokenMaxTtlSeconds),
            access_token_max_uses: data.AccessTokenMaxUses === '' ? 0 : Number(data.AccessTokenMaxUses),
            access_token_trusted_ips: data.AccessTokenTrustedIPs || null,
            client_secret_trusted_ips: data.ClientSecretTrustedIPs || null,
            client_secret_description: data.ClientSecretDescription || null,
            client_secret_expires_on_utc: fromLocalDT(data.ClientSecretExpiresOnUtc)
        }

        setSaving(true)
        try {
            const resp = await systemServiceApi.runFODynamic({
                sessiontoken: session?.user?.token as string,
                workflowid: 'BO_OPENAPI_CLIENT_CREATE',
                input: payload
            })

            if (!isValidResponse(resp) || (resp.payload?.dataresponse?.errors && resp.payload.dataresponse.errors.length > 0)) {
                const msg = resp.payload?.dataresponse?.errors?.[0]?.info
                    ?? (resp as any)?.message
                    ?? 'Create client failed'
                SwalAlert('error', msg, 'center')
                return
            }

            const fo0 = resp.payload.dataresponse.data.input ?? {}
            const clientId = fo0.client_id || fo0.ClientId
            const clientSecret = (fo0.secret || fo0.client_secret || '').toString()

            SwalAlert(
                'success',
                `Client created:\nID: ${clientId}\nSecret: ${clientSecret}\nCopy it now; it will be hidden later.`,
                'center',
                true,
                false,
                true,
                () => {
                    reset(DEFAULT_FORM_VALUES)
                    window.scrollTo({ top: 0, behavior: 'smooth' })
                }
            )
        } catch (e: any) {
            SwalAlert('error', e?.message ?? 'Create client failed', 'center')
        } finally {
            setSaving(false)
        }
    }, [session, reset])

    return {
        form,
        saving,
        addScope,
        removeScope,
        resetForm,
        onSubmit
    }
}
