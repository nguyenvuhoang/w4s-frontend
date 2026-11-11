import { readFileSync } from 'node:fs'
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

const { runFODynamic, hookState } = vi.hoisted(() => ({
  runFODynamic: vi.fn(),
  hookState: { cursor: 0, slots: {} as Record<number, unknown> }
}))

// Run the hook outside React: state/ref slots survive between "renders" (see projectDelete.test.ts).
vi.mock('react', async importOriginal => {
  const actual = await importOriginal<typeof import('react')>()

  const useState = (initial: unknown) => {
    const index = hookState.cursor++

    if (!(index in hookState.slots)) hookState.slots[index] = typeof initial === 'function' ? (initial as () => unknown)() : initial

    const set = (next: unknown) => {
      hookState.slots[index] = typeof next === 'function' ? (next as (value: unknown) => unknown)(hookState.slots[index]) : next
    }

    return [hookState.slots[index], set]
  }

  const useRef = (initial: unknown) => {
    const index = hookState.cursor++

    if (!(index in hookState.slots)) hookState.slots[index] = { current: initial }

    return hookState.slots[index]
  }

  const useEffect = () => {}

  return { ...actual, default: { ...actual, useState, useRef, useEffect }, useState, useRef, useEffect }
})

vi.mock('@/servers/system-service', () => ({ workflowService: { runFODynamic } }))

let useProjectNotificationTemplates: typeof import('./notification-templates/useProjectNotificationTemplates').useProjectNotificationTemplates
let helpers: typeof import('./notification-templates/projectNotificationTemplateHelpers')

beforeAll(async () => {
  ;({ useProjectNotificationTemplates } = await import('./notification-templates/useProjectNotificationTemplates'))
  helpers = await import('./notification-templates/projectNotificationTemplateHelpers')
})

const globalTemplate = {
  id: 10,
  project_id: null,
  template_code: 'FEE_NOTI',
  template_name: 'Thông báo phí định kỳ',
  template_group: 'FEE',
  channel: 'ALL',
  subject: 'Thông báo phí {(:PERIOD_NAME:)} căn hộ {(:UNIT_CODE:)}: {(:FINAL_PAY_AMOUNT:)}',
  body_html: '<p>Kính gửi <strong>{(:FULL_NAME:)}</strong></p>{(:TABLE_BODY:)}<p>{(:ACCOUNT_NUMBER:)} - {(:BANK_NAME:)}</p>',
  is_default: true,
  status: 'A',
  is_customized: false,
  global_template_id: 10
}

const customizedTemplate = {
  ...globalTemplate,
  id: 15,
  project_id: 22,
  template_code: 'FEE_REMINDER_1',
  template_name: 'Nhắc nợ phí lần 1',
  is_default: false,
  is_customized: true,
  global_template_id: 11
}

const parameters = [
  { placeholder: '{(:FULL_NAME:)}', description: 'Tên cư dân', sample_value: 'Nguyễn Văn A', aliases: ['{CustomerName}', '{FULL_NAME}'] },
  { placeholder: '{(:UNIT_CODE:)}', description: 'Mã căn hộ', sample_value: 'A1-12.05', aliases: ['{ApartmentCode}', '{UNIT_CODE}'] },
  { placeholder: '{(:PERIOD_NAME:)}', description: 'Kỳ phí', sample_value: 'Tháng 11/2026', aliases: ['{PeriodName}', '{PERIOD_NAME}'] },
  { placeholder: '{(:FINAL_PAY_AMOUNT:)}', description: 'Cần đóng', sample_value: '1,500,000 đ', aliases: [] },
  { placeholder: '{(:TABLE_BODY:)}', description: 'Bảng phí', sample_value: '[Khung bảng chi tiết phí HTML]', aliases: ['{TableBody}', '{TABLE_BODY}'] },
  { placeholder: '{(:PAYMENT_QR:)}', description: 'QR', sample_value: '[Ảnh QR thanh toán]', aliases: ['{PaymentQr}', '{PAYMENT_QR}'] }
]

const ok = (data: unknown) => ({ success: true, code: 'success', data, errors: [] })
const listResponse = (items: unknown[]) => ok({ project_id: 22, items })

const messages = { loadError: 'load failed', parametersError: 'params failed', saveError: 'save failed', resetError: 'reset failed' }

const renderHook = (projectId = 22) => {
  hookState.cursor = 0

  return useProjectNotificationTemplates({ projectId, sessiontoken: 'token', language: 'vi', messages })
}

const callsOf = (workflowid: string) => runFODynamic.mock.calls.filter(([request]) => request.workflowid === workflowid)

beforeEach(() => {
  hookState.cursor = 0
  hookState.slots = {}
  runFODynamic.mockReset()
  runFODynamic.mockImplementation(async ({ workflowid }: { workflowid: string }) => {
    if (workflowid === 'WF_BO_GET_NOTIFICATION_TEMPLATE_PARAMETERS') return ok({ parameters })
    if (workflowid === 'WF_BO_GET_PROJECT_NOTIFICATION_TEMPLATES') return listResponse([globalTemplate, customizedTemplate])

    return ok({})
  })
})

describe('loading', () => {
  it('loads the templates of the route project id and the FEE parameters once', async () => {
    await renderHook(22).ensureLoaded()

    const list = callsOf('WF_BO_GET_PROJECT_NOTIFICATION_TEMPLATES')
    const params = callsOf('WF_BO_GET_NOTIFICATION_TEMPLATE_PARAMETERS')

    expect(list).toHaveLength(1)
    expect(list[0][0].input).toEqual({ project_id: 22, template_group: 'FEE' })
    expect(params).toHaveLength(1)
    expect(params[0][0].input).toEqual({ template_group: 'FEE' })

    const state = renderHook(22)

    expect(state.loaded).toBe(true)
    expect(state.templates.map(item => item.template_code)).toEqual(['FEE_NOTI', 'FEE_REMINDER_1'])
    expect(state.parameters).toHaveLength(parameters.length)
  })

  it('does not reload when the tab is opened again, and blocks duplicate requests in flight', async () => {
    let resolve: (value: unknown) => void = () => {}

    runFODynamic.mockImplementation(({ workflowid }: { workflowid: string }) =>
      workflowid === 'WF_BO_GET_PROJECT_NOTIFICATION_TEMPLATES' ? new Promise(r => { resolve = r }) : Promise.resolve(ok({ parameters })))

    const first = renderHook().ensureLoaded()

    await renderHook().ensureLoaded()
    await renderHook().reload()

    expect(renderHook().loading).toBe(true)
    resolve(listResponse([globalTemplate]))
    await first
    await renderHook().ensureLoaded()

    expect(callsOf('WF_BO_GET_PROJECT_NOTIFICATION_TEMPLATES')).toHaveLength(1)
    expect(callsOf('WF_BO_GET_NOTIFICATION_TEMPLATE_PARAMETERS')).toHaveLength(1)
  })

  it('shows the empty state data without inventing templates', async () => {
    runFODynamic.mockImplementation(async ({ workflowid }: { workflowid: string }) =>
      workflowid === 'WF_BO_GET_PROJECT_NOTIFICATION_TEMPLATES' ? listResponse([]) : ok({ parameters }))

    await renderHook().ensureLoaded()

    expect(renderHook().loaded).toBe(true)
    expect(renderHook().templates).toEqual([])
    expect(renderHook().error).toBeNull()
  })

  it('keeps the backend error with its reference, and Retry reloads', async () => {
    runFODynamic.mockImplementation(async ({ workflowid }: { workflowid: string }) =>
      workflowid === 'WF_BO_GET_PROJECT_NOTIFICATION_TEMPLATES'
        ? { success: false, code: 'failed', errors: [{ info: 'Project not found' }], execution_id: 'EXEC-1' }
        : ok({ parameters }))

    await renderHook().ensureLoaded()

    expect(renderHook().error).toBe('Project not found Mã tra cứu lỗi: EXEC-1')
    expect(renderHook().loading).toBe(false)

    runFODynamic.mockResolvedValue(listResponse([globalTemplate]))
    await renderHook().reload()

    expect(renderHook().error).toBeNull()
    expect(renderHook().templates).toHaveLength(1)
  })
})

describe('admin scope', () => {
  it('never sends the working-project scope for the 4 workflows; the project only comes from fields', async () => {
    await renderHook(22).ensureLoaded()
    const [global, customized] = renderHook(22).templates

    await renderHook(22).saveTemplate(global, helpers.toTemplateForm(global))
    await renderHook(22).resetTemplate(customized)

    const workflows = [
      'WF_BO_GET_PROJECT_NOTIFICATION_TEMPLATES',
      'WF_BO_GET_NOTIFICATION_TEMPLATE_PARAMETERS',
      'WF_BO_SAVE_PROJECT_NOTIFICATION_TEMPLATE',
      'WF_BO_RESET_PROJECT_NOTIFICATION_TEMPLATE'
    ]

    for (const workflowid of workflows) {
      const calls = callsOf(workflowid)

      expect(calls.length).toBeGreaterThan(0)
      for (const [request] of calls) expect(request).toHaveProperty('scope', '')
    }

    expect(callsOf('WF_BO_GET_NOTIFICATION_TEMPLATE_PARAMETERS')[0][0].input).toEqual({ template_group: 'FEE' })
    for (const workflowid of workflows.filter(id => id !== 'WF_BO_GET_NOTIFICATION_TEMPLATE_PARAMETERS')) {
      expect(callsOf(workflowid)[0][0].input.project_id).toBe(22)
    }
  })

  it('the empty per-request scope overrides the working project and is not sent as a header', async () => {
    const { resolveWorkflowScope } = await import('@/shared/utils/workflowScope')
    const workflowService = readFileSync(new URL('../../../servers/system-service/services/workflow.service.ts', import.meta.url), 'utf8')

    expect(workflowService).toContain('...(scope !== undefined ? { scope } : {})')
    expect(resolveWorkflowScope('WF_BO_GET_PROJECT_NOTIFICATION_TEMPLATES', '')).toBeUndefined()
  })
})

describe('mapping', () => {
  it('uses is_customized as the only customization flag', () => {
    const [global, custom, overrideFlag] = helpers.mapProjectNotificationTemplates({
      items: [
        globalTemplate,
        customizedTemplate,
        { ...globalTemplate, template_code: 'X', project_id: 22, id: 99, is_customized: false }
      ]
    })

    expect(global.is_customized).toBe(false)
    expect(custom.is_customized).toBe(true)
    expect(overrideFlag.is_customized).toBe(false)
  })
})

describe('save', () => {
  it('saves a global template as a project override with id null, the route project and the same code', async () => {
    await renderHook(22).ensureLoaded()
    const template = renderHook(22).templates[0]
    const form = { ...helpers.toTemplateForm(template), template_name: 'Thông báo phí Hưng Phúc', subject: 'BQL {(:PROJECT_NAME:)}' }

    const saved = await renderHook(22).saveTemplate(template, form)

    const [request] = callsOf('WF_BO_SAVE_PROJECT_NOTIFICATION_TEMPLATE')[0]

    expect(saved).toBe(true)
    expect(request.input).toEqual({
      project_id: 22,
      id: null,
      template_code: 'FEE_NOTI',
      template_name: 'Thông báo phí Hưng Phúc',
      template_group: 'FEE',
      channel: 'ALL',
      subject: 'BQL {(:PROJECT_NAME:)}',
      body_html: globalTemplate.body_html,
      is_default: true,
      status: 'A'
    })
    expect(callsOf('WF_BO_GET_PROJECT_NOTIFICATION_TEMPLATES')).toHaveLength(2)
  })

  it('updates a customized template with its own id', async () => {
    await renderHook(22).ensureLoaded()
    const template = renderHook(22).templates[1]

    await renderHook(22).saveTemplate(template, helpers.toTemplateForm(template))

    const [request] = callsOf('WF_BO_SAVE_PROJECT_NOTIFICATION_TEMPLATE')[0]

    expect(request.input.id).toBe(15)
    expect(request.input.project_id).toBe(22)
    expect(request.input.template_code).toBe('FEE_REMINDER_1')
  })

  it('a failure keeps the error, does not reload and allows a new attempt; double submit is blocked', async () => {
    await renderHook().ensureLoaded()
    const template = renderHook().templates[0]
    let resolve: (value: unknown) => void = () => {}

    runFODynamic.mockReturnValueOnce(new Promise(r => { resolve = r }))

    const first = renderHook().saveTemplate(template, helpers.toTemplateForm(template))

    expect(await renderHook().saveTemplate(template, helpers.toTemplateForm(template))).toBe(false)
    expect(renderHook().saving).toBe(true)

    resolve({ success: false, code: 'failed', errors: [{ info: 'Invalid subject' }] })

    expect(await first).toBe(false)
    expect(renderHook().saveError).toBe('Invalid subject')
    expect(renderHook().saving).toBe(false)
    expect(callsOf('WF_BO_SAVE_PROJECT_NOTIFICATION_TEMPLATE')).toHaveLength(1)
    expect(callsOf('WF_BO_GET_PROJECT_NOTIFICATION_TEMPLATES')).toHaveLength(1)

    expect(await renderHook().saveTemplate(template, helpers.toTemplateForm(template))).toBe(true)
  })
})

describe('reset', () => {
  it('sends project_id + template_code, reloads and checks that the template is global again', async () => {
    await renderHook(22).ensureLoaded()
    const template = renderHook(22).templates[1]

    runFODynamic.mockImplementation(async ({ workflowid }: { workflowid: string }) =>
      workflowid === 'WF_BO_GET_PROJECT_NOTIFICATION_TEMPLATES'
        ? listResponse([globalTemplate, { ...customizedTemplate, id: 11, project_id: null, is_customized: false }])
        : ok({ success: true }))

    const result = await renderHook(22).resetTemplate(template)

    expect(callsOf('WF_BO_RESET_PROJECT_NOTIFICATION_TEMPLATE')[0][0].input).toEqual({ project_id: 22, template_code: 'FEE_REMINDER_1' })
    expect(result).toEqual({ ok: true, stillCustomized: false })
    expect(renderHook(22).templates[1].is_customized).toBe(false)
  })

  it('reports a template that is still customized after the reload', async () => {
    await renderHook().ensureLoaded()

    const result = await renderHook().resetTemplate(renderHook().templates[1])

    expect(result).toEqual({ ok: true, stillCustomized: true })
  })

  it('never resets a global template', async () => {
    await renderHook().ensureLoaded()

    const result = await renderHook().resetTemplate(renderHook().templates[0])

    expect(result.ok).toBe(false)
    expect(callsOf('WF_BO_RESET_PROJECT_NOTIFICATION_TEMPLATE')).toHaveLength(0)
  })

  it('a failure keeps the error and does not reload', async () => {
    await renderHook().ensureLoaded()
    runFODynamic.mockResolvedValueOnce({ success: false, code: 'failed', errors: [{ info: 'Reset denied' }], execution_id: 'EXEC-R' })

    const result = await renderHook().resetTemplate(renderHook().templates[1])

    expect(result.ok).toBe(false)
    expect(renderHook().resetError).toBe('Reset denied Mã tra cứu lỗi: EXEC-R')
    expect(callsOf('WF_BO_GET_PROJECT_NOTIFICATION_TEMPLATES')).toHaveLength(1)
  })
})

describe('placeholder insertion', () => {
  it('inserts at the cursor / over the selection and keeps the exact syntax', () => {
    expect(helpers.insertAtSelection('Kính gửi ,', '{(:FULL_NAME:)}', 9, 9)).toEqual({ value: 'Kính gửi {(:FULL_NAME:)},', caret: 24 })
    expect(helpers.insertAtSelection('A XXX B', '{(:UNIT_CODE:)}', 2, 5).value).toBe('A {(:UNIT_CODE:)} B')
    expect(helpers.insertAtSelection('Tiêu đề', '{(:PERIOD_NAME:)}').value).toBe('Tiêu đề{(:PERIOD_NAME:)}')
  })
})

describe('preview placeholders and aliases', () => {
  const labels = { tableItem: 'Khoản phí', tableAmount: 'Số tiền' }

  it('replaces the canonical placeholder and its aliases with the sample value (any form, any case)', () => {
    const subject = '{(:FULL_NAME:)} | {CustomerName} | {FULL_NAME} | (:FULL_NAME:) | {customername}'

    expect(helpers.renderTemplateTextPreview(subject, parameters)).toBe('Nguyễn Văn A | Nguyễn Văn A | Nguyễn Văn A | Nguyễn Văn A | Nguyễn Văn A')
    expect(helpers.renderTemplateHtmlPreview(`<p>${subject}</p>`, parameters, labels))
      .toBe('<p>Nguyễn Văn A | Nguyễn Văn A | Nguyễn Văn A | Nguyễn Văn A | Nguyễn Văn A</p>')
  })

  it('renders the screen template that uses aliases only', () => {
    const subject = 'Thông báo phí căn hộ {ApartmentCode} - {PeriodName}'

    expect(helpers.renderTemplateTextPreview(subject, parameters)).toBe('Thông báo phí căn hộ A1-12.05 - Tháng 11/2026')
  })

  it('keeps unknown tokens and escapes sample values', () => {
    const bank = [{ placeholder: '{(:BANK_NAME:)}', description: '', sample_value: '<b>x</b>', aliases: ['{BankName}'] }]

    expect(helpers.renderTemplateHtmlPreview('<p>{(:UNKNOWN:)} {Other}</p>', parameters, labels)).toBe('<p>{(:UNKNOWN:)} {Other}</p>')
    expect(helpers.renderTemplateHtmlPreview('{BankName}', bank, labels)).toBe('&lt;b&gt;x&lt;/b&gt;')
  })

  it('illustrates TABLE_BODY (or {TableBody}) as a fee table frame, without fake amounts', () => {
    const html = helpers.renderTemplateHtmlPreview('<p>Kính gửi</p><p>{TableBody}</p><p>Hết</p>', parameters, labels)

    expect(html).toMatch(/^<p>Kính gửi<\/p><table[^>]*><caption[^>]*>\[Khung bảng chi tiết phí HTML\]<\/caption><thead><tr><th[^>]*>Khoản phí<\/th><th[^>]*>Số tiền<\/th><\/tr><\/thead><tbody>(<tr>.*?<\/tr>){3}<\/tbody><\/table><p>Hết<\/p>$/)
    expect(html).not.toMatch(/\d{3},\d{3}/)
    expect(helpers.renderTemplateHtmlPreview('<table><tbody>{(:TABLE_BODY:)}</tbody></table>', parameters, labels)).toMatch(/^<table><tbody>(<tr>.*?<\/tr>){3}<\/tbody><\/table>$/)
    expect(helpers.renderTemplateHtmlPreview('<p>Bảng: {(:TABLE_BODY:)}</p>', parameters, labels)).toMatch(/^<p>Bảng: <span [^>]*>\[Khung bảng chi tiết phí HTML\]<\/span><\/p>$/)
  })

  it('illustrates PAYMENT_QR (or {PaymentQr}) with inline-safe markup and no image from the data', () => {
    const inline = helpers.renderTemplateHtmlPreview('<p>QR: {PaymentQr}</p>', parameters, labels)

    expect(inline).toMatch(/^<p>QR: <span [^>]*><span [^>]*><\/span><span [^>]*>\[Ảnh QR thanh toán\]<\/span><\/span><\/p>$/)
    expect(inline).not.toContain('<img')
    expect(inline).not.toContain('<div')
    expect(helpers.renderTemplateHtmlPreview('<img alt="{(:PAYMENT_QR:)}">', parameters, labels)).toBe('<img alt="[Ảnh QR thanh toán]">')
  })

  it('the illustrations pass the sanitizer without any security finding', () => {
    const rendered = helpers.renderTemplateHtmlPreview('<p>{TableBody}</p><p>{PaymentQr}</p><table><tbody>{TableBody}</tbody></table>', parameters, labels)
    const report = helpers.sanitizeTemplateHtmlWithReport(rendered)

    expect(report.findings).toEqual([])
    expect(report.html).toBe(rendered)
  })

  it('never changes the stored subject / body', () => {
    const body = '<p>{CustomerName}</p><p>{TableBody}</p>'
    const subject = '{ApartmentCode}'

    helpers.renderTemplateHtmlPreview(body, parameters, labels)
    helpers.renderTemplateTextPreview(subject, parameters)

    expect(body).toBe('<p>{CustomerName}</p><p>{TableBody}</p>')
    expect(subject).toBe('{ApartmentCode}')
  })
})

describe('HTML preview safety and sanitization notice', () => {
  const sanitize = (html: string) => helpers.sanitizeTemplateHtml(html)
  const findings = (html: string) => helpers.sanitizeTemplateHtmlWithReport(html).findings

  it('removes scripts, styles, frames and their content', () => {
    expect(sanitize('<p>a</p><script>alert(1)</script><style>p{}</style><iframe src="https://x"></iframe><p>b</p>')).toBe('<p>a</p><p>b</p>')
    expect(sanitize('<p>a</p><script>alert(1)')).toBe('<p>a</p>')
    expect(sanitize('<svg onload=alert(1)><circle/></svg>ok')).toBe('ok')
    expect(sanitize('<link rel="stylesheet" href="https://x"><p>a</p>')).toBe('<p>a</p>')
  })

  it('removes event handlers and unsafe URLs / styles', () => {
    expect(sanitize('<img src=x onerror=alert(1)>')).toBe('<img>')
    expect(sanitize('<p onclick="alert(1)" style="color:red">x</p>')).toBe('<p style="color:red">x</p>')
    expect(sanitize('<a href="javascript:alert(1)">x</a>')).toBe('<a>x</a>')
    expect(sanitize('<a href="&#106;avascript:alert(1)">x</a>')).toBe('<a>x</a>')
    expect(sanitize('<a href="java\tscript:alert(1)">x</a>')).toBe('<a>x</a>')
    expect(sanitize('<a href="https://ips.vn">x</a>')).toBe('<a href="https://ips.vn" rel="noopener noreferrer">x</a>')
    expect(sanitize('<div style="background:url(javascript:alert(1))">x</div>')).toBe('<div>x</div>')
    expect(sanitize('<img src="data:image/svg+xml;base64,AAA">')).toBe('<img>')
  })

  it('escapes broken markup, comments and attribute breakouts instead of emitting tags', () => {
    expect(sanitize('<!-- <script>alert(1)</script> -->x')).toBe('x')
    expect(sanitize('a < b <scr<script>ipt>alert(1)</script>')).toBe('a &lt; b &lt;scr')
    expect(sanitize('<p title="&quot;><script>alert(1)</script>">x</p>')).toBe('<p title="&quot;&gt;&lt;script&gt;alert(1)&lt;/script&gt;">x</p>')
  })

  it('reports nothing for normal CKEditor content (harmless class / figure / mark are not security findings)', () => {
    const html = '<p style="text-align:center;"><strong>{CustomerName}</strong></p><figure class="table"><table><tbody><tr><td>1</td></tr></tbody></table></figure><p><mark class="marker-yellow">x</mark></p><p><a href="https://ips.vn">x</a><img src="https://ips.vn/a.png"></p>'

    expect(findings(html)).toEqual([])
    expect(findings('<p>Kính gửi Quý cư dân {CustomerName}</p>')).toEqual([])
  })

  it('reports each kind of security removal with what was removed', () => {
    expect(findings('<script>x</script><iframe></iframe><p onclick="a()" onmouseover="b()">x</p><a href="javascript:x">y</a><div style="background:url(x)">z</div>')).toEqual([
      { kind: 'unsafeTag', names: ['script', 'iframe'] },
      { kind: 'eventHandler', names: ['onclick', 'onmouseover'] },
      { kind: 'unsafeUrl', names: ['href'] },
      { kind: 'unsafeStyle', names: ['style'] }
    ])
  })

  it('keeps formatting, tables and placeholders untouched', () => {
    const html = '<p style="text-align:center"><strong>{(:FULL_NAME:)}</strong></p><table border="1"><tbody><tr><td colspan="2">{(:TABLE_BODY:)}</td></tr></tbody></table><br/>'

    expect(sanitize(html)).toBe('<p style="text-align:center"><strong>{(:FULL_NAME:)}</strong></p><table border="1"><tbody><tr><td colspan="2">{(:TABLE_BODY:)}</td></tr></tbody></table><br>')
  })

  it('shows the security notice only from sanitizer findings, otherwise the "Sample data" note', () => {
    const preview = readFileSync(new URL('./notification-templates/ProjectNotificationTemplatePreview.tsx', import.meta.url), 'utf8')

    expect(preview).toContain('sandbox=""')
    expect(preview).toContain('sanitizeTemplateHtmlWithReport(renderTemplateHtmlPreview(')
    expect(preview).toMatch(/body\.findings\.length > 0 \? \(\s*<Alert severity="warning"/)
    expect(preview).toContain("t('notificationTemplatePreviewSampleData', 'Sample data')")
    expect(preview).not.toContain('notificationTemplatePreviewHint')
    expect(preview).not.toContain('dangerouslySetInnerHTML')
    expect(helpers.buildTemplatePreviewDocument('')).toContain("default-src 'none'")
  })
})

describe('mobile preview', () => {
  const preview = readFileSync(new URL('./notification-templates/ProjectNotificationTemplatePreview.tsx', import.meta.url), 'utf8')

  it('shows the lock screen (subject) and the in-app detail (sanitized body, sandboxed, scrolling) side by side', () => {
    expect(preview).toContain('<PhoneFrame kind="lock"')
    expect(preview).toContain('<PhoneFrame kind="detail"')
    expect(preview).toContain("flexWrap=\"wrap\"")
    expect(preview.match(/sandbox=""/g)).toHaveLength(2)
    expect(preview).toContain('buildTemplatePreviewDocument(body.html, { compact: true })')
    expect(preview).toMatch(/srcDoc=\{mobileDocument\}[\s\S]*?flex: 1, minHeight: 0/)
    expect(preview).not.toMatch(/linear-gradient/)
    expect(helpers.buildTemplatePreviewDocument('<p>x</p>', { compact: true })).toContain('padding:14px 14px 20px')
  })
})

describe('status mapping', () => {
  it('offers only the stored active code A and keeps the value returned by the backend', () => {
    expect(helpers.templateStatusOptions('A')).toEqual(['A'])
    expect(helpers.templateStatusOptions('I')).toEqual(['A', 'I'])
    expect(helpers.templateStatusOptions('')).toEqual(['A'])
    expect(helpers.templateStatusOptions('A')).not.toContain('Active')
    expect(helpers.isActiveTemplateStatus('A')).toBe(true)
    expect(helpers.isActiveTemplateStatus('Active')).toBe(true)
    expect(helpers.isActiveTemplateStatus('I')).toBe(false)
  })

  it('does not change the status when only the content is edited', async () => {
    runFODynamic.mockImplementation(async ({ workflowid }: { workflowid: string }) =>
      workflowid === 'WF_BO_GET_PROJECT_NOTIFICATION_TEMPLATES' ? listResponse([{ ...globalTemplate, status: 'A' }]) : ok({ parameters }))

    await renderHook().ensureLoaded()
    const template = renderHook().templates[0]
    const form = { ...helpers.toTemplateForm(template), subject: 'Thông báo phí căn hộ {ApartmentCode} - {PeriodName}' }

    await renderHook().saveTemplate(template, form)

    expect(callsOf('WF_BO_SAVE_PROJECT_NOTIFICATION_TEMPLATE')[0][0].input.status).toBe('A')
  })

  it('labels A as active in vi / en', () => {
    const vi = JSON.parse(readFileSync(new URL('../../../data/dictionaries/vi.json', import.meta.url), 'utf8')).projectManagement
    const en = JSON.parse(readFileSync(new URL('../../../data/dictionaries/en.json', import.meta.url), 'utf8')).projectManagement

    expect(vi.notificationTemplateStatus_A).toBe('Đang hoạt động')
    expect(en.notificationTemplateStatus_A).toBe('Active')
  })
})

describe('editor modes', () => {
  const dialog = readFileSync(new URL('./notification-templates/ProjectNotificationTemplateEditorDialog.tsx', import.meta.url), 'utf8')

  it('detects placeholders the rich editor normalization would drop', () => {
    const source = '<table><tbody>{(:TABLE_BODY:)}</tbody></table><p>{CustomerName} {CustomerName}</p>'

    expect(helpers.findLostPlaceholders(source, '<figure class="table"><table><tbody></tbody></table></figure><p>{CustomerName} {CustomerName}</p>')).toEqual(['{(:TABLE_BODY:)}'])
    expect(helpers.findLostPlaceholders(source, '<p>{CustomerName}</p>')).toEqual(['{(:TABLE_BODY:)}', '{CustomerName}'])
    expect(helpers.findLostPlaceholders('<p>{TableBody}</p>', '<p>{TableBody}</p>')).toEqual([])
  })

  it('Rich text ↔ HTML keeps one body value; a lossy rich load falls back to HTML before changing the form', () => {
    expect(dialog.match(/value=\{form\.body_html\}/g)).toHaveLength(2)
    expect(dialog).toMatch(/const changeBodyMode = [\s\S]*?\n {2}\}/)
    expect(dialog.match(/const changeBodyMode = [\s\S]*?\n {2}\}/)![0]).not.toMatch(/update\(|setForm\(/)
    expect(dialog).toMatch(/const handleRichReady = [\s\S]*?findLostPlaceholders\(bodyRef\.current, editor\.getData\(\)\)[\s\S]*?setBodyMode\('html'\)/)
    expect(dialog).toContain('onReady={handleRichReady}')
  })

  it('always inserts the canonical placeholder from the backend', () => {
    expect(dialog).toContain('onClick={() => insertPlaceholder(parameter.placeholder)}')
  })

  it('uses a wide workspace dialog: 96vw / 1600px / 94vh, editor 45% and preview 55% on desktop, one column below', () => {
    expect(dialog).toContain("width: '96vw', maxWidth: 1600, maxHeight: '94vh'")
    expect(dialog).toContain('size={{ xs: 12, lg: 5.4 }}')
    expect(dialog).toContain('size={{ xs: 12, lg: 6.6 }}')
    expect(dialog).toContain("<DialogContent dividers sx={{ overflowX: 'hidden' }}>")
  })

  it('keeps the preview sticky inside the content only, never over the dialog footer', () => {
    expect(dialog).toMatch(/<\/DialogContent>[\s\S]*<DialogActions/)
    expect(dialog).toMatch(/<DialogContent dividers[^>]*>[\s\S]*position: \{ lg: 'sticky' \}[\s\S]*<\/DialogContent>/)
  })
})

describe('UI wiring', () => {
  const page = readFileSync(new URL('./ProjectDetailPage.tsx', import.meta.url), 'utf8')
  const tab = readFileSync(new URL('./notification-templates/ProjectNotificationTemplatesTab.tsx', import.meta.url), 'utf8')

  it('adds the tab between bank and history, admin scope only, mounted lazily with the route project id', () => {
    const bank = page.indexOf("value: 'bank' as const")
    const templates = page.indexOf("value: 'templates' as const")
    const history = page.indexOf("value: 'history'")

    expect(bank).toBeGreaterThan(-1)
    expect(templates).toBeGreaterThan(bank)
    expect(history).toBeGreaterThan(templates)
    expect(page).toContain("if (tab === 'templates') setTemplatesOpened(true)")
    expect(page).toMatch(/\{templatesOpened && \(\s*<ProjectNotificationTemplatesTab[\s\S]*?project=\{\{ id: projectId,/)
  })

  it('shows the customization badges and the reset action only for customized templates', () => {
    expect(tab).toMatch(/template\.is_customized \? \(\s*<Chip size="small" color="success" label=\{t\('notificationTemplateCustomized'/)
    expect(tab).toContain("t('notificationTemplateGlobal'")
    expect(tab).toMatch(/\{template\.is_customized && \(\s*<Button[^\n]*onClick=\{\(\) => openReset\(template\)\}/)
  })

  it('has the vi / en texts', () => {
    const vi = JSON.parse(readFileSync(new URL('../../../data/dictionaries/vi.json', import.meta.url), 'utf8')).projectManagement
    const en = JSON.parse(readFileSync(new URL('../../../data/dictionaries/en.json', import.meta.url), 'utf8')).projectManagement

    expect(vi.notificationTemplatesTab).toBe('Mẫu thông báo')
    expect(vi.notificationTemplateCustomized).toBe('Đã tùy chỉnh riêng')
    expect(vi.notificationTemplateGlobal).toBe('Mẫu chung hệ thống')
    expect(vi.notificationTemplateReset).toBe('Khôi phục mặc định')

    const keys = Object.keys(vi).filter(key => key.startsWith('notificationTemplate'))

    expect(keys.length).toBeGreaterThan(40)
    expect(keys.filter(key => !en[key])).toEqual([])
  })
})
