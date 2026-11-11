import {
  KNOWN_TEMPLATE_CHANNELS,
  KNOWN_TEMPLATE_STATUSES,
  PROJECT_NOTIFICATION_TEMPLATE_GROUP,
  type NotificationTemplateParameter,
  type ProjectNotificationTemplate,
  type ProjectNotificationTemplateForm,
  type ProjectNotificationTemplateFormErrors,
  type ProjectNotificationTemplateResetPayload,
  type ProjectNotificationTemplateSavePayload
} from './projectNotificationTemplateTypes'

const toText = (value: unknown) => (value === undefined || value === null ? '' : String(value))

const toNullableNumber = (value: unknown): number | null => {
  if (value === undefined || value === null || value === '') return null

  const parsed = Number(value)

  return Number.isFinite(parsed) ? parsed : null
}

const toFlag = (value: unknown) => value === true || value === 'true' || value === 1 || value === '1'

const pickArray = (root: any, key: string): any[] => {
  if (Array.isArray(root?.[key])) return root[key]
  if (Array.isArray(root?.data?.[key])) return root.data[key]
  if (Array.isArray(root)) return root

  return []
}

export const mapProjectNotificationTemplate = (raw: any): ProjectNotificationTemplate => ({
  id: toNullableNumber(raw?.id),
  project_id: toNullableNumber(raw?.project_id),
  template_code: toText(raw?.template_code),
  template_name: toText(raw?.template_name),
  template_group: toText(raw?.template_group) || PROJECT_NOTIFICATION_TEMPLATE_GROUP,
  channel: toText(raw?.channel),
  subject: toText(raw?.subject),
  body_html: toText(raw?.body_html),
  is_default: toFlag(raw?.is_default),
  status: toText(raw?.status),
  is_customized: toFlag(raw?.is_customized),
  global_template_id: toNullableNumber(raw?.global_template_id)
})

export const mapProjectNotificationTemplates = (root: any): ProjectNotificationTemplate[] =>
  pickArray(root, 'items').map(mapProjectNotificationTemplate).filter(item => item.template_code)

export const mapNotificationTemplateParameters = (root: any): NotificationTemplateParameter[] =>
  pickArray(root, 'parameters')
    .map(raw => ({
      placeholder: toText(raw?.placeholder),
      description: toText(raw?.description),
      sample_value: toText(raw?.sample_value),
      aliases: Array.isArray(raw?.aliases) ? raw.aliases.map(toText).filter(Boolean) : []
    }))
    .filter(item => item.placeholder)

export const toTemplateForm = (template: ProjectNotificationTemplate): ProjectNotificationTemplateForm => ({
  template_code: template.template_code,
  template_name: template.template_name,
  template_group: template.template_group,
  channel: template.channel,
  subject: template.subject,
  body_html: template.body_html,
  is_default: template.is_default,
  status: template.status
})

/** Select options: the contract values, plus the current backend value when it is another one. */
export const templateSelectOptions = (known: readonly string[], current: string) =>
  current && !known.includes(current) ? [...known, current] : [...known]

export const templateChannelOptions = (current: string) => templateSelectOptions(KNOWN_TEMPLATE_CHANNELS, current)
export const templateStatusOptions = (current: string) => templateSelectOptions(KNOWN_TEMPLATE_STATUSES, current)

/** 'A' is the stored active code; 'Active' is the wording of the integration document. */
export const isActiveTemplateStatus = (status: string) => status === 'A' || status.toLowerCase() === 'active'

export const validateTemplateForm = (
  form: ProjectNotificationTemplateForm,
  messages: { required: string }
): ProjectNotificationTemplateFormErrors => {
  const errors: ProjectNotificationTemplateFormErrors = {}

  if (!form.template_name.trim()) errors.template_name = messages.required
  if (!form.subject.trim()) errors.subject = messages.required
  if (!form.body_html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, '').trim()) errors.body_html = messages.required

  return errors
}

/**
 * WF_BO_SAVE_PROJECT_NOTIFICATION_TEMPLATE payload. The project always comes from the detail route and the
 * template code is kept from the loaded template. A global template (`is_customized === false`) is sent with
 * `id: null` so the backend creates the project override instead of updating the global record; an override
 * keeps its own id.
 */
export const buildTemplateSavePayload = (
  projectId: number,
  template: ProjectNotificationTemplate,
  form: ProjectNotificationTemplateForm
): ProjectNotificationTemplateSavePayload => ({
  project_id: projectId,
  id: template.is_customized ? template.id : null,
  template_code: template.template_code,
  template_name: form.template_name.trim(),
  template_group: template.template_group || PROJECT_NOTIFICATION_TEMPLATE_GROUP,
  channel: form.channel,
  subject: form.subject,
  body_html: form.body_html,
  is_default: form.is_default,
  status: form.status
})

export const buildTemplateResetPayload = (projectId: number, template: ProjectNotificationTemplate): ProjectNotificationTemplateResetPayload => ({
  project_id: projectId,
  template_code: template.template_code
})

/** Inserts `text` over the [start, end) selection; returns the new value and the caret after the insertion. */
export const insertAtSelection = (value: string, text: string, start?: number | null, end?: number | null) => {
  const length = value.length
  const from = typeof start === 'number' ? Math.min(Math.max(start, 0), length) : length
  const to = typeof end === 'number' ? Math.min(Math.max(end, from), length) : from

  return { value: `${value.slice(0, from)}${text}${value.slice(to)}`, caret: from + text.length }
}

// ---------------------------------------------------------------------------------------------------------------
// Preview
// ---------------------------------------------------------------------------------------------------------------

export const escapeHtml = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')

/**
 * Same token forms as the backend renderer (NotificationTemplateRenderer): `{(:KEY:)}`, `(:KEY:)` and `{KEY}`,
 * keys matched without case.
 */
const TOKEN_PATTERN = /\{\(:([A-Za-z0-9_]+):\)\}|\(:([A-Za-z0-9_]+):\)|\{([A-Za-z0-9_]+)\}/g

const tokenKey = (token: string) => {
  const match = new RegExp(TOKEN_PATTERN.source).exec(token)

  return (match?.[1] ?? match?.[2] ?? match?.[3] ?? '').toUpperCase()
}

const TABLE_BODY_KEY = 'TABLE_BODY'
const PAYMENT_QR_KEY = 'PAYMENT_QR'

type ResolvedParameter = NotificationTemplateParameter & { kind: 'text' | 'table' | 'qr' }

/** Case-insensitive key → parameter map built from the placeholder and every alias of each parameter. */
const buildParameterMap = (parameters: NotificationTemplateParameter[]) => {
  const map = new Map<string, ResolvedParameter>()

  for (const parameter of parameters) {
    const canonical = tokenKey(parameter.placeholder)
    const kind = canonical === TABLE_BODY_KEY ? 'table' : canonical === PAYMENT_QR_KEY ? 'qr' : 'text'

    for (const token of [parameter.placeholder, ...parameter.aliases]) {
      const key = tokenKey(token)

      if (key && !map.has(key)) map.set(key, { ...parameter, kind })
    }
  }

  return map
}

const keyOfMatch = (match: RegExpExecArray | RegExpMatchArray) => (match[1] ?? match[2] ?? match[3] ?? '').toUpperCase()

type HtmlContext = 'attribute' | 'cell' | 'table' | 'inline' | 'flow'

const countMatches = (value: string, pattern: RegExp) => (value.match(pattern) ?? []).length

const openCount = (lower: string, tags: string) =>
  countMatches(lower, new RegExp(`<(?:${tags})[\\s>/]`, 'g')) - countMatches(lower, new RegExp(`</(?:${tags})\\s*>`, 'g'))

/** Where an index of the template sits, so a rich sample can be shaped to keep the preview HTML valid. */
const htmlContextAt = (html: string, index: number): HtmlContext => {
  const before = html.slice(0, index)

  if (before.lastIndexOf('<') > before.lastIndexOf('>')) return 'attribute'

  const lower = before.toLowerCase()

  if (openCount(lower, 'td|th') > 0) return 'cell'
  if (openCount(lower, 'table') > 0) return 'table'
  if (openCount(lower, 'p|h[1-6]|span|a|strong|b|em|i|u|s|font|small') > 0) return 'inline'

  return 'flow'
}

export type TemplatePreviewLabels = {
  /** Header of the item column of the illustrated fee table. */
  tableItem: string
  /** Header of the amount column of the illustrated fee table. */
  tableAmount: string
}

const DEFAULT_PREVIEW_LABELS: TemplatePreviewLabels = { tableItem: 'Item', tableAmount: 'Amount' }

const SKELETON_BAR = 'display:inline-block;height:10px;border-radius:5px;background:#e2e8f0;vertical-align:middle'
const CELL_STYLE = 'padding:8px 10px;border-bottom:1px solid #e2e8f0'
const ROW_WIDTHS = [62, 48, 55]

const skeletonRows = () =>
  ROW_WIDTHS.map(width =>
    `<tr><td style="${CELL_STYLE}"><span style="${SKELETON_BAR};width:${width}%"></span></td>`
    + `<td style="${CELL_STYLE};text-align:right"><span style="${SKELETON_BAR};width:72px"></span></td></tr>`
  ).join('')

/** Illustrated fee table: the real rows are generated by the backend, so the preview shows its frame only. */
const tableSample = (parameter: ResolvedParameter, context: HtmlContext, labels: TemplatePreviewLabels) => {
  const caption = escapeHtml(parameter.sample_value || parameter.placeholder)

  if (context === 'attribute') return caption
  if (context === 'table') return skeletonRows()
  if (context === 'cell' || context === 'inline') {
    return `<span style="display:inline-block;padding:2px 8px;border:1px dashed #94a3b8;border-radius:4px;background:#f8fafc;color:#475569;font-size:12px">${caption}</span>`
  }

  return '<table style="width:100%;border-collapse:collapse;margin:12px 0;font-size:13px">'
    + `<caption style="caption-side:bottom;padding-top:6px;color:#64748b;font-size:12px;font-style:italic;text-align:left">${caption}</caption>`
    + '<thead><tr>'
    + `<th style="${CELL_STYLE};text-align:left;background:#f1f5f9;color:#334155">${escapeHtml(labels.tableItem)}</th>`
    + `<th style="${CELL_STYLE};text-align:right;background:#f1f5f9;color:#334155">${escapeHtml(labels.tableAmount)}</th>`
    + `</tr></thead><tbody>${skeletonRows()}</tbody></table>`
}

const QR_PATTERN = 'background-color:#ffffff;'
  + 'background-image:linear-gradient(45deg,#0f172a 25%,transparent 25%,transparent 75%,#0f172a 75%),'
  + 'linear-gradient(45deg,#0f172a 25%,transparent 25%,transparent 75%,#0f172a 75%);'
  + 'background-size:14px 14px;background-position:0 0,7px 7px'

/** Illustrated payment QR (inline-safe: spans only), never an image from the template data. */
const qrSample = (parameter: ResolvedParameter, context: HtmlContext) => {
  const caption = escapeHtml(parameter.sample_value || parameter.placeholder)

  if (context === 'attribute') return caption

  const block = '<span style="display:inline-block;padding:8px;border:1px solid #e2e8f0;border-radius:8px;background:#ffffff;text-align:center;vertical-align:top">'
    + `<span style="display:block;width:104px;height:104px;margin:0 auto;${QR_PATTERN}"></span>`
    + `<span style="display:block;margin-top:6px;color:#64748b;font-size:11px">${caption}</span></span>`

  return context === 'table' ? `<tr><td style="${CELL_STYLE}" colspan="99">${block}</td></tr>` : block
}

/** A rich placeholder that is the only content of a paragraph (CKEditor output) replaces the whole paragraph. */
const unwrapRichParagraphs = (html: string, map: Map<string, ResolvedParameter>) =>
  html.replace(
    /<p\b[^>]*>(?:\s|&nbsp;)*(\{\(:[A-Za-z0-9_]+:\)\}|\(:[A-Za-z0-9_]+:\)|\{[A-Za-z0-9_]+\})(?:\s|&nbsp;)*<\/p>/gi,
    (whole, token: string) => (map.get(tokenKey(token))?.kind === 'text' || !map.has(tokenKey(token)) ? whole : token)
  )

/**
 * Preview of the HTML body. Every known placeholder or alias (any token form, any case) is replaced with its
 * escaped sample value; `TABLE_BODY` / `PAYMENT_QR` become an illustration shaped for their position. Unknown
 * tokens are kept. Works on a copy: the stored template is never modified. Sanitize the result before rendering.
 */
export const renderTemplateHtmlPreview = (
  html: string,
  parameters: NotificationTemplateParameter[],
  labels: TemplatePreviewLabels = DEFAULT_PREVIEW_LABELS
) => {
  const map = buildParameterMap(parameters)
  const source = unwrapRichParagraphs(html ?? '', map)

  return source.replace(TOKEN_PATTERN, (...args) => {
    const [token, , , , offset] = args as [string, string | undefined, string | undefined, string | undefined, number]
    const parameter = map.get(keyOfMatch(args as unknown as RegExpMatchArray))

    if (!parameter) return token
    if (parameter.kind === 'text') return escapeHtml(parameter.sample_value)

    const context = htmlContextAt(source, offset)

    return parameter.kind === 'table' ? tableSample(parameter, context, labels) : qrSample(parameter, context)
  })
}

/**
 * Placeholders (any token form) present in `before` but missing, or fewer, in `after`: used to detect a rich-editor
 * normalization that would drop a placeholder (e.g. one placed directly inside a `<table>` / `<tbody>`).
 */
export const findLostPlaceholders = (before: string, after: string) => {
  const count = (value: string) => {
    const counts = new Map<string, number>()

    for (const match of (value ?? '').matchAll(TOKEN_PATTERN)) counts.set(match[0], (counts.get(match[0]) ?? 0) + 1)

    return counts
  }

  const afterCounts = count(after)

  return Array.from(count(before)).filter(([token, total]) => (afterCounts.get(token) ?? 0) < total).map(([token]) => token)
}

/** Plain-text preview of the subject (Mobile Push banner / Email subject). Render it as text, never as HTML. */
export const renderTemplateTextPreview = (subject: string, parameters: NotificationTemplateParameter[]) => {
  const map = buildParameterMap(parameters)

  return (subject ?? '').replace(TOKEN_PATTERN, (...args) => {
    const parameter = map.get(keyOfMatch(args as unknown as RegExpMatchArray))

    return parameter ? parameter.sample_value : (args[0] as string)
  })
}

// ---------------------------------------------------------------------------------------------------------------
// HTML sanitizer (allowlist). The output is rebuilt from parsed tokens: only allowlisted tags and attributes are
// emitted, attribute values are re-escaped and every other `<` / `>` becomes text. Works without a DOM.
// Security removals (dangerous tags, event handlers, unsafe URLs / styles) are reported; dropping a harmless
// formatting tag or attribute (e.g. `class`) is not.
// ---------------------------------------------------------------------------------------------------------------

const ALLOWED_TAGS = new Set([
  'a', 'b', 'blockquote', 'br', 'caption', 'col', 'colgroup', 'div', 'em', 'figcaption', 'figure', 'font',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'hr', 'i', 'img', 'li', 'mark', 'ol', 'p', 'pre', 's', 'small', 'span',
  'strike', 'strong', 'sub', 'sup', 'table', 'tbody', 'td', 'tfoot', 'th', 'thead', 'tr', 'u', 'ul'
])

const VOID_TAGS = new Set(['br', 'col', 'hr', 'img'])

/** Removed together with their content (reported). */
const DROP_CONTENT_TAGS = new Set([
  'script', 'style', 'iframe', 'frame', 'frameset', 'object', 'embed', 'applet', 'noscript', 'template', 'textarea',
  'select', 'svg', 'math', 'title', 'head', 'link', 'meta', 'base', 'form', 'input', 'button'
])

const VOID_DROP_TAGS = new Set(['link', 'meta', 'base', 'input', 'embed', 'frame'])

const GLOBAL_ATTRS = new Set(['style', 'align', 'title', 'dir', 'lang'])

const TAG_ATTRS: Record<string, Set<string>> = {
  a: new Set(['href', 'target']),
  img: new Set(['src', 'alt', 'width', 'height']),
  table: new Set(['width', 'border', 'cellpadding', 'cellspacing']),
  td: new Set(['colspan', 'rowspan', 'width', 'valign']),
  th: new Set(['colspan', 'rowspan', 'width', 'valign']),
  col: new Set(['span', 'width']),
  colgroup: new Set(['span', 'width']),
  font: new Set(['color', 'size', 'face'])
}

const TAG_PATTERN = /<(\/?)([a-zA-Z][a-zA-Z0-9:-]*)((?:\s+[^\s"'>\/=]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s"'=<>`]+))?)*)\s*(\/?)>/g
const ATTR_PATTERN = /([^\s"'>\/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g
const COMMENT_PATTERN = /<!--[\s\S]*?(?:-->|$)|<![^>]*>|<\?[\s\S]*?(?:\?>|$)/g

const NAMED_ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', colon: ':', tab: '\t', newline: '\n' }

const decodeEntities = (value: string) =>
  value.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);?/gi, (match, entity: string) => {
    const lower = entity.toLowerCase()

    if (lower.startsWith('#x')) return String.fromCodePoint(Number.parseInt(lower.slice(2), 16) || 0xfffd)
    if (lower.startsWith('#')) return String.fromCodePoint(Number.parseInt(lower.slice(1), 10) || 0xfffd)

    return NAMED_ENTITIES[lower] ?? match
  })

// eslint-disable-next-line no-control-regex
const stripControl = (value: string) => value.replace(/[\u0000- \u007f-\u009f]/g, '')

const isSafeUrl = (value: string, attribute: 'href' | 'src') => {
  const normalized = stripControl(decodeEntities(value)).toLowerCase()

  if (attribute === 'src') return /^https?:\/\//.test(normalized)

  return /^(https?:\/\/|mailto:|tel:|#)/.test(normalized)
}

const isSafeStyle = (value: string) => {
  const normalized = decodeEntities(value).toLowerCase()

  return !/expression\s*\(|url\s*\(|javascript:|vbscript:|@import|behavior\s*:|-moz-binding|\\|<|>/.test(normalized)
}

export type SanitizeFindingKind = 'unsafeTag' | 'eventHandler' | 'unsafeUrl' | 'unsafeStyle'

export type SanitizeReport = {
  html: string
  /** Security removals only, one entry per kind with the removed tag / attribute names. */
  findings: Array<{ kind: SanitizeFindingKind; names: string[] }>
}

type FindingCollector = (kind: SanitizeFindingKind, name: string) => void

const sanitizeAttributes = (tag: string, rawAttributes: string, report: FindingCollector) => {
  const allowed = TAG_ATTRS[tag]
  const output: string[] = []
  const seen = new Set<string>()

  for (const match of rawAttributes.matchAll(ATTR_PATTERN)) {
    const name = match[1].toLowerCase()
    const value = match[2] ?? match[3] ?? match[4] ?? ''

    if (name.startsWith('on')) {
      report('eventHandler', name)
      continue
    }

    if (seen.has(name) || (!GLOBAL_ATTRS.has(name) && !allowed?.has(name))) continue

    if ((name === 'href' || name === 'src') && !isSafeUrl(value, name)) {
      report('unsafeUrl', name)
      continue
    }

    if (name === 'style' && !isSafeStyle(value)) {
      report('unsafeStyle', name)
      continue
    }

    seen.add(name)
    output.push(`${name}="${escapeHtml(decodeEntities(value))}"`)
  }

  if (tag === 'a' && seen.has('href')) output.push('rel="noopener noreferrer"')

  return output.length ? ` ${output.join(' ')}` : ''
}

const escapeText = (value: string) => value.replace(/</g, '&lt;').replace(/>/g, '&gt;')

export const sanitizeTemplateHtmlWithReport = (rawHtml: string): SanitizeReport => {
  const html = (rawHtml ?? '').replace(COMMENT_PATTERN, '')
  const found = new Map<SanitizeFindingKind, Set<string>>()
  const report: FindingCollector = (kind, name) => {
    if (!found.has(kind)) found.set(kind, new Set())
    found.get(kind)!.add(name)
  }

  let output = ''
  let cursor = 0
  let dropUntil: string | null = null

  for (const match of html.matchAll(TAG_PATTERN)) {
    const index = match.index ?? 0
    const [whole, closing, rawTag, rawAttributes, selfClosing] = match
    const tag = rawTag.toLowerCase()

    if (dropUntil) {
      if (closing && tag === dropUntil) {
        dropUntil = null
        cursor = index + whole.length
      }

      continue
    }

    output += escapeText(html.slice(cursor, index))
    cursor = index + whole.length

    if (DROP_CONTENT_TAGS.has(tag)) {
      if (!closing) {
        report('unsafeTag', tag)
        if (!selfClosing && !VOID_DROP_TAGS.has(tag)) dropUntil = tag
      }

      continue
    }

    if (!ALLOWED_TAGS.has(tag)) continue

    if (closing) {
      if (!VOID_TAGS.has(tag)) output += `</${tag}>`

      continue
    }

    output += `<${tag}${sanitizeAttributes(tag, rawAttributes ?? '', report)}>`
  }

  if (!dropUntil) output += escapeText(html.slice(cursor))

  return {
    html: output,
    findings: Array.from(found, ([kind, names]) => ({ kind, names: Array.from(names) }))
  }
}

export const sanitizeTemplateHtml = (rawHtml: string) => sanitizeTemplateHtmlWithReport(rawHtml).html

/** Full document for the sandboxed preview frame. */
export const buildTemplatePreviewDocument = (safeBody: string, { compact = false }: { compact?: boolean } = {}) =>
  '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">'
  + '<meta http-equiv="Content-Security-Policy" content="default-src \'none\'; img-src https: http:; style-src \'unsafe-inline\'">'
  + `<style>body{margin:0;padding:${compact ? '14px 14px 20px' : '20px 24px'};font-family:Arial,Helvetica,sans-serif;`
  + `font-size:${compact ? 13 : 14}px;line-height:1.6;color:#1f2937;background:#ffffff;word-wrap:break-word}`
  + 'p{margin:0 0 10px}table{border-collapse:collapse;max-width:100%}td,th{padding:4px 8px}img{max-width:100%;height:auto}</style>'
  + `</head><body>${safeBody}</body></html>`
