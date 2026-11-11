import type { Locale } from '@/configs/i18n'
import type { CodeListItem } from '@/shared/types/codeList'
import {
  createRequestId,
  fingerprintPayload,
  isRequestTraceEnabled,
  recordRequestTrace,
  resolveCaller,
  type RequestTraceCache
} from '@/shared/utils/requestTrace'

const CODE_LIST_GET_BY_GROUP_AND_NAME_PATH = '/api/code-lists/get-by-group-and-name'

/**
 * Code lists are reference data (not user- or project-scoped: the BFF route sends neither scope
 * nor project), so a short client-side TTL cache is safe. Partitioned by code_group + code_name +
 * language. Only successful responses are cached; failures are always retried. The cache lives in
 * memory only and is dropped on logout (full page reload) or explicitly via invalidate().
 */
export const CODE_LIST_CACHE_TTL_MS = 5 * 60 * 1000

type CacheEntry = { expiresAt: number; items: CodeListItem[] }

const resolvedCache = new Map<string, CacheEntry>()
const pendingRequests = new Map<string, Promise<CodeListItem[]>>()

const buildCacheKey = (code_group: string, code_name: string, language?: string) =>
  `${code_group.trim().toUpperCase()}|${code_name.trim().toUpperCase()}|${language ?? ''}`

const cloneItems = (items: CodeListItem[]) => items.map(item => ({ ...item }))

type JsonRecord = Record<string, unknown>

const isRecord = (value: unknown): value is JsonRecord => (
  typeof value === 'object' && value !== null && !Array.isArray(value)
)

const toNumber = (value: unknown, fallback: number) => {
  const parsed = Number(value)

  return Number.isFinite(parsed) ? parsed : fallback
}

const toBoolean = (value: unknown): boolean => (
  value === true || value === 1 || value === '1' || value === 'true' || value === 'T' || value === 'Y'
)

const toNullableString = (value: unknown): string | null => (
  typeof value === 'string' && value.trim() ? value : null
)

const getField = (item: JsonRecord, keys: string[]) => {
  for (const key of keys) {
    const value = item[key]

    if (value !== undefined && value !== null) return value
  }

  return undefined
}

const getStringField = (source: unknown, keys: string[]) => {
  if (!isRecord(source)) return ''

  for (const key of keys) {
    const value = source[key]

    if (typeof value === 'string' && value.trim()) return value.trim()
  }

  return ''
}

const getDataRoot = (payload: unknown) => {
  if (!isRecord(payload)) return {}
  const data = isRecord(payload.data) ? payload.data : payload

  return isRecord(data.data) ? data.data : data
}

const mapCodeListItem = (value: unknown): CodeListItem => {
  const item = isRecord(value) ? value : {}

  return {
    id: toNumber(getField(item, ['id']), 0),
    code_id: String(getField(item, ['code_id', 'codeId']) ?? ''),
    code_name: String(getField(item, ['code_name', 'codeName']) ?? ''),
    caption: toNullableString(getField(item, ['caption'])),
    m_caption: toNullableString(getField(item, ['m_caption', 'mCaption'])),
    code_group: String(getField(item, ['code_group', 'codeGroup']) ?? ''),
    code_index: toNumber(getField(item, ['code_index', 'codeIndex']), 0),
    code_value: toNullableString(getField(item, ['code_value', 'codeValue'])),
    visible: toBoolean(getField(item, ['visible']))
  }
}

export class CodeListApiError extends Error {
  executionId?: string

  constructor(message: string, executionId?: string) {
    super(message)
    this.name = 'CodeListApiError'
    this.executionId = executionId
  }
}

const fetchCodeList = async ({
  code_name,
  code_group,
  language,
  requestId
}: {
  code_name: string
  code_group: string
  language?: Locale | string
  requestId?: string
}): Promise<CodeListItem[]> => {
  const query = language ? `?lang=${language}` : ''

  const response = await fetch(`${CODE_LIST_GET_BY_GROUP_AND_NAME_PATH}${query}`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(requestId ? { 'x-request-id': requestId } : {})
    },
    body: JSON.stringify({ code_name, code_group })
  })

  const json = await response.json().catch(() => ({})) as unknown

  if (!response.ok || (isRecord(json) && json.success === false)) {
    throw new CodeListApiError(
      getStringField(json, ['error_message', 'description', 'message']) || 'Unable to load code list.',
      getStringField(json, ['execution_id', 'executionId', 'execute_id'])
    )
  }

  const root = getDataRoot(json)
  const itemsSource = Array.isArray(root) ? root : Array.isArray(root.items) ? root.items : []

  return itemsSource.map(mapCodeListItem)
}

export const codeListService = {
  getByGroupAndName: async ({
    code_name,
    code_group,
    language,
    force = false
  }: {
    code_name: string
    code_group: string
    language?: Locale | string
    /** Bypass the TTL cache (still joins an identical in-flight request). */
    force?: boolean
  }): Promise<CodeListItem[]> => {
    const key = buildCacheKey(code_group, code_name, language)
    const traceEnabled = isRequestTraceEnabled()
    const requestId = traceEnabled ? createRequestId() : undefined
    const startedAt = Date.now()
    const caller = traceEnabled ? resolveCaller() : ''

    const trace = (cache: RequestTraceCache, status: number | 'error') => {
      if (!traceEnabled || !requestId) return

      recordRequestTrace({
        requestId,
        target: `${CODE_LIST_GET_BY_GROUP_AND_NAME_PATH} ${code_group}/${code_name}`,
        startedAt,
        durationMs: Date.now() - startedAt,
        caller,
        fingerprint: fingerprintPayload(key),
        cache,
        status
      })
    }

    const cached = resolvedCache.get(key)

    if (!force && cached && cached.expiresAt > Date.now()) {
      trace('hit', 200)

      return cloneItems(cached.items)
    }

    const pending = pendingRequests.get(key)

    if (pending) {
      return pending.then(
        items => {
          trace('inflight', 200)

          return cloneItems(items)
        },
        error => {
          trace('inflight', 'error')
          throw error
        }
      )
    }

    const request = fetchCodeList({ code_name, code_group, language, requestId })

    pendingRequests.set(key, request)

    try {
      const items = await request

      resolvedCache.set(key, { expiresAt: Date.now() + CODE_LIST_CACHE_TTL_MS, items })
      trace('miss', 200)

      return cloneItems(items)
    } catch (error) {
      trace('miss', 'error')
      throw error
    } finally {
      if (pendingRequests.get(key) === request) pendingRequests.delete(key)
    }
  },

  /** Drop cached code lists (all, or one group/name across languages). */
  invalidate: ({ code_group, code_name }: { code_group?: string; code_name?: string } = {}) => {
    if (!code_group || !code_name) {
      resolvedCache.clear()

      return
    }

    const prefix = `${code_group.trim().toUpperCase()}|${code_name.trim().toUpperCase()}|`

    Array.from(resolvedCache.keys()).forEach(key => {
      if (key.startsWith(prefix)) resolvedCache.delete(key)
    })
  }
}
