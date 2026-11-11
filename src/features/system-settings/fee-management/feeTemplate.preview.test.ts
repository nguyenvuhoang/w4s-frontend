import { describe, expect, it } from 'vitest'

import { parseFeeTemplateTranslations, stringifyFeeTemplateTranslations } from './feeTemplate.constants'
import {
  combineFeeTemplateBodies,
  feeTemplatePreviewAmounts,
  feeTemplatePreviewDocument,
  renderFeeTemplateHtmlPreview,
  renderFeeTemplateTextPreview,
  unknownFeeTemplateVariables
} from './feeTemplate.preview'

const text = (key: string) => key

describe('fee template preview', () => {
  it('renders multiple fee rows and a four-column table with currency symbols', () => {
    const html = renderFeeTemplateHtmlPreview('{TableBody}', 'outstanding', text)

    expect(html.match(/<th style=/g)).toHaveLength(4)
    expect(html.match(/<tr>/g)).toHaveLength(6)
    expect(html).toContain('1.850.000đ')
    expect(html).not.toContain('{TableBody}')
  })

  it('uses explicit outstanding debt for the fully paid scenario', () => {
    expect(feeTemplatePreviewAmounts('paid')).toEqual({ total: 1850000, paid: 1850000, balance: 0, outstanding: 0 })
    expect(renderFeeTemplateTextPreview('{TotalAmount}|{BalanceAmount}|{FinalPayAmount}', 'paid', text)).toBe('1.850.000đ|0đ|0đ')
    expect(renderFeeTemplateHtmlPreview('{TableBody}', 'paid', text)).toContain('preview_paid_amount')
  })

  it('shows balance deduction and the remaining amount', () => {
    expect(renderFeeTemplateTextPreview('{TotalAmount}|{BalanceAmount}|{FinalPayAmount}', 'balance', text)).toBe('1.850.000đ|400.000đ|1.450.000đ')
    expect(renderFeeTemplateHtmlPreview('{TableBody}', 'balance', text)).toContain('preview_deducted_balance')
  })

  it('never invents a QR or replaces unsupported backend variables', () => {
    expect(renderFeeTemplateHtmlPreview('{PaymentQr}{ProjectName}', 'outstanding', text)).toBe('{ProjectName}')
    expect(unknownFeeTemplateVariables('{ProjectName} {CustomerName} {ProjectName}', '{DueDate}')).toEqual(['ProjectName', 'DueDate'])
  })

  it('escapes plain replacement values in email HTML', () => {
    expect(renderFeeTemplateHtmlPreview('{CustomerName}', 'outstanding', () => '<img src=x>')).toBe('&lt;img src=x&gt;')
  })

  it('combines full documents into one email without nesting html/body documents', () => {
    const result = combineFeeTemplateBodies({ vi: '<html><head><style>p{color:red}</style></head><body><p>VI {TableBody}</p></body></html>', en: '<p>EN {FinalPayAmount}</p>' })

    expect(result).toContain('lang="vi"')
    expect(result).toContain('lang="en"')
    expect(result).toContain('<style>p{color:red}</style>')
    expect(result).not.toContain('<html>')
    expect(result).not.toContain('<body>')
    expect(result).toContain('{TableBody}')
    expect(combineFeeTemplateBodies({ vi: result, en: result })).toBe(result)
  })

  it('preserves long HTML, accents and tokens through translation serialization', () => {
    const body = `<table><tr><td style="padding:16px">${'Thông báo phí & payment '.repeat(200)}{TableBody}{PaymentQr}</td></tr></table>`
    const values = { vi: body, en: body }

    expect(parseFeeTemplateTranslations(stringifyFeeTemplateTranslations(values))).toEqual(values)
  })

  it('places restrictive CSP before edited HTML and keeps long content', () => {
    const html = '<p>' + 'Long content '.repeat(200) + '</p>'
    const document = feeTemplatePreviewDocument(html)

    expect(document).toContain("default-src 'none'")
    expect(document).toContain("img-src data:")
    expect(document.indexOf('Content-Security-Policy')).toBeLessThan(document.indexOf(html))
    expect(document).toContain(html)
    expect(document).toContain('overflow-wrap:anywhere')
  })
})
