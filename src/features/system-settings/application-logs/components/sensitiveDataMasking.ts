const SENSITIVE_KEYS = [
  'token',
  'access_token',
  'refresh_token',
  'authorization',
  'uid',
  'password',
  'otp',
  'secret',
  'api_key',
  'apikey',
  'private_key'
]

const JWT_PATTERN = /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/
const LONG_TOKEN_PATTERN = /^[A-Za-z0-9+/=_-]{48,}$/
const JWT_GLOBAL_PATTERN = /\b[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g
const BEARER_TOKEN_PATTERN = /\bBearer\s+[A-Za-z0-9._~+/=-]+/gi
// The optional quote after the key also covers JSON-like text (`"password":"x"`), e.g. malformed payloads.
const SENSITIVE_TEXT_VALUE_PATTERN = /((?:token|access_token|refresh_token|authorization|uid|password|otp|secret|api[_-]?key|apikey|private[_-]?key)["']?\s*[:=]\s*["']?)([^"',\s}&]+)/gi

const isSensitiveKey = (key: string) => {
  const normalized = key.toLowerCase().replace(/[\s-]/g, '_')

  return SENSITIVE_KEYS.some(sensitiveKey => normalized.includes(sensitiveKey))
}

const maskTokenLikeValue = (value: string) => {
  const trimmed = value.trim()
  const bearerMatch = trimmed.match(/^Bearer\s+(.+)$/i)

  if (bearerMatch?.[1]) {
    const token = bearerMatch[1]

    return `Bearer ${token.slice(0, 8)}...${token.slice(-4)}`
  }

  if (JWT_PATTERN.test(trimmed) || LONG_TOKEN_PATTERN.test(trimmed)) {
    return `${trimmed.slice(0, 8)}...${trimmed.slice(-4)}`
  }

  return value
    .replace(BEARER_TOKEN_PATTERN, match => `Bearer ${match.slice(7, 15)}...${match.slice(-4)}`)
    .replace(JWT_GLOBAL_PATTERN, match => `${match.slice(0, 8)}...${match.slice(-4)}`)
    .replace(SENSITIVE_TEXT_VALUE_PATTERN, '$1<masked>')
}

const toJsonEditorValue = (value: unknown): object => {
  if (Array.isArray(value)) return value
  if (value && typeof value === 'object') return value as object

  return { value }
}

export const maskSensitiveValue = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(maskSensitiveValue)

  if (value && typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>).reduce<Record<string, unknown>>((masked, [key, entryValue]) => {
      masked[key] = isSensitiveKey(key) ? maskShortValue(entryValue) : maskSensitiveValue(entryValue)

      return masked
    }, {})
  }

  if (typeof value === 'string') return maskTokenLikeValue(value)

  return value
}

const maskShortValue = (value: unknown): unknown => {
  if (typeof value !== 'string' || !value) return value === '' ? value : '<masked>'

  return value.length > 12 ? `${value.slice(0, 8)}...${value.slice(-4)}` : '<masked>'
}

export const parseAndMaskJsonEditorValue = (value: unknown): object => {
  if (value === null || value === undefined || value === '') return { value: '-' }

  if (typeof value === 'string') {
    try {
      return toJsonEditorValue(maskSensitiveValue(JSON.parse(value)))
    } catch {
      return { value: maskSensitiveValue(value) }
    }
  }

  return toJsonEditorValue(maskSensitiveValue(value))
}

export const maskSensitiveText = (value: string): string => maskTokenLikeValue(value)
