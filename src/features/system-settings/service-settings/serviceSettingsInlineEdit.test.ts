import { existsSync, readFileSync } from 'node:fs'
import { describe, expect, it, vi } from 'vitest'

const httpPost = vi.hoisted(() => vi.fn())

vi.mock('@/servers/lib/http', () => ({ default: { post: httpPost } }))

const toastCustom = vi.hoisted(() => vi.fn())

vi.mock('react-hot-toast', () => ({ default: { custom: toastCustom, dismiss: vi.fn() } }))
vi.mock('@mui/material', () => ({ Alert: () => null }))

import { SERVICE_SETTINGS, SERVICE_SETTINGS_SERVICES } from './serviceSettingsConfig'

import {
  buildUpdatePayload,
  displayValue,
  executeInlineSave,
  getInitialEditValue,
  getRowKey,
  hasValueChanged,
  INITIAL_INLINE_EDIT_STATE,
  inlineEditReducer,
  type InlineEditAction,
  type InlineEditState,
  isMaskedValue,
  MASKED_DISPLAY_VALUE,
  resolveInlineEditKey
} from './serviceSettingsInlineEdit'
import type { ServiceSettingItem } from './types'

const record: ServiceSettingItem = { id: 25, name: 'MaxUploadSize', value: '10', organization: '', organizationId: 0 }
const secret: ServiceSettingItem = { id: 7, name: 'SmtpPassword', value: 'p@ss w0rd ', organizationId: 3 }

/** Mini store mirroring the hook: reducer + synchronous state reads. */
const createStore = (initial: InlineEditState = INITIAL_INLINE_EDIT_STATE) => {
  let state = initial
  const actions: InlineEditAction[] = []
  const dispatch = (action: InlineEditAction) => { actions.push(action); state = inlineEditReducer(state, action) }

  return { dispatch, actions, get state() { return state } }
}

const startEditing = (item: ServiceSettingItem = record) => {
  const store = createStore()
  store.dispatch({ type: 'start', rowKey: getRowKey('CMS', item), item })
  return store
}

const deps = (update: (payload: any) => Promise<unknown>) => ({
  update: vi.fn(update),
  onSuccess: vi.fn(),
  formatError: (error: unknown) => (error instanceof Error ? error.message : 'failed'),
  invalidMessage: 'missing id'
})

describe('service settings inline edit — enter / cancel', () => {
  it('clicking a value cell enters edit mode with the original value', () => {
    const store = startEditing()

    expect(store.state.rowKey).toBe('CMS:25')
    expect(store.state.draft).toBe('10')
    expect(store.state.saving).toBe(false)
  })

  it('allows only one row in edit mode at a time', () => {
    const store = startEditing()
    store.dispatch({ type: 'change', draft: '20' })
    store.dispatch({ type: 'start', rowKey: getRowKey('CMS', secret), item: secret })

    expect(store.state.rowKey).toBe('CMS:25')
    expect(store.state.draft).toBe('20')
  })

  it('cancel exits edit mode and discards the draft', () => {
    const store = startEditing()
    store.dispatch({ type: 'change', draft: '99' })
    store.dispatch({ type: 'cancel' })

    expect(store.state).toEqual(INITIAL_INLINE_EDIT_STATE)
  })

  it('maps Enter to save and Escape to cancel; other keys do nothing', () => {
    expect(resolveInlineEditKey('Enter')).toBe('save')
    expect(resolveInlineEditKey('Escape')).toBe('cancel')
    expect(resolveInlineEditKey('Tab')).toBeNull()
    expect(resolveInlineEditKey('a')).toBeNull()
  })

  it('does not auto-save on blur (the editor only saves through Enter or the Check button)', () => {
    const source = readFileSync(new URL('./components/ServiceSettingsContent.tsx', import.meta.url), 'utf8')

    expect(source).not.toMatch(/onBlur/)
    expect(source).toContain("if (keyAction === 'save') void inlineEdit.save()")
    expect(source).not.toMatch(/<Dialog|<Modal/)
  })
})

describe('service settings inline edit — save', () => {
  it('sends id, name and organization_id from the original record and only changes value', async () => {
    const store = startEditing()
    store.dispatch({ type: 'change', draft: 'string1' })
    const d = deps(async () => ({ success: true }))

    await executeInlineSave(store.state, store.dispatch, d)

    expect(d.update).toHaveBeenCalledTimes(1)
    expect(d.update).toHaveBeenCalledWith({ name: 'MaxUploadSize', value: 'string1', organization_id: 0, id: 25 })
    expect(d.onSuccess).toHaveBeenCalledWith(record, 'string1')
    expect(store.state).toEqual(INITIAL_INLINE_EDIT_STATE)
  })

  it('preserves the typed value verbatim (no trim, no type conversion)', async () => {
    const store = startEditing()
    store.dispatch({ type: 'change', draft: '  007 ' })
    const d = deps(async () => ({}))

    await executeInlineSave(store.state, store.dispatch, d)

    expect(d.update.mock.calls[0][0].value).toBe('  007 ')
  })

  it('does not call the API when the value is unchanged and simply exits edit mode', async () => {
    const store = startEditing()
    const d = deps(async () => ({}))

    await executeInlineSave(store.state, store.dispatch, d)

    expect(d.update).not.toHaveBeenCalled()
    expect(store.state.rowKey).toBeNull()
    expect(hasValueChanged(record, '10 ')).toBe(true)
  })

  it('ignores a second submit while saving (Enter/Check spam)', async () => {
    const store = startEditing()
    store.dispatch({ type: 'change', draft: '11' })
    let resolve!: () => void
    const d = deps(() => new Promise<void>(done => { resolve = done }))

    const first = executeInlineSave(store.state, store.dispatch, d)
    expect(store.state.saving).toBe(true)

    const second = await executeInlineSave(store.state, store.dispatch, d)
    expect(second.kind).toBe('ignore')

    store.dispatch({ type: 'cancel' })
    store.dispatch({ type: 'change', draft: 'other' })
    expect(store.state.rowKey).toBe('CMS:25')
    expect(store.state.draft).toBe('11')

    resolve()
    await first
    expect(d.update).toHaveBeenCalledTimes(1)
  })

  it('keeps edit mode and the typed value when the API fails, and shows the error', async () => {
    const store = startEditing()
    store.dispatch({ type: 'change', draft: 'bad-value' })
    const d = deps(async () => { throw new Error('Value is invalid. Error Reference: exec-123') })

    await executeInlineSave(store.state, store.dispatch, d)

    expect(store.state.rowKey).toBe('CMS:25')
    expect(store.state.draft).toBe('bad-value')
    expect(store.state.saving).toBe(false)
    expect(store.state.error).toBe('Value is invalid. Error Reference: exec-123')
    expect(d.onSuccess).not.toHaveBeenCalled()

    // Retrying after a failure clears the error and resubmits the same value.
    const retry = deps(async () => ({ success: true }))
    await executeInlineSave(store.state, store.dispatch, retry)
    expect(retry.update).toHaveBeenCalledWith(expect.objectContaining({ value: 'bad-value' }))
    expect(store.state).toEqual(INITIAL_INLINE_EDIT_STATE)
  })

  it('refuses to submit a record without id', async () => {
    const store = startEditing({ ...record, id: null })
    store.dispatch({ type: 'change', draft: 'x' })
    const d = deps(async () => ({}))

    await executeInlineSave(store.state, store.dispatch, d)

    expect(d.update).not.toHaveBeenCalled()
    expect(store.state.error).toBe('missing id')
    expect(buildUpdatePayload({ ...record, id: undefined }, 'x')).toBeNull()
  })
})

describe('service settings inline edit — secret masking', () => {
  it('keeps masking secrets in display mode until toggled visible', () => {
    expect(displayValue(secret)).toBe(MASKED_DISPLAY_VALUE)
    expect(displayValue(secret, true)).toBe('p@ss w0rd ')
    expect(displayValue(record)).toBe('10')
  })

  it('never uses the mask as the editable value or update payload', async () => {
    const masked: ServiceSettingItem = { ...secret, value: MASKED_DISPLAY_VALUE }
    const store = startEditing(masked)

    expect(store.state.draft).toBe('')

    // Saving an untouched (empty) replacement does not call the API.
    const d = deps(async () => ({}))
    await executeInlineSave(store.state, store.dispatch, d)
    expect(d.update).not.toHaveBeenCalled()
  })

  it('starts with an empty input when the backend does not provide the real secret', () => {
    expect(getInitialEditValue({ ...secret, value: null })).toBe('')
    expect(getInitialEditValue({ ...secret, value: undefined })).toBe('')
    expect(getInitialEditValue({ ...secret, value: '********' })).toBe('')
    expect(isMaskedValue('********')).toBe(true)
    expect(isMaskedValue('p@ss')).toBe(false)
  })

  it('submits the replacement secret verbatim with the record identity', async () => {
    const store = startEditing({ ...secret, value: '****' })
    store.dispatch({ type: 'change', draft: ' new-secret ' })
    const d = deps(async () => ({}))

    await executeInlineSave(store.state, store.dispatch, d)

    expect(d.update).toHaveBeenCalledWith({ name: 'SmtpPassword', value: ' new-secret ', organization_id: 3, id: 7 })
  })

  it('uses the real secret value when the backend provides it', () => {
    expect(getInitialEditValue(secret)).toBe('p@ss w0rd ')
  })

  it('the visibility toggle does not start edit mode', () => {
    const source = readFileSync(new URL('./components/ServiceSettingsContent.tsx', import.meta.url), 'utf8')

    expect(source).toContain('onClick={event => { event.stopPropagation(); setVisibleSecrets(')
  })
})

describe('service settings update — shares the search proxy', () => {
  const route = readFileSync(new URL('../../../app/api/system-settings/service-settings/route.ts', import.meta.url), 'utf8')
  const gateway = readFileSync(new URL('../../../servers/system-settings/serviceSettingsGateway.server.ts', import.meta.url), 'utf8')
  const config = readFileSync(new URL('./serviceSettingsConfig.ts', import.meta.url), 'utf8')

  it('maps every service to /{serviceId}/api/settings/search and /{serviceId}/api/settings/update', () => {
    for (const service of SERVICE_SETTINGS_SERVICES) {
      const id = service.toLowerCase()

      expect(SERVICE_SETTINGS[service].path).toBe(`/${id}/api/settings/search`)
      expect(SERVICE_SETTINGS[service].updatePath).toBe(`/${id}/api/settings/update`)
    }
  })

  it('uses the same route, URL builder and auth headers for search and update', () => {
    expect(existsSync(new URL('../../../app/api/system-settings/service-settings/update/route.ts', import.meta.url))).toBe(false)
    expect(config).not.toContain('Webchannel')
    expect(gateway).not.toContain('Webchannel')
    expect(route).toContain('const backendUrl = buildServiceSettingsUrl(service, operation)')
    expect(route).toContain('headers: await buildServiceSettingsHeaders(request)')
    expect(route).toContain("searchParams.get('operation') === 'update' ? 'update' : 'search'")
    expect(gateway).toContain("operation === 'update' ? config.updatePath : config.path")
    expect(gateway).toContain('return { name: body.name, value: body.value, organization_id: organizationId ?? null, id: body.id }')
  })
})

describe('service settings update — success toast', () => {
  const hook = readFileSync(new URL('./hooks/useServiceSettingInlineEdit.ts', import.meta.url), 'utf8')

  it('shows a small auto-closing top-right toast instead of a SweetAlert popup', async () => {
    const { showServiceSettingsSuccessToast, SERVICE_SETTINGS_SUCCESS_TOAST_ID } = await import('./components/serviceSettingsToast')

    showServiceSettingsSuccessToast('Cập nhật cấu hình dịch vụ thành công.', 'Đóng')

    expect(toastCustom).toHaveBeenCalledTimes(1)
    expect(toastCustom.mock.calls[0][1]).toEqual({ id: SERVICE_SETTINGS_SUCCESS_TOAST_ID, position: 'top-right', duration: 3000 })
  })

  it('the inline edit hook uses the toast for success and no longer uses SweetAlert', () => {
    expect(hook).not.toContain('SwalAlert')
    expect(hook).toMatch(/showServiceSettingsSuccessToast\(\s*getText\(dictionary, 'service_settings_update_success'/)
    expect(hook).toMatch(/getText\(dictionary, 'service_settings_close_toast', 'Close'\)/)
  })
})

describe('serviceSettingsService — search and update use the same API client', () => {
  it('calls the shared proxy with the selected service; only operation and payload differ', async () => {
    httpPost.mockResolvedValue({ status: 200, payload: { success: true, data: { items: [] } } })
    const { serviceSettingsService } = await import('./services/serviceSettingsService')
    const payload = { name: 'MaxUploadSize', value: 'string1', organization_id: 0, id: 25 }

    await serviceSettingsService.search('IPS')
    await serviceSettingsService.updateServiceSetting('IPS', payload)

    expect(httpPost).toHaveBeenNthCalledWith(1, '/api/system-settings/service-settings?service=IPS', {}, { baseUrl: '' })
    expect(httpPost).toHaveBeenNthCalledWith(2, '/api/system-settings/service-settings?service=IPS&operation=update', payload, { baseUrl: '' })
    expect(httpPost.mock.calls.some(([url]) => String(url).includes('/service-settings/update'))).toBe(false)
  })

  it('surfaces backend message and execution_id when update fails', async () => {
    httpPost.mockResolvedValue({ status: 400, payload: { success: false, message: 'Invalid value', execution_id: 'exec-9' } })
    const { serviceSettingsService, ServiceSettingsApiError } = await import('./services/serviceSettingsService')

    const error = await serviceSettingsService.updateServiceSetting('WFO', { name: 'A', value: 'b', organization_id: 0, id: 1 }).catch(caught => caught)

    expect(error).toBeInstanceOf(ServiceSettingsApiError)
    expect(error.message).toBe('Invalid value')
    expect(error.executionId).toBe('exec-9')
  })
})
