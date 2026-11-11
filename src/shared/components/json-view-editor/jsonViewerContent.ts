export type JsonViewerToken = {
  type: 'plain' | 'key' | 'string' | 'number' | 'boolean' | 'null'
  text: string
}

const identity = (value: unknown) => value

export const prepareJsonViewerContent = (value: unknown, sanitize: (value: unknown) => unknown = identity) => {
  let parsed = value
  let isJson = value !== undefined && typeof value !== 'string'

  if (typeof value === 'string') {
    try {
      parsed = JSON.parse(value)
      isJson = true
    } catch {
      // Ordinary text and malformed JSON must keep their original whitespace.
    }
  }

  // Both views and the clipboard share the complete sanitized value, never tree DOM text.
  const safeValue = sanitize(parsed)
  const text = isJson ? JSON.stringify(safeValue, null, 2) ?? '-' : String(safeValue ?? '-')
  const treeValue = safeValue !== null && typeof safeValue === 'object'
    ? safeValue as object
    : { value: safeValue === '' || safeValue === undefined || safeValue === null ? '-' : safeValue }

  return { treeValue, text, isJson }
}

export const tokenizeJson = (text: string): JsonViewerToken[] => {
  const pattern = /"(?:\\.|[^"\\])*"\s*(?=:)|"(?:\\.|[^"\\])*"|\b(?:true|false|null)\b|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/g
  const tokens: JsonViewerToken[] = []
  let offset = 0

  for (const match of text.matchAll(pattern)) {
    const index = match.index!

    if (index > offset) tokens.push({ type: 'plain', text: text.slice(offset, index) })

    const token = match[0]
    const type = token.startsWith('"')
      ? text[index + token.length] === ':' ? 'key' : 'string'
      : token === 'null' ? 'null' : token === 'true' || token === 'false' ? 'boolean' : 'number'

    tokens.push({ type, text: token })
    offset = index + token.length
  }

  if (offset < text.length) tokens.push({ type: 'plain', text: text.slice(offset) })

  return tokens
}
