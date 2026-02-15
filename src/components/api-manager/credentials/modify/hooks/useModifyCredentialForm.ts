'use client'

import { Session } from 'next-auth'
import { useCallback, useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'

import { workflowService } from '@/servers/system-service'
import { isValidResponse } from '@/shared/utils/isValidResponse'
import SwalAlert from '@/shared/utils/SwalAlert'
import { OpenAPIType } from '@/shared/types/systemTypes'
import { FormValues, DEFAULT_FORM_VALUES } from '../../add/types'
import { getLocalizedUrl } from '@/shared/utils/i18n'

const fromLocalDT = (v: string) => (v ? new Date(v).toISOString() : null)

export function useModifyCredentialForm(session: Session | null, initialData: OpenAPIType, locale: string) {
    const [saving, setSaving] = useState(false)

    const form = useForm<FormValues>({
        defaultValues: {
            ...DEFAULT_FORM_VALUES,
            ClientId: initialData.client_id || '',
            DisplayName: initialData.client_name || '',
            ClientSecret: initialData.client_secret || '',
            BICCode: initialData.bic_code || '',
            Description: initialData.description || '',
            IsActive: !!initialData.is_active,
            AccessTokenTtlSeconds: initialData.token_life_time_in_seconds || 3600,
            RefreshTokenLifeTimeInSeconds: initialData.refresh_token_life_time_in_seconds || 86400,
            RateLimitPerMinute: initialData.rate_limit_per_minute || 100,
            AccessTokenTrustedIPs: initialData.allowed_ip_addresses || '',
            DeactivatedAt: initialData.deactivated_at || null,
            ExpiredOnUtc: initialData.expired_on_utc ? initialData.expired_on_utc.split('Z')[0] : ''
        }
    })

    const { reset } = form

    const resetForm = useCallback(() => {
        reset()
    }, [reset])

    const onSubmit = useCallback(async (data: FormValues) => {
        const payload = {
            id: initialData.id, // Primary key required for update
            client_id: data.ClientId,
            client_name: data.DisplayName,
            client_secret: data.ClientSecret,
            bic_code: data.BICCode,
            description: data.Description,
            status: data.IsActive ? 'Active' : 'InActive',
            deactivated_at: data.DeactivatedAt ? fromLocalDT(data.DeactivatedAt) : null,
            allowed_ip_addresses: data.AccessTokenTrustedIPs || null,
            rate_limit_per_minute: data.RateLimitPerMinute,
            token_life_time_in_seconds: data.AccessTokenTtlSeconds,
            refresh_token_life_time_in_seconds: data.RefreshTokenLifeTimeInSeconds
        }

        setSaving(true)
        try {
            const resp = await workflowService.updateAPIKey({
                sessiontoken: session?.user?.token as string,
                language: 'en' as any,
                fields: payload
            })

            if (!isValidResponse(resp) || (resp.payload?.dataresponse?.errors && resp.payload.dataresponse.errors.length > 0)) {
                const msg = resp.payload?.dataresponse?.errors?.[0]?.info
                    ?? (resp as any)?.message
                    ?? 'Update client failed'
                SwalAlert('error', msg, 'center')
                return
            }

            SwalAlert(
                'success',
                `Client ${data.ClientId} updated successfully.`,
                'center',
                true,
                false,
                true,
                () => {
                    window.location.href = getLocalizedUrl('/api-manager/credentials', locale)
                }
            )
        } catch (e: any) {
            SwalAlert('error', e?.message ?? 'Update client failed', 'center')
        } finally {
            setSaving(false)
        }
    }, [session, initialData.id])

    return {
        form,
        saving,
        resetForm,
        onSubmit
    }
}
