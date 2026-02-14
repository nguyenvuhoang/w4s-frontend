'use client'

import { Session } from 'next-auth'
import { useCallback, useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'

import { workflowService } from '@/servers/system-service'
import { isValidResponse } from '@/shared/utils/isValidResponse'
import SwalAlert from '@/shared/utils/SwalAlert'
import { OpenAPIType } from '@/shared/types/systemTypes'
import { FormValues, DEFAULT_FORM_VALUES } from '../add/types'

const fromLocalDT = (v: string) => (v ? new Date(v).toISOString() : null)

export function useModifyCredentialForm(session: Session | null, initialData: OpenAPIType) {
    const [saving, setSaving] = useState(false)

    const form = useForm<FormValues>({
        defaultValues: {
            ...DEFAULT_FORM_VALUES,
            ClientId: initialData.client_id,
            DisplayName: initialData.client_name,
            Environment: initialData.environment as any,
            Scopes: initialData.scopes ? initialData.scopes.split(',').map(s => s.trim()) : [],
            IsActive: initialData.is_active,
            AccessTokenTrustedIPs: initialData.allowed_ip_addresses || '',
            ExpiredOnUtc: initialData.expired_on_utc ? initialData.expired_on_utc.split('Z')[0] : ''
        }
    })

    const { watch, setValue, reset } = form

    const addScope = useCallback((val: string) => {
        const trimmed = val.trim()
        if (!trimmed) return
        const current = watch('Scopes') || []
        if (!current.includes(trimmed)) {
            setValue('Scopes', [...current, trimmed])
        }
    }, [watch, setValue])

    const removeScope = useCallback((val: string) => {
        setValue('Scopes', (watch('Scopes') || []).filter(x => x !== val))
    }, [watch, setValue])

    const resetForm = useCallback(() => {
        reset()
    }, [reset])

    const onSubmit = useCallback(async (data: FormValues) => {
        const payload = {
            id: initialData.id,
            client_id: data.ClientId,
            display_name: data.DisplayName,
            environment: data.Environment,
            scopes: (data.Scopes ?? []).join(','),
            is_active: data.IsActive,
            allowed_ip_addresses: data.AccessTokenTrustedIPs || null,
            expired_on_utc: fromLocalDT(data.ExpiredOnUtc)
        }

        setSaving(true)
        try {
            const resp = await workflowService.updateAPIKey({
                sessiontoken: session?.user?.token as string,
                language: 'en' as any, // Locale placeholder
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
                    // Back to list?
                    window.location.href = '../..'
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
        addScope,
        removeScope,
        resetForm,
        onSubmit
    }
}
