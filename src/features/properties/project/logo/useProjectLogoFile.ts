'use client'

import { useEffect, useRef, useState } from 'react'

import type { ProjectLogoUploadError } from '../../propertyAggregateService'
import { projectText } from '../projectListHelpers'
import type { ProjectDictionary } from '../projectListHelpers'
import { getProjectLogoMaxSizeMb, PROJECT_LOGO_FORMATS_LABEL, validateProjectLogoFile } from './projectLogoRules'

export const projectLogoText = (dictionary: ProjectDictionary, key: string, fallback: string) => (
  projectText(dictionary, key, fallback)
    .replace('{formats}', PROJECT_LOGO_FORMATS_LABEL)
    .replace('{maxSize}', String(getProjectLogoMaxSizeMb()))
)

/**
 * User-facing message of a failed logo upload (presign or storage PUT). The reason only says where it
 * failed; a network failure is not assumed to be any specific cause (CORS, offline, DNS...).
 */
export const projectLogoUploadErrorMessage = (dictionary: ProjectDictionary, error: ProjectLogoUploadError) => {
  const prefix = projectText(dictionary, 'logoUploadFailed', 'Image upload failed.')

  if (error.reason === 'network') {
    return `${prefix} ${projectText(dictionary, 'logoUploadNetworkError', 'Could not connect to the image storage server. Check your connection and try again; if it persists, contact your system administrator.')}`
  }

  if (error.reason === 'storage') {
    return `${prefix} ${projectText(dictionary, 'logoUploadStorageError', 'The image storage server rejected the upload (code {status}). Try again or contact your system administrator.')
      .replace('{status}', String(error.status ?? '-'))}`
  }

  return `${prefix} ${error.message || projectText(dictionary, 'logoUploadPrepareError', 'Unable to prepare the upload. Please try again.')}`
}

type SelectedLogo = { file: File; previewUrl: string } | null

/**
 * Locally selected (not yet uploaded) project logo, shared by Create and Edit. The file is only
 * uploaded on submit, so picking image A then B uploads just B, and the preview object URL is only
 * used for display — never as logo_url.
 */
export function useProjectLogoFile(dictionary: ProjectDictionary) {
  const [selected, setSelected] = useState<SelectedLogo>(null)
  const [error, setError] = useState<string | null>(null)
  const previewUrlRef = useRef<string | null>(null)

  const replaceSelected = (next: SelectedLogo) => {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current)
    previewUrlRef.current = next?.previewUrl ?? null
    setSelected(next)
  }

  useEffect(() => () => {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current)
  }, [])

  const select = (next: File | null) => {
    setError(null)

    if (!next) {
      replaceSelected(null)

      return
    }

    const validation_error = validateProjectLogoFile(next)

    if (validation_error === 'type') {
      setError(projectLogoText(dictionary, 'logoInvalidType', 'Unsupported file format. Supported formats: {formats}.'))

      return
    }

    if (validation_error === 'size') {
      setError(projectLogoText(dictionary, 'logoMaxSize', 'File exceeds the maximum size of {maxSize} MB.'))

      return
    }

    replaceSelected({ file: next, previewUrl: URL.createObjectURL(next) })
  }

  const clear = () => {
    replaceSelected(null)
    setError(null)
  }

  return { file: selected?.file ?? null, previewUrl: selected?.previewUrl ?? null, error, select, clear }
}
