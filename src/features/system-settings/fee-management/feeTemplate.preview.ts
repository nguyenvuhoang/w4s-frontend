import { escapeFeeTemplateHtml, FEE_TEMPLATE_VARIABLES, type FeeTemplateLanguage } from './feeTemplate.constants'

export type FeeTemplateScenario = 'outstanding' | 'paid' | 'balance'
export type FeeTemplatePreviewLanguage = FeeTemplateLanguage | 'bilingual'
type Text = (key: string, fallback: string) => string

export const FEE_TEMPLATE_SCENARIOS: FeeTemplateScenario[] = ['outstanding', 'paid', 'balance']

/** Only illustrative preview values. No invoice status is used to derive outstanding debt. */
export const feeTemplatePreviewAmounts = (scenario: FeeTemplateScenario) => ({
  total: 1850000,
  paid: scenario === 'paid' ? 1850000 : 0,
  balance: scenario === 'balance' ? 400000 : 0,
  outstanding: scenario === 'paid' ? 0 : scenario === 'balance' ? 1450000 : 1850000
})

const money = (value: number) => `${new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 2 }).format(value)}đ`

const previewValues = (scenario: FeeTemplateScenario, text: Text) => {
  const amounts = feeTemplatePreviewAmounts(scenario)

  return {
    ApartmentCode: 'A-12.05',
    CustomerName: text('preview_resident', ''),
    PeriodName: '10/2026',
    TotalAmount: money(amounts.total),
    BalanceAmount: money(amounts.balance),
    FinalPayAmount: money(amounts.outstanding),
    // No fake QR: preview has no valid payment data from the backend.
    PaymentQr: '',
    TableBody: ''
  }
}

const tablePreview = (scenario: FeeTemplateScenario, text: Text) => {
  const amounts = feeTemplatePreviewAmounts(scenario)
  const cell = 'padding:8px;border:1px solid #ddd;vertical-align:top;overflow-wrap:anywhere;'
  const rows = [1250000, 300000, 300000].map((amount, index) => `<tr><td style="${cell}">${index + 1}</td><td style="${cell}">${escapeFeeTemplateHtml(text(`preview_fee_${index + 1}`, ''))}</td><td style="${cell}">${escapeFeeTemplateHtml(text(`preview_fee_description_${index + 1}`, ''))}</td><td style="${cell}text-align:right;">${money(amount)}</td></tr>`).join('')
  const summary = (key: string, value: number) => `<tr><td colspan="3" style="${cell}">${escapeFeeTemplateHtml(text(key, ''))}</td><td style="${cell}text-align:right;font-weight:bold;">${money(value)}</td></tr>`

  return `<table width="100%" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;table-layout:fixed;font-size:13px;"><thead><tr>${['preview_col_number', 'preview_col_fee', 'preview_col_description', 'preview_col_amount'].map((key, index) => `<th style="${cell}width:${[8, 25, 40, 27][index]}%;">${escapeFeeTemplateHtml(text(key, ''))}</th>`).join('')}</tr></thead><tbody>${rows}</tbody><tfoot>${summary('preview_total', amounts.total)}${amounts.paid ? summary('preview_paid_amount', amounts.paid) : ''}${amounts.balance ? summary('preview_deducted_balance', amounts.balance) : ''}${summary('preview_final_amount', amounts.outstanding)}</tfoot></table>`
}

export const renderFeeTemplateTextPreview = (content: string, scenario: FeeTemplateScenario, text: Text) => {
  const values = previewValues(scenario, text)

  return content.replace(/\{(\w+)\}/g, (token, key: string) =>
    key === 'TableBody' ? text('preview_table_text', '') : Object.prototype.hasOwnProperty.call(values, key) ? values[key as keyof typeof values] : token
  )
}

export const renderFeeTemplateHtmlPreview = (content: string, scenario: FeeTemplateScenario, text: Text) => {
  const values = previewValues(scenario, text)

  return content.replace(/\{(\w+)\}/g, (token, key: string) =>
    key === 'TableBody' ? tablePreview(scenario, text) : Object.prototype.hasOwnProperty.call(values, key) ? escapeFeeTemplateHtml(values[key as keyof typeof values]) : token
  )
}

/** Compose full HTML documents as well as fragments; keep inline styles and head styles. */
const fragment = (html: string) => {
  const body = html.match(/<body\b([^>]*)>([\s\S]*?)<\/body\s*>/i)
  const styles = body ? (html.match(/<head\b[^>]*>([\s\S]*?)<\/head\s*>/i)?.[1].match(/<style\b[^>]*>[\s\S]*?<\/style\s*>/gi) ?? []).join('') : ''

  return body ? `${styles}<div${body[1]}>${body[2]}</div>` : html.replace(/<!doctype[^>]*>|<\/?html\b[^>]*>|<head\b[^>]*>[\s\S]*?<\/head\s*>/gi, '')
}

export const combineFeeTemplateBodies = (bodies: Record<FeeTemplateLanguage, string>) => {
  if (bodies.vi === bodies.en) return bodies.vi

  return (['vi', 'en'] as const).filter(language => bodies[language].trim()).map(language =>
    `<div lang="${language}" style="margin-bottom:24px;">${fragment(bodies[language])}</div>`
  ).join('\n')
}

/** CSP precedes user HTML. Sandbox denies scripts, forms, top navigation and parent access. */
export const feeTemplatePreviewDocument = (html: string) => `<!doctype html><html><head><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src data:; font-src 'none'; base-uri 'none'; form-action 'none';"><meta name="viewport" content="width=device-width, initial-scale=1"><style>body{margin:16px;font-family:Arial,sans-serif;font-size:14px;line-height:1.6;color:#222;overflow-wrap:anywhere}table{max-width:100%}img{max-width:100%;height:auto}a{pointer-events:none}</style></head><body>${fragment(html)}</body></html>`

export const unknownFeeTemplateVariables = (...contents: string[]) => {
  const supported = new Set<string>(FEE_TEMPLATE_VARIABLES.map(variable => variable.key))

  return [...new Set(contents.flatMap(content => [...content.matchAll(/\{([A-Z]\w*)\}/g)].map(match => match[1])))].filter(key => !supported.has(key))
}
