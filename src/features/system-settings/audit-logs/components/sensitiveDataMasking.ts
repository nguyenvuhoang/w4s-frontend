import { prepareJsonViewerContent } from '@/shared/components/json-view-editor/jsonViewerContent'

const SENSITIVE_KEYS = [
  'token',
  'access_token',
  'refresh_token',
  'authorization',
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
const SENSITIVE_TEXT_VALUE_PATTERN = /((?:token|access_token|refresh_token|authorization|password|otp|secret|api[_-]?key|apikey|private[_-]?key)["']?\s*[:=]\s*)("(?:\\.|[^"\\])*(?:"|$)|'(?:\\.|[^'\\])*(?:'|$)|[^\s,}&]+)/gi

const isSensitiveKey = (key: string) => {
  const normalized = key.toLowerCase().replace(/[\s-]/g, '_')

  return SENSITIVE_KEYS.some(sensitiveKey => normalized.includes(sensitiveKey))
}

const maskTokenLikeValue = (value: string) => {
  const trimmed = value.trim()
  const bearerMatch = trimmed.match(/^Bearer\s+(.+)$/i)

  if (bearerMatch?.[1]) {
    const token = bearerMatch[1]

    return `Bearer ${token.slice(0, 8)}...<masked>`
  }

  if (JWT_PATTERN.test(trimmed) || LONG_TOKEN_PATTERN.test(trimmed)) {
    return `${trimmed.slice(0, 8)}...<masked>`
  }

  return value
    .replace(BEARER_TOKEN_PATTERN, 'Bearer <masked>')
    .replace(JWT_GLOBAL_PATTERN, match => `${match.slice(0, 8)}...<masked>`)
    .replace(SENSITIVE_TEXT_VALUE_PATTERN, (_, prefix: string, secret: string) => {
      const quote = secret.startsWith('"') ? '"' : secret.startsWith("'") ? "'" : ''

      return `${prefix}${quote}<masked>${quote}`
    })
}

export const maskSensitiveValue = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(maskSensitiveValue)

  if (value && typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>).reduce<Record<string, unknown>>((masked, [key, entryValue]) => {
      masked[key] = isSensitiveKey(key) ? '<masked>' : maskSensitiveValue(entryValue)

      return masked
    }, {})
  }

  if (typeof value === 'string') {
    // Workflow fields can themselves contain serialized request/response objects.
    try {
      const parsed = JSON.parse(value)

      if (parsed !== null && typeof parsed === 'object') {
        const masked = JSON.stringify(maskSensitiveValue(parsed))

        return masked === JSON.stringify(parsed) ? value : masked
      }
    } catch {
      // Apply text masking to ordinary strings and malformed JSON as well.
    }

    return maskTokenLikeValue(value)
  }

  return value
}

export const parseAndMaskJsonEditorValue = (value: unknown): object => {
  return prepareJsonViewerContent(value, maskSensitiveValue).treeValue
}
