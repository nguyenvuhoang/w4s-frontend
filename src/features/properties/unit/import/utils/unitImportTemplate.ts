import type { UnitImportTemplateFile } from '../services/unitImportService'

/**
 * Saves the template file returned by the Backend (bytes, type and name unchanged) through a temporary
 * object URL. The template itself is never generated on the FE.
 */
export function saveUnitImportTemplate({ blob, filename }: UnitImportTemplateFile): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
