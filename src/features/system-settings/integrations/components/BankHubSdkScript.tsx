'use client'

import Script from 'next/script'

import { BANKHUB_SDK_SCRIPT_ID, BANKHUB_SDK_SRC } from '../bankhub/bankhub-sdk'

type Props = {
  onReady: () => void
  onError: (error: unknown) => void
}

/** Loaded once per document (next/script dedupes by id); onReady also fires when re-mounted after it is cached. */
const BankHubSdkScript = ({ onReady, onError }: Props) => (
  <Script id={BANKHUB_SDK_SCRIPT_ID} src={BANKHUB_SDK_SRC} strategy="afterInteractive" onReady={onReady} onError={onError} />
)

export default BankHubSdkScript
