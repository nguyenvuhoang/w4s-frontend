import type { Locale } from '@/configs/i18n'
import { provinceLookupService, type ProvinceLookupItem } from '@/shared/services/provinceLookupService'

/**
 * Value of `province` in the Project contract (WF_BO_CREATE_PROJECT / WF_BO_UPDATE_PROJECT, read back by
 * WF_BO_GET_PROJECT_DETAIL): the master `province_code` of WF_BO_SIMPLE_SEARCH_PROVINCES. The name is
 * only the dropdown label, never the value sent.
 */
export const toProjectProvinceValue = (province: Pick<ProvinceLookupItem, 'province_code'>) => province.province_code

const normalize = (value: string) => value.trim().toLocaleLowerCase('vi')

/**
 * Whether a master province is the one a Project stores in `province`: by code, or (legacy records saved
 * before the code switch) by an exact Vietnamese / English name. Exact only: never a fuzzy guess, and
 * never derived from the address.
 */
export const matchesStoredProvince = (province: ProvinceLookupItem, stored: string) => {
  const target = normalize(stored)

  if (!target) return false

  return [province.province_code, province.province_name, province.m_province_name]
    .some(candidate => Boolean(candidate) && normalize(candidate) === target)
}

const RESOLVE_PAGE_SIZE = 100
const RESOLVE_MAX_PAGES = 5

/**
 * Resolves the stored Project `province` (code, or legacy name) to its master row, or null when nothing
 * matches exactly (then the caller shows it as unresolved; no fallback province is ever picked).
 * Tries the server-side search first, then scans the (small) master in case search_text ignores codes.
 */
export const resolveProjectProvince = async ({
  sessiontoken,
  language,
  value
}: {
  sessiontoken?: string
  language?: Locale | string
  value?: string | null
}): Promise<ProvinceLookupItem | null> => {
  const stored = value?.trim() ?? ''

  if (!stored || !sessiontoken) return null

  const searched = await provinceLookupService.searchProvinces({
    sessiontoken,
    language,
    filter: { search_text: stored, page_index: 0, page_size: RESOLVE_PAGE_SIZE }
  })
  const direct = searched.items.find(item => matchesStoredProvince(item, stored))

  if (direct) return direct

  for (let page_index = 0; page_index < RESOLVE_MAX_PAGES; page_index += 1) {
    const page = await provinceLookupService.searchProvinces({
      sessiontoken,
      language,
      filter: { search_text: '', page_index, page_size: RESOLVE_PAGE_SIZE }
    })
    const match = page.items.find(item => matchesStoredProvince(item, stored))

    if (match) return match
    if (page.items.length === 0 || (!page.has_next_page && (page_index + 1) * RESOLVE_PAGE_SIZE >= page.total_count)) break
  }

  return null
}
