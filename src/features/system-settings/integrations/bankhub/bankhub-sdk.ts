import type { BankHubConfig, BankHubConstructor, BankHubInstance } from './bankhub-sdk.types'

export const BANKHUB_SDK_SRC = 'https://bankhub.sepay.vn/assets/sdk/1.0.0/bankhub.min.js'
export const BANKHUB_SDK_SCRIPT_ID = 'sepay-bankhub-sdk'

/**
 * SDK `close()` hides the modal and then touches `this.modalEl` in a 300ms timeout. `destroy()` nulls
 * `modalEl`, so destroying within that window throws inside the SDK. Destroy is deferred past it.
 */
const SDK_CLOSE_ANIMATION_MS = 300
const DESTROY_DELAY_MS = SDK_CLOSE_ANIMATION_MS + 50

export class BankHubSdkUnavailableError extends Error {
  constructor() {
    super('SePay Bank Hub SDK is not available on window.')
    this.name = 'BankHubSdkUnavailableError'
  }
}

export const getBankHubConstructor = (): BankHubConstructor | undefined => {
  if (typeof window === 'undefined') return undefined

  return window.BankHub ?? window.Bankhub
}

/** The SDK appends its `#bankhub-modal` element to `document.body` in the constructor. */
export const createBankHubInstance = (config: BankHubConfig): BankHubInstance => {
  const BankHub = getBankHubConstructor()

  if (typeof BankHub !== 'function') {
    throw new BankHubSdkUnavailableError()
  }

  return new BankHub({ mode: 'modal', ...config })
}

/** Closes immediately, destroys after the SDK close animation. Resolves once destroyed. */
export const disposeBankHubInstance = (instance: BankHubInstance): Promise<void> => {
  try {
    instance.close()
  } catch {
    // Ignore: destroy below still removes the modal and listener.
  }

  return new Promise(resolve => {
    window.setTimeout(() => {
      try {
        instance.destroy()
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Destroy BankHub instance failed', error)
        }
      }

      resolve()
    }, DESTROY_DELAY_MS)
  })
}
