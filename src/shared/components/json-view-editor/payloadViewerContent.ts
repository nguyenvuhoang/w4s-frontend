import { tokenizeJson } from './jsonViewerContent'
import type { JsonViewerToken } from './jsonViewerContent'

export type PayloadKind = 'empty' | 'json' | 'text'

export type DecodedPayload = {
  kind: PayloadKind
  value: unknown
  // The source looked like a JSON object/array but could not be parsed.
  invalidJson: boolean
}

export type PayloadContent = DecodedPayload & {
  pretty: string
  raw: string
}

export type PayloadToken = {
  type: JsonViewerToken['type'] | 'marker' | 'danger'
  text: string
}

export type PayloadHighlight = 'json' | 'log' | 'none'

// Above this size syntax highlighting is skipped to keep the dialog responsive.
export const PAYLOAD_HIGHLIGHT_CHAR_LIMIT = 200_000

// Escaped JSON is often encoded more than once ("\"{\\\"a\\\":1}\""); unwrap a few levels at most.
const MAX_DECODE_DEPTH = 3

const identity = <T,>(value: T) => value

const isStructured = (value: unknown) => value !== null && typeof value === 'object'

const looksLikeJsonContainer = (text: string) => /^[[{]/.test(text.trim())

const looksLikeJson = (text: string) => /^[[{"]/.test(text.trim())

/**
 * Turns a log payload into a displayable shape without ever throwing:
 * - null / undefined / blank string → empty
 * - object / array → json (rendered as is)
 * - JSON (or escaped JSON) string → json (parsed)
 * - anything else → text, kept verbatim
 */
export const decodePayload = (value: unknown): DecodedPayload => {
  if (value === null || value === undefined) return { kind: 'empty', value: null, invalidJson: false }
  if (isStructured(value)) return { kind: 'json', value, invalidJson: false }
  if (typeof value !== 'string') return { kind: 'text', value: String(value), invalidJson: false }
  if (!value.trim()) return { kind: 'empty', value: null, invalidJson: false }

  let current: unknown = value
  let parseFailed = false

  for (let depth = 0; depth < MAX_DECODE_DEPTH && typeof current === 'string' && looksLikeJson(current); depth++) {
    try {
      current = JSON.parse(current.trim())
    } catch {
      parseFailed = true
      break
    }
  }

  if (isStructured(current)) return { kind: 'json', value: current, invalidJson: false }

  // A JSON string literal decodes to its inner text; numbers/booleans/null keep the original text.
  const text = typeof current === 'string' ? current : value

  return { kind: 'text', value: text, invalidJson: parseFailed && looksLikeJsonContainer(text) }
}

type PrepareOptions = {
  textOnly?: boolean
  sanitize?: (value: unknown) => unknown
  sanitizeText?: (value: string) => string
}

/** Decodes and sanitizes a payload once; every view and the clipboard use the result. */
export const preparePayloadContent = (
  value: unknown,
  { textOnly = false, sanitize = identity, sanitizeText = identity }: PrepareOptions = {}
): PayloadContent => {
  if (textOnly) {
    if (value === null || value === undefined || (typeof value === 'string' && !value.trim())) {
      return { kind: 'empty', value: null, invalidJson: false, pretty: '', raw: '' }
    }

    const text = typeof value === 'string'
      ? sanitizeText(value)
      : isStructured(value) ? JSON.stringify(sanitize(value), null, 2) : sanitizeText(String(value))

    return { kind: 'text', value: text, invalidJson: false, pretty: text, raw: text }
  }

  const decoded = decodePayload(value)

  if (decoded.kind === 'empty') return { ...decoded, pretty: '', raw: '' }

  if (decoded.kind === 'json') {
    const safeValue = sanitize(decoded.value)

    return { ...decoded, value: safeValue, pretty: JSON.stringify(safeValue, null, 2), raw: JSON.stringify(safeValue) }
  }

  const text = sanitizeText(String(decoded.value))

  return { ...decoded, value: text, pretty: text, raw: text }
}

const LOG_TOKEN_PATTERN = /(?<![A-Za-z0-9])(?:(BEGIN|END|REQUEST|RESPONSE)|(ERROR|Error|EXCEPTION|Exception|FATAL|Fatal|FAILED|Failed))(?![A-Za-z0-9])/g

/** Highlights request/response markers and error words in plain log text. */
export const tokenizeLogText = (text: string): PayloadToken[] => {
  const tokens: PayloadToken[] = []
  let offset = 0

  for (const match of text.matchAll(LOG_TOKEN_PATTERN)) {
    const index = match.index!

    if (index > offset) tokens.push({ type: 'plain', text: text.slice(offset, index) })
    tokens.push({ type: match[1] ? 'marker' : 'danger', text: match[0] })
    offset = index + match[0].length
  }

  if (offset < text.length) tokens.push({ type: 'plain', text: text.slice(offset) })

  return tokens
}

/** Splits highlighted tokens into lines so each line can carry its own line number. */
export const splitTokensIntoLines = (tokens: PayloadToken[]): PayloadToken[][] => {
  const lines: PayloadToken[][] = [[]]

  for (const token of tokens) {
    const parts = token.text.split('\n')

    parts.forEach((part, index) => {
      if (index > 0) lines.push([])
      if (part) lines[lines.length - 1].push({ type: token.type, text: part })
    })
  }

  return lines
}

export const buildPayloadLines = (text: string, highlight: PayloadHighlight) => {
  const canHighlight = highlight !== 'none' && text.length <= PAYLOAD_HIGHLIGHT_CHAR_LIMIT
  const tokens: PayloadToken[] = !canHighlight
    ? [{ type: 'plain', text }]
    : highlight === 'json' ? tokenizeJson(text) : tokenizeLogText(text)

  return { lines: splitTokensIntoLines(tokens), highlighted: canHighlight, truncatedHighlight: highlight !== 'none' && !canHighlight }
}

export const formatPayloadSize = (text: string) => {
  const bytes = new TextEncoder().encode(text).length

  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`

  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}
