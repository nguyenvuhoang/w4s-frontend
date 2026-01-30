const toObjectIfJson = (v: any): any => {
  if (v == null) return null
  if (typeof v === 'object') return v
  if (typeof v === 'string') {
    try {
      const trimmed = v.trim()
      if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
        return JSON.parse(trimmed)
      }
      return v
    } catch {
      return v
    }
  }
  return v
}
export const getLocalizedText = (
    value: any,
    lang: string,
    fallbacks: string[] = ['en', 'vi', 'lo', 'zh']
): string => {
    const obj = toObjectIfJson(value)
    if (!obj || typeof obj !== 'object') return value ?? 'N/A'

    const tryKeys = [lang, ...fallbacks.filter(f => f !== lang)]
    for (const k of tryKeys) {
        const v = obj?.[k]
        if (typeof v === 'string' && v.trim() !== '') return v
    }
    try {
        return JSON.stringify(obj)
    } catch {
        return 'N/A'
    }
}
