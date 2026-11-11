// Single source of the project logo upload rules. Used by the MinIO presign route
// (/api/projects/logo/presign-upload) and by the Create/Edit project forms, so the limit shown to the
// user, the client-side check and the server-side check can never drift apart.
export const PROJECT_LOGO_MAX_SIZE_BYTES = 5 * 1024 * 1024
export const PROJECT_LOGO_ALLOWED_CONTENT_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
export const PROJECT_LOGO_ALLOWED_EXTENSIONS = ['png', 'jpg', 'jpeg', 'webp']
export const PROJECT_LOGO_ACCEPT = PROJECT_LOGO_ALLOWED_CONTENT_TYPES.join(',')
export const PROJECT_LOGO_FORMATS_LABEL = 'JPG, JPEG, PNG, WEBP'

export type ProjectLogoValidationError = 'type' | 'size'

export const getProjectLogoMaxSizeMb = () => PROJECT_LOGO_MAX_SIZE_BYTES / (1024 * 1024)

export const validateProjectLogoFile = (file: { name: string; type: string; size: number }): ProjectLogoValidationError | null => {
  const extension = file.name.split('.').pop()?.toLowerCase() ?? ''

  if (!PROJECT_LOGO_ALLOWED_EXTENSIONS.includes(extension)) return 'type'
  if (file.type && !PROJECT_LOGO_ALLOWED_CONTENT_TYPES.includes(file.type)) return 'type'
  if (file.size > PROJECT_LOGO_MAX_SIZE_BYTES) return 'size'

  return null
}
