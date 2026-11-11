'use client'

import { useState } from 'react'

import { ProjectBankQrError, projectBankQrService } from '../bank/projectBankQrService'
import type { ProjectBankAccountFormState, ProjectBankAccountGroup } from '../bank/projectBankTypes'
import {
  buildVietQrInput,
  buildVietQrQuickLink,
  findVietQrBank,
  parseVietQrQuickLinkSignature,
  vietQrSignature,
  type VietQrBank,
  type VietQrInputResult
} from '../bank/vietqr'

export type ProjectBankQrPreview = {
  url: string
  signature: string
  placeholderSkipped: boolean
  /** Image is loading from VietQR (buttons disabled meanwhile). */
  loading: boolean
}

type GroupRecord<T> = Partial<Record<ProjectBankAccountGroup, T>>

/**
 * VietQR of the two project accounts (independent per group):
 * - preview: Quick Link image built on the client from validated input (no credentials, nothing saved);
 * - apply ("Use this QR"): fills `qr_code_url` with the Quick Link URL, or (Generate API configured) with the
 *   MinIO URL of the generated image; saved only with "Save changes". The signature of every applied URL is
 *   kept so a QR that no longer matches the account is detected.
 */
export function useProjectBankQr({
  projectId,
  banks,
  values,
  generateAvailable = false,
  onApplied,
  messages
}: {
  projectId: number
  banks: VietQrBank[]
  values: Record<ProjectBankAccountGroup, ProjectBankAccountFormState>
  /** The server has VietQR Generate API credentials: the QR is generated (Base64) and stored in MinIO. */
  generateAvailable?: boolean
  onApplied: (group: ProjectBankAccountGroup, url: string) => void
  messages: { previewFailed: string; errors: Record<ProjectBankQrError['code'], string> }
}) {
  const [previews, setPreviews] = useState<GroupRecord<ProjectBankQrPreview>>({})
  const [applying, setApplying] = useState<GroupRecord<boolean>>({})
  const [errors, setErrors] = useState<GroupRecord<string>>({})
  // URL -> signature of the QR content, for QR images created in this session.
  const [appliedSignatures, setAppliedSignatures] = useState<Record<string, string>>({})

  const bankOf = (group: ProjectBankAccountGroup) => findVietQrBank(banks, values[group].bank_name)

  const inputOf = (group: ProjectBankAccountGroup): VietQrInputResult => buildVietQrInput(bankOf(group), values[group])

  const currentSignature = (group: ProjectBankAccountGroup) => {
    const result = inputOf(group)

    return result.ok ? vietQrSignature(result.input) : null
  }

  /** "Create VietQR": preview only (UI state), never written to the form or the project. */
  const preview = (group: ProjectBankAccountGroup) => {
    const result = inputOf(group)

    setErrors(current => ({ ...current, [group]: undefined }))
    if (!result.ok) return

    setPreviews(current => ({
      ...current,
      [group]: { url: buildVietQrQuickLink(result.input), signature: vietQrSignature(result.input), placeholderSkipped: result.placeholderSkipped, loading: true }
    }))
  }

  const previewLoaded = (group: ProjectBankAccountGroup) =>
    setPreviews(current => (current[group] ? { ...current, [group]: { ...current[group]!, loading: false } } : current))

  /** VietQR image error / timeout: the preview is dropped and an error is shown in the card. */
  const previewFailed = (group: ProjectBankAccountGroup) => {
    setPreviews(current => ({ ...current, [group]: undefined }))
    setErrors(current => ({ ...current, [group]: messages.previewFailed }))
  }

  /**
   * "Use this QR": fills `qr_code_url` of this account only (the form becomes dirty; nothing is saved until
   * "Save changes" — WF_BO_UPDATE_PROJECT is never called here).
   * - Quick Link (default): the previewed VietQR URL itself, once checked against the current account.
   * - Generate API (server credentials configured): the BFF creates the Base64 QR, uploads it to MinIO and
   *   returns the stored image URL.
   * A failure keeps the preview, shows the error and leaves `qr_code_url` unchanged.
   */
  const apply = async (group: ProjectBankAccountGroup) => {
    const result = inputOf(group)
    const bank = bankOf(group)
    const current = previews[group]

    if (!result.ok || !bank || applying[group]) return

    const signature = vietQrSignature(result.input)

    setErrors(state => ({ ...state, [group]: undefined }))

    if (!generateAvailable) {
      // Only a preview built from the current account is used (never an outdated one, never an arbitrary URL).
      const url = current?.signature === signature ? current.url : buildVietQrQuickLink(result.input)

      if (parseVietQrQuickLinkSignature(url) !== signature) {
        setErrors(state => ({ ...state, [group]: messages.errors.invalid }))

        return
      }

      setAppliedSignatures(state => ({ ...state, [url]: signature }))
      onApplied(group, url)

      return
    }

    setApplying(state => ({ ...state, [group]: true }))

    try {
      const url = await projectBankQrService.createStoredQr({ projectId, group, bin: bank.bin, values: values[group] })

      setAppliedSignatures(state => ({ ...state, [url]: signature }))
      onApplied(group, url)
    } catch (error) {
      const code = error instanceof ProjectBankQrError ? error.code : 'vietqr'

      setErrors(current => ({ ...current, [group]: messages.errors[code] }))
    } finally {
      setApplying(current => ({ ...current, [group]: false }))
    }
  }

  return {
    generateAvailable,
    bankOf,
    inputOf,
    currentSignature,
    previews,
    applying,
    errors,
    appliedSignatures,
    preview,
    previewLoaded,
    previewFailed,
    apply
  }
}

/** QR state given to the bank section (hook result + outdated flag of each stored QR). */
export type ProjectBankQrState = ReturnType<typeof useProjectBankQr> & {
  stale: Record<ProjectBankAccountGroup, boolean>
  /** Clears qr_code_url of one account (marks the form dirty). */
  clear: (group: ProjectBankAccountGroup) => void
}
