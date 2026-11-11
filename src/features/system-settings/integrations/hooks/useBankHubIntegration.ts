'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import type { Locale } from '@/configs/i18n'
import SwalAlert from '@/shared/utils/SwalAlert'
import type { SystemSettingsDictionary } from '@/views/pages/system-settings/systemSettingsModules'

import { bankHubService } from '../bankhub/bankhub.service'
import type { BankHubLinkTokenData, CreateBankHubLinkRequest } from '../bankhub/bankhub.types'
import { createBankHubInstance, disposeBankHubInstance, getBankHubConstructor } from '../bankhub/bankhub-sdk'
import type { BankHubExpiredEvent, BankHubInstance, BankHubSuccessEvent } from '../bankhub/bankhub-sdk.types'
import { integrationsText } from '../integrationModules'

export type BankHubSdkStatus = 'loading' | 'ready' | 'error'

type Params = {
  dictionary: SystemSettingsDictionary
  locale: string
  sessiontoken?: string
  /**
   * Called after the SDK reports a successful link/unlink, e.g. to refresh company/bank account data.
   * The SDK event is frontend-only; the backend webhook remains the source of truth.
   */
  onBankAccountLinked?: (event: BankHubSuccessEvent) => void
}

const isDev = process.env.NODE_ENV === 'development'

const logDev = (message: string, payload?: unknown) => {
  if (isDev) console.info(message, payload)
}

const logDevError = (message: string, error: unknown) => {
  if (isDev) console.error(message, error)
}

/**
 * Reusable SePay Bank Hub link flow: creates a single-use link token through WF_BO_CREATE_BANKHUB_LINK
 * (the backend owns the Bank Hub credentials) and opens `hosted_link_url` with the SDK in modal mode.
 * The page using it must render `<BankHubSdkScript />` and pass its ready/error handlers.
 */
export const useBankHubIntegration = ({ dictionary, locale, sessiontoken, onBankAccountLinked }: Params) => {
  const [sdkStatus, setSdkStatus] = useState<BankHubSdkStatus>('loading')
  const [isCreatingLink, setIsCreatingLink] = useState(false)
  const [isBankHubOpen, setIsBankHubOpen] = useState(false)

  const instanceRef = useRef<BankHubInstance | null>(null)
  const pendingDisposeRef = useRef<Promise<void> | null>(null)

  // Synchronous guard: each call creates a single-use link token, so a fast double click must not
  // start two requests before `isCreatingLink` re-renders.
  const inFlightRef = useRef(false)
  const mountedRef = useRef(true)
  const onBankAccountLinkedRef = useRef(onBankAccountLinked)
  const connectRef = useRef<() => Promise<void>>(async () => {})
  const lastRequestRef = useRef<CreateBankHubLinkRequest | null>(null)

  const t = useCallback((key: string) => integrationsText(dictionary, key), [dictionary])

  useEffect(() => {
    onBankAccountLinkedRef.current = onBankAccountLinked
  }, [onBankAccountLinked])

  // Script already present (e.g. client-side navigation back to this page).
  useEffect(() => {
    if (getBankHubConstructor()) setSdkStatus('ready')
  }, [])

  const handleSdkReady = useCallback(() => {
    if (getBankHubConstructor()) {
      setSdkStatus('ready')

      return
    }

    logDevError('BankHub SDK loaded but window.BankHub is missing', undefined)
    setSdkStatus('error')
  }, [])

  const handleSdkError = useCallback((error: unknown) => {
    logDevError('Load BankHub SDK failed', error)
    setSdkStatus('error')
  }, [])

  /** Ends the current flow. Safe to call repeatedly: only the active instance is disposed. */
  const endFlow = useCallback((instance: BankHubInstance) => {
    if (instanceRef.current !== instance) return

    instanceRef.current = null
    setIsBankHubOpen(false)
    pendingDisposeRef.current = disposeBankHubInstance(instance).finally(() => {
      pendingDisposeRef.current = null
    })
  }, [])

  const handleExpired = useCallback((event: BankHubExpiredEvent) => {
    const messageKey = event?.event === 'BANKHUB_SESSION_EXPIRED'
      ? 'integrations_bankhub_session_expired'
      : 'integrations_bankhub_token_expired'

    // The expired link is never reused: "create new link" requests a fresh token from the backend.
    SwalAlert(
      'warning',
      t(messageKey),
      'center',
      true,
      true,
      true,
      () => void connectRef.current(),
      t('integrations_bankhub_create_new_link'),
      { cancelButtonText: t('integrations_bankhub_close') }
    )
  }, [t])

  const openSdk = useCallback(async (linkToken: BankHubLinkTokenData) => {
    if (pendingDisposeRef.current) await pendingDisposeRef.current

    let instance: BankHubInstance

    try {
      instance = createBankHubInstance({
        mode: 'modal',
        onOpen: event => {
          logDev('BankHub open', event)
          if (instanceRef.current === instance) setIsBankHubOpen(true)
        },
        onSuccess: event => {
          logDev('BankHub success', event)
          if (instanceRef.current !== instance) return

          // Close first: the SDK overlay (z-index 999999) would otherwise cover the notification.
          endFlow(instance)
          SwalAlert(
            'success',
            t(event?.event === 'FINISHED_BANK_ACCOUNT_UNLINK'
              ? 'integrations_bankhub_unlink_success'
              : 'integrations_bankhub_link_success'),
            'center'
          )
          onBankAccountLinkedRef.current?.(event)
        },
        // Hosted page "close" (BANKHUB_CLOSE_LINK) and the SDK's own X/backdrop (onClose): silent reset.
        onExit: event => {
          logDev('BankHub exit', event)
          endFlow(instance)
        },
        onClose: () => {
          logDev('BankHub close')
          endFlow(instance)
        },
        onExpired: event => {
          logDev('BankHub expired', event)
          if (instanceRef.current !== instance) return

          endFlow(instance)
          handleExpired(event)
        },
        onEvent: event => logDev('BankHub event', event)
      })
    } catch (error) {
      logDevError('Create BankHub instance failed', error)
      setSdkStatus('error')
      SwalAlert('error', t('integrations_bankhub_sdk_load_failed'), 'center')

      return
    }

    instanceRef.current = instance

    try {
      await instance.initLink(linkToken.hosted_link_url)
    } catch (error) {
      logDevError('BankHub initLink failed', error)
      endFlow(instance)
      SwalAlert('error', t('integrations_bankhub_open_failed'), 'center')

      return
    }

    try {
      await instance.open()
    } catch (error) {
      logDevError('BankHub open failed', error)
      endFlow(instance)
      SwalAlert('error', t('integrations_bankhub_open_failed'), 'center')
    }
  }, [endFlow, handleExpired, t])

  const connect = useCallback(async (fields: CreateBankHubLinkRequest) => {
    if (inFlightRef.current || instanceRef.current) return

    if (!fields.company_xid || !fields.provider) {
      SwalAlert('error', t('integrations_bankhub_link_failed'), 'center')

      return
    }

    if (sdkStatus === 'loading') return

    if (sdkStatus === 'error' || !getBankHubConstructor()) {
      SwalAlert('error', t('integrations_bankhub_sdk_load_failed'), 'center')

      return
    }

    inFlightRef.current = true
    lastRequestRef.current = fields
    setIsCreatingLink(true)

    try {
      let linkToken: BankHubLinkTokenData

      try {
        linkToken = await bankHubService.createLink({
          sessiontoken,
          language: locale as Locale,
          fields,
          fallbackMessage: t('integrations_bankhub_link_failed')
        })
      } catch (error) {
        logDevError('Create BankHub link failed', error)

        // SwalAlert renders the backend message plus the execution_id reference from WorkflowError.
        SwalAlert('error', error instanceof Error && error.message ? error : t('integrations_bankhub_link_failed'), 'center')

        return
      }

      // User left the page while the token was being created: do not open a modal on another screen.
      if (!mountedRef.current) return

      await openSdk(linkToken)
    } finally {
      inFlightRef.current = false
      if (mountedRef.current) setIsCreatingLink(false)
    }
  }, [locale, openSdk, sdkStatus, sessiontoken, t])

  // "Create new link" after expiry re-runs the last request (same company) with a fresh token.
  useEffect(() => {
    connectRef.current = async () => {
      if (lastRequestRef.current) await connect(lastRequestRef.current)
    }
  }, [connect])

  useEffect(() => {
    mountedRef.current = true

    return () => {
      mountedRef.current = false

      const instance = instanceRef.current

      instanceRef.current = null
      if (instance) void disposeBankHubInstance(instance)
    }
  }, [])

  return {
    sdkStatus,
    isSdkLoading: sdkStatus === 'loading',
    isCreatingLink,
    isBankHubOpen,
    connect,
    handleSdkReady,
    handleSdkError
  }
}
