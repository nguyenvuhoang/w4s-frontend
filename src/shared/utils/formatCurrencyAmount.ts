const currencyCodePattern = /^[A-Z]{3}$/

export const extractCurrencyCode = (unit?: string | null) => {
  if (!unit) return null

  const [candidate] = unit.split('/')
  const normalized = candidate?.trim().toUpperCase()

  if (!normalized || !currencyCodePattern.test(normalized)) return null

  return normalized
}

export const getLocaleNumberSeparators = (locale?: string) => {
  const normalizedLocale = locale === 'vi' ? 'vi-VN' : locale === 'en' ? 'en-US' : locale || 'en-US'
  const parts = new Intl.NumberFormat(normalizedLocale).formatToParts(12345.6)
  const group = parts.find(part => part.type === 'group')?.value || ','
  const decimal = parts.find(part => part.type === 'decimal')?.value || '.'

  return { locale: normalizedLocale, group, decimal }
}

export const normalizeAmountInput = (input: string, locale?: string) => {
  const { group, decimal } = getLocaleNumberSeparators(locale)
  const alternateDecimal = decimal === '.' ? ',' : '.'
  const allowedSeparators = new RegExp(`[^\\d\\${group}\\${decimal}\\${alternateDecimal}-]`, 'g')
  const sanitized = input.replace(/\s/g, '').replace(allowedSeparators, '')

  if (!sanitized) return ''

  const isNegative = sanitized.startsWith('-')
  const unsigned = isNegative ? sanitized.slice(1) : sanitized
  const decimalCount = (unsigned.match(new RegExp(`\\${decimal}`, 'g')) || []).length
  const alternateCount = (unsigned.match(new RegExp(`\\${alternateDecimal}`, 'g')) || []).length

  let integerPart = unsigned
  let fractionPart = ''

  if (decimalCount > 0) {
    const lastDecimalIndex = unsigned.lastIndexOf(decimal)

    integerPart = unsigned.slice(0, lastDecimalIndex)
    fractionPart = unsigned.slice(lastDecimalIndex + 1)
  } else if (alternateCount > 0 && alternateDecimal !== group) {
    const lastAlternateIndex = unsigned.lastIndexOf(alternateDecimal)
    const digitsAfter = unsigned.length - lastAlternateIndex - 1
    const shouldTreatAlternateAsDecimal =
      alternateCount === 1 && digitsAfter % 3 !== 0

    if (shouldTreatAlternateAsDecimal) {
      integerPart = unsigned.slice(0, lastAlternateIndex)
      fractionPart = unsigned.slice(lastAlternateIndex + 1)
    }
  }

  const normalizedInteger = integerPart
    .replace(new RegExp(`\\${group}`, 'g'), '')
    .replace(new RegExp(`\\${decimal}`, 'g'), '')
    .replace(new RegExp(`\\${alternateDecimal}`, 'g'), '')
    .replace(/\D/g, '')
  const normalizedFraction = fractionPart.replace(/[^\d]/g, '')
  const prefix = isNegative && (normalizedInteger || normalizedFraction) ? '-' : ''

  if (!normalizedInteger && !normalizedFraction) return ''
  if (
    fractionPart !== '' ||
    unsigned.endsWith(decimal) ||
    unsigned.endsWith(alternateDecimal)
  ) {
    return `${prefix}${normalizedInteger || '0'}.${normalizedFraction}`
  }

  return `${prefix}${normalizedInteger}`
}

export const formatRawAmountInput = (rawValue: string, locale?: string) => {
  if (!rawValue) return ''

  const { locale: normalizedLocale, decimal } = getLocaleNumberSeparators(locale)
  const isNegative = rawValue.startsWith('-')
  const unsigned = isNegative ? rawValue.slice(1) : rawValue
  const hasTrailingDecimal = unsigned.endsWith('.')
  const [integerPart = '', fractionPart = ''] = unsigned.split('.')
  const formattedInteger = new Intl.NumberFormat(normalizedLocale, {
    maximumFractionDigits: 0
  }).format(Number(integerPart || '0'))
  const prefix = isNegative ? '-' : ''

  if (hasTrailingDecimal) {
    return `${prefix}${formattedInteger}${decimal}`
  }

  if (fractionPart) {
    return `${prefix}${formattedInteger}${decimal}${fractionPart}`
  }

  return `${prefix}${formattedInteger}`
}

export const formatCurrencyAmount = ({
  value,
  locale,
  unit
}: {
  value: number | null | undefined
  locale?: string
  unit?: string | null
}) => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return '-'
  }

  const { locale: normalizedLocale } = getLocaleNumberSeparators(locale)
  const amount = new Intl.NumberFormat(normalizedLocale, {
    maximumFractionDigits: Number.isInteger(Number(value)) ? 0 : 2
  }).format(Number(value))
  const currencyCode = extractCurrencyCode(unit)

  return currencyCode ? `${amount} ${currencyCode}` : amount
}
