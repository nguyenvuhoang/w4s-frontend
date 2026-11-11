/*
 * Types for the SePay Bank Hub JS SDK 1.0.0 (https://bankhub.sepay.vn/assets/sdk/1.0.0/bankhub.min.js),
 * written from the shipped bundle, not only from the docs:
 *  - The bundle is UMD and assigns the same class to both `window.Bankhub` and `window.BankHub`.
 *  - iframe messages are forwarded as the raw `MessageEvent.data` object, so every payload field is optional.
 *  - Modal `onOpen` receives `{ type: 'BANKHUB_OPEN' }` (not `{ event: ... }` as documented); newTab/newWindow
 *    send `{ mode }`.
 *  - The SDK's own close button / backdrop click call `close()` -> `onClose()` with no payload; `onExit`
 *    only fires when the hosted page posts `BANKHUB_CLOSE_LINK`.
 *  - `expired_type` is never read by the SDK; it is typed as optional and not relied on.
 */

export type BankHubMode = 'modal' | 'newTab' | 'newWindow' | 'redirect'

export type BankHubEventMetadata = {
  account_number?: string
  account_type?: 'individual' | 'enterprise' | (string & {})
}

type BankHubMessageBase = {
  metadata?: BankHubEventMetadata
  timestamp?: string
}

export type BankHubSuccessEvent = BankHubMessageBase & {
  event: 'FINISHED_BANK_ACCOUNT_LINK' | 'FINISHED_BANK_ACCOUNT_UNLINK'
}

export type BankHubExitEvent = BankHubMessageBase & {
  event: 'BANKHUB_CLOSE_LINK'
}

export type BankHubOpenEvent = {
  event?: 'BANKHUB_OPEN'
  type?: 'BANKHUB_OPEN'
  mode?: BankHubMode
  metadata?: BankHubEventMetadata
  timestamp?: string
}

export type BankHubExpiredEvent = BankHubMessageBase & {
  event: 'BANKHUB_TOKEN_EXPIRED' | 'BANKHUB_SESSION_EXPIRED'
  /** Shown in a docs example only; not confirmed at runtime. */
  expired_type?: string
}

/** Catch-all for `onEvent`: SDK lifecycle events (`{ type: 'OPEN' | 'CLOSE', ... }`) and unknown iframe messages. */
export type BankHubGenericEvent = {
  event?: string
  type?: string
  mode?: BankHubMode
  timestamp?: string
  [key: string]: unknown
}

export type BankHubConfig = {
  mode?: BankHubMode
  onSuccess?: (event: BankHubSuccessEvent) => void
  onExit?: (event: BankHubExitEvent) => void
  onOpen?: (event: BankHubOpenEvent) => void
  onClose?: () => void
  onExpired?: (event: BankHubExpiredEvent) => void
  onEvent?: (event: BankHubGenericEvent) => void
}

export interface BankHubInstance {
  /** Only stores the URL on the instance; resolves immediately. */
  initLink(hostedLinkUrl: string): Promise<void>
  /** Rejects when no hosted link was set. */
  open(options?: { mode?: BankHubMode; windowFeatures?: Record<string, string | number> }): Promise<unknown>
  close(): void
  /** Closes, removes the `#bankhub-modal` element and the message listener, clears the stored link. */
  destroy(): void
  configure(config: Partial<BankHubConfig>): void
  isModalOpen(): boolean
}

export type BankHubConstructor = new (config?: BankHubConfig) => BankHubInstance

declare global {
  interface Window {
    BankHub?: BankHubConstructor
    Bankhub?: BankHubConstructor
  }
}
