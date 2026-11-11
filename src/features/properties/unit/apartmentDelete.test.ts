import { readFileSync } from 'node:fs'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

const { runFODynamic, hookState, buttons } = vi.hoisted(() => ({
  runFODynamic: vi.fn(),
  hookState: { slots: [] as unknown[], index: 0 },
  buttons: [] as Array<Record<string, any>>
}))

vi.mock('@/servers/system-service', () => ({ workflowService: { runFODynamic } }))
vi.mock('@/features/properties/building/buildingService', () => ({ buildingService: {} }))

// Minimal hook runner: useState keeps its slots between "renders" of the hook under test.
vi.mock('react', async importOriginal => {
  const actual = await importOriginal<typeof import('react')>()

  return {
    ...actual,
    useState: (initial: unknown) => {
      const slot = hookState.index++

      if (!(slot in hookState.slots)) hookState.slots[slot] = typeof initial === 'function' ? (initial as () => unknown)() : initial

      return [hookState.slots[slot], (next: unknown) => {
        hookState.slots[slot] = typeof next === 'function' ? (next as (value: unknown) => unknown)(hookState.slots[slot]) : next
      }]
    }
  }
})

vi.mock('@mui/material', async () => {
  const { createElement: h, Fragment } = await import('react')
  const Stub = ({ children }: { children?: React.ReactNode }) => h(Fragment, null, children ?? null)
  const Button = (props: Record<string, any>) => {
    buttons.push(props)

    return h(Fragment, null, props.children ?? null)
  }

  return { Alert: Stub, Button, Dialog: Stub, DialogActions: Stub, DialogContent: Stub, DialogTitle: Stub, Stack: Stub, Typography: Stub }
})

let service: typeof import('./services/apartmentSearchService')
let useApartmentDelete: typeof import('./hooks/useApartmentDelete').useApartmentDelete
let ApartmentDeleteDialog: typeof import('./ApartmentDeleteDialog').default

beforeAll(async () => {
  service = await import('./services/apartmentSearchService')
  ;({ useApartmentDelete } = await import('./hooks/useApartmentDelete'))
  ;({ default: ApartmentDeleteDialog } = await import('./ApartmentDeleteDialog'))
})

beforeEach(() => {
  runFODynamic.mockReset()
  runFODynamic.mockResolvedValue({ success: true, code: 'success', errors: [], data: {} })
  hookState.slots = []
  buttons.length = 0
})

// Each hook "render" reads its useState slots from the start again.
const rewindHookSlots = () => { hookState.index = 0 }
const readSource = (file: string) => readFileSync(new URL(file, import.meta.url), 'utf8')
const dictionary = { propertyManagement: {}, common: {} } as any

describe('WF_BO_DELETE_APARTMENT contract', () => {
  it('sends exactly { id } (no apartment_id / project_id / building_id / floor_id / extras)', async () => {
    await service.apartmentSearchService.deleteApartment({ sessiontoken: 'token', id: 19400 })

    const call = runFODynamic.mock.calls[0][0]

    expect(call.workflowid).toBe('WF_BO_DELETE_APARTMENT')
    expect(call.input).toEqual({ id: 19400 })
  })

  it('rejects on a Backend refusal with the message and the error reference (never treated as success)', async () => {
    runFODynamic.mockResolvedValue({ success: false, code: 'failed', errors: [{ info: 'Apartment still has residents' }], execution_id: 'EXEC-DEL' })

    await expect(service.apartmentSearchService.deleteApartment({ sessiontoken: 'token', language: 'vi', id: 19400 }))
      .rejects.toThrow('Apartment still has residents Mã tra cứu lỗi: EXEC-DEL')
  })
})

describe('delete flow (confirm -> workflow -> success / error)', () => {
  const setup = () => {
    const onDeleted = vi.fn()
    // Named like a hook: it re-runs useApartmentDelete as React would on each render.
    const useRender = () => {
      rewindHookSlots()

      return useApartmentDelete({ dictionary, sessiontoken: 'token', language: 'vi', onDeleted })
    }

    return { onDeleted, render: useRender }
  }

  it('"Xóa" only opens the confirmation; cancelling never calls the workflow', () => {
    const { render } = setup()

    render().requestDelete(19400)
    expect(render().open).toBe(true)
    expect(runFODynamic).not.toHaveBeenCalled()

    render().cancel()
    expect(render().open).toBe(false)
    expect(runFODynamic).not.toHaveBeenCalled()
  })

  it('success: calls the workflow with the viewed apartment id, then onDeleted (notify + navigate)', async () => {
    const { render, onDeleted } = setup()

    render().requestDelete(19400)
    await render().confirm()

    expect(runFODynamic.mock.calls[0][0].input).toEqual({ id: 19400 })
    expect(onDeleted).toHaveBeenCalledTimes(1)
    expect(render().open).toBe(false)
  })

  it('error: keeps the dialog open with the Backend message + reference, no onDeleted', async () => {
    runFODynamic.mockResolvedValue({ success: false, code: 'failed', errors: [{ info: 'Apartment still has residents' }], execution_id: 'EXEC-DEL' })
    const { render, onDeleted } = setup()

    render().requestDelete(19400)
    await render().confirm()

    expect(onDeleted).not.toHaveBeenCalled()
    expect(render().open).toBe(true)
    expect(render().error).toBe('Apartment still has residents Mã tra cứu lỗi: EXEC-DEL')
    expect(render().deleting).toBe(false)
  })

  it('no double submit: while deleting, confirm and cancel do nothing', async () => {
    let resolve: (value: unknown) => void = () => undefined

    runFODynamic.mockReturnValue(new Promise(done => { resolve = done }))
    const { render, onDeleted } = setup()

    render().requestDelete(19400)
    const pending = render().confirm()

    expect(render().deleting).toBe(true)
    await render().confirm()
    render().cancel()
    expect(runFODynamic).toHaveBeenCalledTimes(1)
    expect(render().open).toBe(true)

    resolve({ success: true, code: 'success', errors: [], data: {} })
    await pending
    expect(onDeleted).toHaveBeenCalledTimes(1)
  })
})

describe('confirmation dialog', () => {
  const render = (props: Record<string, any> = {}) => renderToStaticMarkup(createElement(ApartmentDeleteDialog, {
    dictionary: {
      propertyManagement: { deleteApartment: 'Xóa căn hộ', deleteApartmentConfirm: 'Bạn có chắc chắn muốn xóa căn hộ này không?' },
      common: { cancel: 'Hủy', delete: 'Xóa', processing: 'Đang xử lý...' }
    } as any,
    open: true,
    deleting: false,
    error: null,
    apartmentCode: 'A1-01-55',
    onCancel: vi.fn(),
    onConfirm: vi.fn(),
    ...props
  }))

  it('shows title, message, the apartment code, Hủy and Xóa', () => {
    const html = render()

    for (const text of ['Xóa căn hộ', 'Bạn có chắc chắn muốn xóa căn hộ này không?', 'A1-01-55', 'Hủy', 'Xóa']) expect(html).toContain(text)
  })

  it('while deleting: confirm and cancel are disabled and show progress', () => {
    const html = render({ deleting: true })

    expect(buttons.map(button => button.disabled)).toEqual([true, true])
    expect(html).toContain('Đang xử lý...')
  })

  it('shows the workflow error inside the dialog', () => {
    expect(render({ error: 'Apartment still has residents Mã tra cứu lỗi: EXEC-DEL' })).toContain('Mã tra cứu lỗi: EXEC-DEL')
  })
})

describe('detail page wiring and mock cleanup', () => {
  const detail = readSource('./ApartmentDetailPage.tsx')

  it('Xóa button is guarded by DELETE and only requests the confirmation', () => {
    const guard = detail.slice(detail.indexOf('<PermissionGuard href="/properties/unit" action="DELETE">'), detail.indexOf('</PermissionGuard>', detail.indexOf('action="DELETE"')))
    const click = detail.slice(detail.indexOf('const handleDeleteClick = () => {'), detail.indexOf('const refresh = async'))

    expect(guard).toContain('onClick={handleDeleteClick}')
    expect(click).toContain('apartmentDelete.requestDelete(apartmentId)')
    expect(click).not.toMatch(/deleteApartment\(|confirm\(\)/)
  })

  it('success notifies and goes back to /{locale}/properties/unit (list reloads from the Backend search)', () => {
    const onDeleted = detail.slice(detail.indexOf('const apartmentDelete = useApartmentDelete({'), detail.indexOf('if (error || !detail.apartment)'))

    expect(onDeleted).toContain("SwalAlert('success', apartmentText(dictionary, 'deleteApartmentSuccess', 'Apartment deleted successfully.'), 'center')")
    expect(onDeleted).toContain('router.push(`/${locale}/properties/unit`)')
  })

  it('only navigates after the Backend succeeded; errors keep the dialog and the record', () => {
    const hook = readSource('./hooks/useApartmentDelete.ts')
    const confirm = hook.slice(hook.indexOf('const confirm = async'), hook.indexOf('return { open'))
    const tryBlock = confirm.slice(confirm.indexOf('try {'), confirm.indexOf('} catch'))
    const catchBlock = confirm.slice(confirm.indexOf('} catch'), confirm.indexOf('} finally'))

    expect(tryBlock.indexOf('await apartmentSearchService.deleteApartment')).toBeLessThan(tryBlock.indexOf('await onDeleted()'))
    expect(catchBlock).toContain('setError(')
    expect(catchBlock).not.toMatch(/onDeleted|setTargetId\(null\)/)
  })

  it('production delete no longer uses the local-memory mock', () => {
    const aggregate = readFileSync(new URL('../propertyAggregateService.ts', import.meta.url), 'utf8')

    expect(detail).not.toMatch(/propertyAggregateService|delete_apartment|apartments_seed/)
    expect(aggregate).not.toContain('delete_apartment')
  })
})
