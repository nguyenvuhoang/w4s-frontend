'use client'

import { useState } from 'react'

import type { Locale } from '@/configs/i18n'
import type { ProvinceLookupItem } from '@/shared/services/provinceLookupService'
import type { getDictionary } from '@/shared/utils/getDictionary'
import { useRouter } from '@shared/hooks/useRouter'
import SwalAlert from '@shared/utils/SwalAlert'

import { ProjectLogoUploadError, propertyAggregateService } from '../../propertyAggregateService'
import type { ProjectDetailModel, ProjectUpdatePayload, PropertyStatus } from '../../types'
import { projectLogoUploadErrorMessage, useProjectLogoFile } from '../logo/useProjectLogoFile'
import {
  buildNewProjectBankAccountPayload,
  buildProjectBankAccountForm,
  buildProjectBankAccountUpdatePayload,
  hasProjectBankAccountFormValue,
  isProjectBankAccountDirty,
  isProjectBankAccountMissing,
  isProjectBankAccountPersisted,
  isProjectBankAccountUpdatable,
  PROJECT_BANK_ACCOUNT_GROUPS,
  validateProjectBankAccountForm,
  type ProjectBankAccount,
  type ProjectBankAccountFormState,
  type ProjectBankAccountGroup,
  type ProjectBankAccountUpdateField,
  type ProjectBankAccountUpdatePayload,
  type ProjectBankAccountUpdatePayloads
} from '../bank/projectBankTypes'
import { accountQrIdentity, parseVietQrQuickLinkSignature, type VietQrBank } from '../bank/vietqr'
import { toHandoverDateInput, toHandoverDatePayload } from '../projectDateHelpers'
import { useProjectBankQr } from './useProjectBankQr'
import { toProjectProvinceValue } from '../province/projectProvinceValue'

type Dictionary = Awaited<ReturnType<typeof getDictionary>>

export type ProjectEditFormState = {
  name: string
  project_code: string
  address: string
  description: string
  status: PropertyStatus
  investor: string
  /** Master province_code ('' = none / not resolved). */
  province: string
  /** Date input value (YYYY-MM-DD) or ''. */
  handover_date: string
}

export type ProjectEditErrorKey = keyof ProjectEditFormState

const text = (dictionary: Dictionary, key: string, fallback: string) => dictionary.projectManagement?.[key] ?? dictionary.propertyManagement?.[key] ?? fallback

/**
 * Initial form of the Edit page. `province` is the code of the resolved master row: a legacy name is
 * mapped to its code only on an exact match; an unresolved stored value starts empty (never a fallback
 * province) and is reported through `provinceUnresolved`.
 */
export const buildProjectEditForm = (project: ProjectDetailModel, province: ProvinceLookupItem | null): ProjectEditFormState => ({
  name: project.name,
  project_code: project.project_code,
  address: project.address ?? '',
  description: project.description ?? '',
  status: project.status,
  investor: project.investor ?? '',
  province: province ? toProjectProvinceValue(province) : '',
  handover_date: toHandoverDateInput(project.handover_date)
})

/**
 * WF_BO_UPDATE_PROJECT payload (`province` = province_code). `fields.id` is the Project ID; the bank account
 * objects (each with its own account id) are added only when given (accounts GET returned with an id).
 */
export const buildProjectUpdatePayload = (
  project: ProjectDetailModel,
  values: ProjectEditFormState,
  logo_url: string,
  bankAccounts: ProjectBankAccountUpdatePayloads = {}
): ProjectUpdatePayload => ({
  ...bankAccounts,
  id: project.id,
  project_code: values.project_code.trim(),
  name: values.name.trim(),
  address: values.address.trim(),
  description: values.description.trim(),
  logo_url,
  status: values.status,
  investor: values.investor.trim(),
  province: values.province.trim(),
  handover_date: toHandoverDatePayload(values.handover_date)
})

type BankGroupRecord<T> = Record<ProjectBankAccountGroup, T>

const bankAccountsOf = (project: ProjectDetailModel): BankGroupRecord<ProjectBankAccount | null> => ({
  operating_bank_account: project.operating_bank_account ?? null,
  deposit_bank_account: project.deposit_bank_account ?? null
})

/**
 * Bank objects for WF_BO_UPDATE_PROJECT:
 * - existing account (GET returned it with its id): always sent with its own id and current values (untouched
 *   fields unchanged), so editing only the project never drops the bank data;
 * - missing account left empty: never sent (no empty object);
 * - missing account the user filled: a new object without id (WF_BO_UPDATE_PROJECT creates it);
 * - account returned without id: never sent.
 */
export const buildProjectBankAccountsPayload = (
  accounts: BankGroupRecord<ProjectBankAccount | null>,
  values: BankGroupRecord<ProjectBankAccountFormState>
): ProjectBankAccountUpdatePayloads => {
  const payload: ProjectBankAccountUpdatePayloads = {}

  for (const { group } of PROJECT_BANK_ACCOUNT_GROUPS) {
    const account = accounts[group]

    if (isProjectBankAccountUpdatable(account)) payload[group] = buildProjectBankAccountUpdatePayload(account, values[group])
    else if (isProjectBankAccountMissing(account) && hasProjectBankAccountFormValue(values[group])) {
      payload[group] = buildNewProjectBankAccountPayload(values[group])
    }
  }

  return payload
}

/** Account after a successful UPDATE: the sent values become the new baseline (nulls tracked again). */
const toSavedBankAccount = (account: ProjectBankAccount, sent: ProjectBankAccountUpdatePayload): ProjectBankAccount => {
  const null_fields = (['bank_name', 'account_number', 'account_holder', 'transfer_content'] as const).filter(field => sent[field] === null)

  return {
    ...account,
    id: sent.id,
    bank_name: sent.bank_name ?? '',
    account_number: sent.account_number ?? '',
    account_holder: sent.account_holder ?? '',
    ...(sent.branch !== undefined ? { branch: sent.branch } : {}),
    ...(sent.qr_code_url !== undefined ? { qr_code_url: sent.qr_code_url } : {}),
    transfer_content: sent.transfer_content ?? '',
    null_fields: null_fields.length > 0 ? [...null_fields] : undefined
  }
}

/** Project section changed: any field differs from the last saved form (trimmed), or a new logo is chosen. */
export const isProjectEditFormDirty = (baseline: ProjectEditFormState, values: ProjectEditFormState, hasNewLogo: boolean) =>
  hasNewLogo || (Object.keys(baseline) as ProjectEditErrorKey[]).some(key => String(values[key]).trim() !== String(baseline[key]).trim())

export const useProjectEditForm = ({
  dictionary,
  locale,
  sessiontoken,
  project,
  initialProvince,
  detailHref,
  vietQrBanks = [],
  vietQrGenerateAvailable = false
}: {
  dictionary: Dictionary
  locale: Locale
  sessiontoken?: string
  project: ProjectDetailModel
  initialProvince: ProvinceLookupItem | null
  /** Project detail route (without locale): Cancel and a successful save go back there. */
  detailHref: string
  /** VietQR bank list (server-loaded): bank picker + BIN for the QR. */
  vietQrBanks?: VietQrBank[]
  /** Generate API configured server-side: "Use this QR" stores the generated image in MinIO. */
  vietQrGenerateAvailable?: boolean
}) => {
  const router = useRouter()
  const [values, setValues] = useState<ProjectEditFormState>(() => buildProjectEditForm(project, initialProvince))
  // Last saved state of the project section.
  const [projectBaseline, setProjectBaseline] = useState<ProjectEditFormState>(() => buildProjectEditForm(project, initialProvince))
  const [savedLogoUrl, setSavedLogoUrl] = useState(project.logo_url ?? '')
  const [errors, setErrors] = useState<Partial<Record<ProjectEditErrorKey, string>>>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [savingLabel, setSavingLabel] = useState<string | null>(null)
  const logo = useProjectLogoFile(dictionary)

  // A province is stored but matches no master row: the user must pick one (it is never sent as a name).
  const storedProvince = project.province?.trim() ?? ''
  const provinceUnresolved = Boolean(storedProvince) && !initialProvince && !values.province

  // Bank accounts of the project, saved with WF_BO_UPDATE_PROJECT (operating / deposit, each with its own id).
  const [bankBaselines, setBankBaselines] = useState<BankGroupRecord<ProjectBankAccount | null>>(() => bankAccountsOf(project))
  const [bankValues, setBankValues] = useState<BankGroupRecord<ProjectBankAccountFormState>>(() => ({
    operating_bank_account: buildProjectBankAccountForm(project.operating_bank_account),
    deposit_bank_account: buildProjectBankAccountForm(project.deposit_bank_account)
  }))
  const [bankErrors, setBankErrors] = useState<Partial<BankGroupRecord<Partial<Record<ProjectBankAccountUpdateField, string>>>>>({})
  // Shown after a save whose bank data could not be confirmed by re-reading the project.
  const [submitWarning, setSubmitWarning] = useState<string | null>(null)
  const dirtyBankGroups = PROJECT_BANK_ACCOUNT_GROUPS.map(({ group }) => group).filter(group => isProjectBankAccountDirty(bankBaselines[group], bankValues[group]))

  // VietQR per account (preview in UI state; "use" fills qr_code_url, saved with the project).
  const bankQr = useProjectBankQr({
    projectId: project.id,
    banks: vietQrBanks,
    values: bankValues,
    generateAvailable: vietQrGenerateAvailable,
    onApplied: (group, url) => updateBankValue(group, 'qr_code_url', url),
    messages: {
      previewFailed: text(dictionary, 'vietQrPreviewFailed', 'VietQR could not display the QR code. Please try again later.'),
      errors: {
        timeout: text(dictionary, 'vietQrErrorTimeout', 'VietQR did not answer in time. Please try again.'),
        vietqr: text(dictionary, 'vietQrErrorUpstream', 'VietQR could not create the QR code. Please try again later.'),
        storage: text(dictionary, 'vietQrErrorStorage', 'The QR image could not be stored. Please try again later.'),
        unauthorized: text(dictionary, 'vietQrErrorUnauthorized', 'Your session has expired. Please sign in again.'),
        invalid: text(dictionary, 'vietQrErrorInvalid', 'The bank, account number or account holder is not valid for VietQR.'),
        network: text(dictionary, 'vietQrErrorNetwork', 'Network error while creating the QR code.')
      }
    }
  })

  /**
   * The stored QR no longer matches the account: its known content (QR created in this session, or a VietQR
   * Quick Link URL) differs from the current account, or the account changed while the QR loaded from GET was
   * kept. Such a QR must be created again; it is never saved as a valid QR.
   */
  const isBankQrStale = (group: ProjectBankAccountGroup) => {
    const url = bankValues[group].qr_code_url.trim()

    if (!url) return false

    const current = accountQrIdentity(vietQrBanks, bankValues[group])
    const known = bankQr.appliedSignatures[url] ?? parseVietQrQuickLinkSignature(url)

    if (known) return known !== current

    const baseline = bankBaselines[group]

    return Boolean(baseline) && url === (baseline?.qr_code_url ?? '').trim() && accountQrIdentity(vietQrBanks, buildProjectBankAccountForm(baseline)) !== current
  }

  /** Clears the QR of one account (e.g. an outdated one); the account becomes dirty like any edit. */
  const clearBankQr = (group: ProjectBankAccountGroup) => updateBankValue(group, 'qr_code_url', '')

  const staleBankQr = Object.fromEntries(PROJECT_BANK_ACCOUNT_GROUPS.map(({ group }) => [group, isBankQrStale(group)])) as BankGroupRecord<boolean>

  // The bank accounts are part of WF_BO_UPDATE_PROJECT: a bank change makes the project section dirty.
  const projectDirty = isProjectEditFormDirty(projectBaseline, values, Boolean(logo.file)) || dirtyBankGroups.length > 0

  const updateValue = <K extends ProjectEditErrorKey>(key: K, value: ProjectEditFormState[K]) => {
    setSubmitError(null)
    setValues(current => ({ ...current, [key]: value }))
    setErrors(current => ({ ...current, [key]: undefined }))
  }

  /**
   * Edits an existing account (returned with its id) or a missing one (null: empty, editable inputs). Only an
   * account returned WITHOUT id stays read-only (it cannot be targeted by an update).
   */
  const updateBankValue = (group: ProjectBankAccountGroup, field: ProjectBankAccountUpdateField, value: string) => {
    const account = bankBaselines[group]

    if (!isProjectBankAccountUpdatable(account) && !isProjectBankAccountMissing(account)) return

    setSubmitError(null)
    setBankValues(current => ({ ...current, [group]: { ...current[group], [field]: value } }))
    setBankErrors(current => ({ ...current, [group]: { ...current[group], [field]: undefined } }))
  }

  /** Validates only the accounts the user changed (untouched backend values never block a project save). */
  const validateBankAccounts = () => {
    const messages = {
      required: text(dictionary, 'bankFieldRequired', 'This field is required.'),
      invalidUrl: text(dictionary, 'bankQrCodeUrlInvalid', 'QR code URL must be a valid http(s) URL.')
    }
    const outdatedQr = text(dictionary, 'bankQrOutdated', 'The QR code no longer matches this account. Re-create the VietQR and use the new one (or remove the QR).')
    const nextErrors = Object.fromEntries(dirtyBankGroups.map(group => {
      const groupErrors = validateProjectBankAccountForm(bankValues[group], messages)

      return [group, staleBankQr[group] && !groupErrors.qr_code_url ? { ...groupErrors, qr_code_url: outdatedQr } : groupErrors]
    }))

    setBankErrors(nextErrors)

    return Object.values(nextErrors).every(groupErrors => Object.keys(groupErrors).length === 0)
  }

  const validate = () => {
    const bankValid = validateBankAccounts()
    const nextErrors: Partial<Record<ProjectEditErrorKey, string>> = {}

    if (!values.name.trim()) nextErrors.name = text(dictionary, 'projectNameRequired', 'Project Name is required.')
    if (!values.project_code.trim()) nextErrors.project_code = text(dictionary, 'projectCodeRequired', 'Project Code is required.')
    if (provinceUnresolved) nextErrors.province = text(dictionary, 'provinceUnresolvedRequired', 'Please select the Province/City again.')

    setErrors(nextErrors)

    return Object.keys(nextErrors).length === 0 && bankValid
  }

  const backToDetail = () => router.push(`/${locale}${detailHref}`)

  const finishWithSuccess = (message: string) => {
    SwalAlert('success', message, 'center')
    router.push(`/${locale}${detailHref}`)
    router.refresh()
  }

  /** "Save changes": only WF_BO_UPDATE_PROJECT (project fields + the two bank account objects). */
  const submit = async () => {
    setSubmitError(null)
    setSubmitWarning(null)

    if (!projectDirty) {
      SwalAlert('info', text(dictionary, 'noChangesToSave', 'There are no changes to save.'), 'center')

      return
    }

    // Validate before calling any workflow.
    if (!validate()) return

    setSaving(true)

    try {
      let logo_url = savedLogoUrl

      if (logo.file) {
        setSavingLabel(text(dictionary, 'logoUploading', 'Uploading logo...'))
        logo_url = await propertyAggregateService.upload_project_logo({ projectId: project.id, file: logo.file })
      }

      setSavingLabel(text(dictionary, 'updatingProject', 'Updating project...'))

      const bankPayload = buildProjectBankAccountsPayload(bankBaselines, bankValues)

      await propertyAggregateService.update_project_detail({
        sessiontoken,
        language: locale,
        payload: buildProjectUpdatePayload(project, values, logo_url, bankPayload)
      })

      setProjectBaseline(values)
      setSavedLogoUrl(logo_url)
      logo.clear()

      const sentGroups = PROJECT_BANK_ACCOUNT_GROUPS.map(({ group }) => group).filter(group => bankPayload[group])

      if (sentGroups.length === 0) {
        finishWithSuccess(text(dictionary, 'updateProjectSuccess', 'Project updated successfully.'))

        return
      }

      // Re-read WF_BO_GET_PROJECT_DETAIL: success is announced only when the bank accounts were really stored.
      setSavingLabel(text(dictionary, 'bankAccountsVerifying', 'Checking the saved bank information...'))

      let fresh: ProjectDetailModel | null = null

      try {
        fresh = await propertyAggregateService.get_project_detail({ sessiontoken, language: locale, project_id: project.id })
      } catch {
        fresh = null
      }

      // Accounts sent but not found as sent in the re-read project (e.g. a new account Backend did not create).
      const notPersisted = fresh ? sentGroups.filter(group => !isProjectBankAccountPersisted(bankPayload[group]!, fresh?.[group])) : sentGroups

      if (fresh && notPersisted.length === 0) {
        finishWithSuccess(text(dictionary, 'updateProjectSuccess', 'Project updated successfully.'))

        return
      }

      // Project saved, bank data not confirmed: stay on the page, keep the typed bank values, re-baseline on what
      // the system really holds (when it could be read) so the unsaved accounts stay dirty.
      if (fresh) {
        const freshProject = fresh

        setBankBaselines({
          operating_bank_account: freshProject.operating_bank_account ?? null,
          deposit_bank_account: freshProject.deposit_bank_account ?? null
        })
      } else {
        setBankBaselines(current => {
          const next = { ...current }

          for (const group of sentGroups) {
            const account = current[group]

            if (account) next[group] = toSavedBankAccount(account, bankPayload[group]!)
          }

          return next
        })
      }

      if (fresh) {
        // Real outcome, never a fake success: name the accounts the system did not store.
        const names = PROJECT_BANK_ACCOUNT_GROUPS
          .filter(({ group }) => notPersisted.includes(group))
          .map(({ titleKey, titleFallback }) => text(dictionary, titleKey, titleFallback))
          .join(', ')

        setSubmitError(`${text(dictionary, 'bankAccountsNotPersisted', 'The project was saved, but the system did not store these bank accounts')}: ${names}.`)
      } else {
        setSubmitWarning(text(dictionary, 'bankAccountsVerifyFailed', 'The project was saved, but the bank account information could not be checked again. Please reload the page to verify it.'))
      }
    } catch (err) {
      // Errors stay on the edit page (typed values kept).
      setSubmitError(err instanceof ProjectLogoUploadError
        ? projectLogoUploadErrorMessage(dictionary, err)
        : err instanceof Error ? err.message : text(dictionary, 'updateProjectFailed', 'Unable to update project.'))
    } finally {
      setSaving(false)
      setSavingLabel(null)
    }
  }

  return {
    values,
    errors,
    submitError,
    submitWarning,
    saving,
    savingLabel,
    logo,
    currentLogoUrl: savedLogoUrl,
    provinceUnresolved,
    storedProvince,
    projectDirty,
    bank: {
      accounts: bankBaselines,
      values: bankValues,
      errors: bankErrors,
      dirtyGroups: dirtyBankGroups,
      qr: { ...bankQr, stale: staleBankQr, clear: clearBankQr },
      updateValue: updateBankValue
    },
    updateValue,
    submit,
    backToDetail
  }
}
