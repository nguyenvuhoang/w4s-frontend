import { readFileSync } from 'node:fs'
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

const { runFODynamic, hookState } = vi.hoisted(() => ({
  runFODynamic: vi.fn(),
  hookState: { cursor: 0, slots: {} as Record<number, unknown> }
}))

// Run the hook outside React: state/ref slots survive between "renders" (see buildingCreate.test.ts).
vi.mock('react', async importOriginal => {
  const actual = await importOriginal<typeof import('react')>()

  const useState = (initial: unknown) => {
    const index = hookState.cursor++

    if (!(index in hookState.slots)) hookState.slots[index] = initial

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

  return { ...actual, default: { ...actual, useState, useRef }, useState, useRef }
})

vi.mock('@/servers/system-service', () => ({ workflowService: { runFODynamic } }))

let useProjectDelete: typeof import('./hooks/useProjectDelete').useProjectDelete
let propertyAggregateService: typeof import('../propertyAggregateService').propertyAggregateService

beforeAll(async () => {
  ;({ useProjectDelete } = await import('./hooks/useProjectDelete'))
  ;({ propertyAggregateService } = await import('../propertyAggregateService'))
})

const onDeleted = vi.fn()

const renderHook = (projectId = 14) => {
  hookState.cursor = 0

  return useProjectDelete({ projectId, sessiontoken: 'token', language: 'vi', fallbackError: 'Không thể xóa dự án.', onDeleted })
}

beforeEach(() => {
  hookState.cursor = 0
  hookState.slots = {}
  onDeleted.mockReset()
  runFODynamic.mockReset()
  runFODynamic.mockResolvedValue({ success: true, code: 'success', data: {}, errors: [] })
})

describe('propertyAggregateService.delete_project_detail', () => {
  it('calls WF_BO_DELETE_PROJECT with only { id }', async () => {
    await propertyAggregateService.delete_project_detail({ sessiontoken: 'token', language: 'vi', id: 14 })

    expect(runFODynamic).toHaveBeenCalledTimes(1)
    expect(runFODynamic.mock.calls[0][0].workflowid).toBe('WF_BO_DELETE_PROJECT')
    expect(runFODynamic.mock.calls[0][0].input).toEqual({ id: 14 })
  })

  it('rejects the backend business error with its execution reference', async () => {
    runFODynamic.mockResolvedValue({ success: false, code: 'failed', errors: [{ info: 'Project is in use' }], execution_id: 'EXEC-P' })

    await expect(propertyAggregateService.delete_project_detail({ sessiontoken: 'token', language: 'vi', id: 14 }))
      .rejects.toThrow('Project is in use Mã tra cứu lỗi: EXEC-P')
  })
})

describe('useProjectDelete', () => {
  it('opens the confirmation without calling the workflow, and Cancel never calls it', () => {
    renderHook().requestDelete()
    expect(renderHook().open).toBe(true)

    renderHook().cancel()

    expect(renderHook().open).toBe(false)
    expect(runFODynamic).not.toHaveBeenCalled()
  })

  it('confirm sends the route project id and calls onDeleted only after success', async () => {
    renderHook(27).requestDelete()
    await renderHook(27).confirm()

    expect(runFODynamic).toHaveBeenCalledTimes(1)
    expect(runFODynamic.mock.calls[0][0].input).toEqual({ id: 27 })
    expect(onDeleted).toHaveBeenCalledTimes(1)
    expect(renderHook(27).open).toBe(false)
  })

  it('a failure keeps the dialog open with the backend message and does not navigate or retry', async () => {
    runFODynamic.mockResolvedValue({ success: false, code: 'failed', errors: [{ info: 'Project still has towers' }] })

    renderHook().requestDelete()
    await renderHook().confirm()

    const state = renderHook()

    expect(state.open).toBe(true)
    expect(state.error).toBe('Project still has towers')
    expect(state.deleting).toBe(false)
    expect(onDeleted).not.toHaveBeenCalled()
    expect(runFODynamic).toHaveBeenCalledTimes(1)
  })

  it('blocks double-submit while the request is in flight', async () => {
    let resolve: (value: unknown) => void = () => {}

    runFODynamic.mockReturnValue(new Promise(r => { resolve = r }))

    renderHook().requestDelete()
    const first = renderHook().confirm()

    await renderHook().confirm()
    await renderHook().confirm()
    renderHook().cancel()

    expect(renderHook().deleting).toBe(true)
    expect(renderHook().open).toBe(true)

    resolve({ success: true, code: 'success', data: {}, errors: [] })
    await first

    expect(runFODynamic).toHaveBeenCalledTimes(1)
    expect(onDeleted).toHaveBeenCalledTimes(1)
  })
})

describe('ProjectDetailPage delete action', () => {
  const page = readFileSync(new URL('./ProjectDetailPage.tsx', import.meta.url), 'utf8')

  it('renders a red DeleteOutline button in the action bar, guarded by the business DELETE right', () => {
    const actionBar = page.slice(page.indexOf('<PropertiesActionBar>'), page.indexOf('</PropertiesActionBar>'))

    expect(page).toMatch(/color="error" startIcon={<DeleteOutlineIcon \/>}/)
    expect(actionBar).toContain('deleteButton')
    expect(actionBar).toContain('action="DELETE"')
  })

  it('returns to the project list only from the success alert callback', () => {
    const onDeletedBlock = page.slice(page.indexOf('onDeleted: () => {'), page.indexOf('const deleteButton'))

    expect(onDeletedBlock).toContain("SwalAlert(")
    expect(onDeletedBlock.indexOf('SwalAlert(')).toBeLessThan(onDeletedBlock.indexOf('router.push(`/${locale}${listHref}`)'))
  })
})
