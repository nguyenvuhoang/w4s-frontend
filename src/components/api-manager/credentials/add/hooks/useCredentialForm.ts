import { Session } from 'next-auth'
import { useCallback, useState } from 'react'
import { useForm } from 'react-hook-form'

import { workflowService } from '@/servers/system-service'
import { isValidResponse } from '@/shared/utils/isValidResponse'
import SwalAlert from '@/shared/utils/SwalAlert'
import { DEFAULT_FORM_VALUES, FormValues } from '../types'

import Swal from 'sweetalert2'

const fromLocalDT = (v: string) => (v ? new Date(v).toISOString() : null)

export function useCredentialForm(session: Session | null) {
    const [saving, setSaving] = useState(false)

    const form = useForm<FormValues>({ defaultValues: DEFAULT_FORM_VALUES })
    const { reset } = form

    const resetForm = useCallback(() => {
        reset(DEFAULT_FORM_VALUES)
    }, [reset])

    const showSuccessModal = useCallback((clientId: string, clientSecret: string) => {
        Swal.fire({
            title: 'Client created successfully',
            icon: 'success',
            html: `
                <div style="text-align: left; padding: 0 10px;">
                    <div style="margin-bottom: 15px;">
                        <label style="display: block; font-size: 14px; color: #666; margin-bottom: 4px;">Client ID</label>
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <input id="swal-client-id" class="swal2-input" value="${clientId}" readonly 
                                style="margin: 0; flex: 1; height: 40px; font-size: 14px; border: 1px solid #ddd; border-radius: 4px; padding: 0 10px;">
                            <button id="copy-id" type="button" title="Copy" style="background: #f4f4f4; border: 1px solid #ddd; border-radius: 4px; padding: 8px; cursor: pointer; display: flex; align-items: center; justify-content: center;">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="opacity: 0.7;"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                            </button>
                        </div>
                    </div>
                    <div style="margin-bottom: 10px;">
                        <label style="display: block; font-size: 14px; color: #666; margin-bottom: 4px;">Client Secret</label>
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <input id="swal-client-secret" class="swal2-input" value="${clientSecret}" type="password" readonly 
                                style="margin: 0; flex: 1; height: 40px; font-size: 14px; border: 1px solid #ddd; border-radius: 4px; padding: 0 10px;">
                            <button id="toggle-secret" type="button" title="Toggle visibility" style="background: #f4f4f4; border: 1px solid #ddd; border-radius: 4px; padding: 8px; cursor: pointer; display: flex; align-items: center; justify-content: center;">
                                <span id="eye-container" style="display: flex; align-items: center; justify-content: center;">
                                    <svg id="eye-show" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="opacity: 0.7;"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                                </span>
                            </button>
                            <button id="copy-secret" type="button" title="Copy" style="background: #f4f4f4; border: 1px solid #ddd; border-radius: 4px; padding: 8px; cursor: pointer; display: flex; align-items: center; justify-content: center;">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="opacity: 0.7;"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                            </button>
                        </div>
                    </div>
                    <p style="font-size: 12px; color: #999; margin: 0;">Copy it now. Client Secret will be hidden later.</p>
                </div>
            `,
            confirmButtonText: 'OK',
            confirmButtonColor: '#0C9150',
            width: '450px',
            didOpen: () => {
                const copyId = document.getElementById('copy-id')
                const copySecret = document.getElementById('copy-secret')
                const toggleSecret = document.getElementById('toggle-secret')
                const secretInp = document.getElementById('swal-client-secret') as HTMLInputElement
                const eyeContainer = document.getElementById('eye-container')

                const eyeSvg = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="opacity: 0.7;"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`
                const eyeOffSvg = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="opacity: 0.7;"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>`

                copyId?.addEventListener('click', () => {
                    navigator.clipboard.writeText(clientId)
                    copyId.style.background = '#e8f5e9'
                    setTimeout(() => { copyId.style.background = '#f4f4f4' }, 500)
                })
                copySecret?.addEventListener('click', () => {
                    navigator.clipboard.writeText(clientSecret)
                    copySecret.style.background = '#e8f5e9'
                    setTimeout(() => { copySecret.style.background = '#f4f4f4' }, 500)
                })
                toggleSecret?.addEventListener('click', () => {
                    if (secretInp.type === 'password') {
                        secretInp.type = 'text'
                        if (eyeContainer) eyeContainer.innerHTML = eyeOffSvg
                    } else {
                        secretInp.type = 'password'
                        if (eyeContainer) eyeContainer.innerHTML = eyeSvg
                    }
                })
            }
        }).then(() => {
            reset(DEFAULT_FORM_VALUES)
            window.scrollTo({ top: 0, behavior: 'smooth' })
        })
    }, [reset])

    const onSubmit = useCallback(async (data: FormValues) => {
        // Validations
        if (data.AccessTokenTtlSeconds <= 0) {
            SwalAlert('error', 'TTL must be > 0', 'center')
            return
        }

        const payload = {
            client_id: data.ClientId,
            client_name: data.DisplayName,
            client_secret: data.ClientSecret,
            bic_code: data.BICCode || null,
            description: data.Description || null,
            status: data.IsActive ? 'Active' : 'InActive',
            deactivated_at: data.DeactivatedAt,
            allowed_ip_addresses: data.AccessTokenTrustedIPs || null,
            rate_limit_per_minute: Number(data.RateLimitPerMinute),
            token_life_time_in_seconds: Number(data.AccessTokenTtlSeconds),
            refresh_token_life_time_in_seconds: Number(data.RefreshTokenLifeTimeInSeconds),
            expires_at: fromLocalDT(data.ExpiredOnUtc)
        }

        setSaving(true)
        try {
            const resp = await workflowService.addAPIKey({
                sessiontoken: session?.user?.token as string,
                language: 'en' as any,
                fields: payload
            })

            if (!isValidResponse(resp) || (resp.payload?.dataresponse?.errors && resp.payload.dataresponse.errors.length > 0)) {
                const msg = resp.payload?.dataresponse?.errors?.[0]?.info
                    ?? (resp as any)?.message
                    ?? 'Create client failed'
                SwalAlert('error', msg, 'center')
                return
            }

            // Extract result
            const fo0 = resp.payload.dataresponse.data?.input ?? {}
            const resClientId = fo0.client_id || fo0.ClientId || data.ClientId
            const resClientSecret = (fo0.secret || fo0.client_secret || data.ClientSecret || '').toString()

            showSuccessModal(resClientId, resClientSecret)

        } catch (e: any) {
            SwalAlert('error', e?.message ?? 'Create client failed', 'center')
        } finally {
            setSaving(false)
        }
    }, [session, showSuccessModal])

    return {
        form,
        saving,
        resetForm,
        onSubmit
    }
}
