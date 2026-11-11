import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const state = vi.hoisted(() => ({ cursor: 0, slots: [] as unknown[] }))

vi.mock('react', () => ({
  useRef(initial: unknown) {
    const index = state.cursor++

    return state.slots[index] ?? (state.slots[index] = { current: initial })
  },
  useState(initial: unknown) {
    const index = state.cursor++

    if (!(index in state.slots)) state.slots[index] = initial

    return [state.slots[index], (next: unknown) => { state.slots[index] = next }]
  }
}))

import { useDataMigrationTransfer } from './useDataMigrationTransfer'

const fetchMock = vi.fn<typeof fetch>()
const click = vi.fn()
const remove = vi.fn()
const renderTransfer = () => {
  state.cursor = 0

  // The mocked hooks use test slots and do not require a React renderer.
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return useDataMigrationTransfer('vi')
}

beforeEach(() => {
  state.slots = []
  fetchMock.mockReset()
  click.mockReset()
  remove.mockReset()
  vi.stubGlobal('fetch', fetchMock)
  vi.stubGlobal('document', {
    createElement: () => ({ click, remove }),
    body: { appendChild: vi.fn() }
  })
  vi.stubGlobal('window', { setTimeout: globalThis.setTimeout })
  vi.useFakeTimers()
})

afterEach(() => {
  vi.runOnlyPendingTimers()
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('Data Migration export state', () => {
  it('blocks duplicate exports and keeps the overlay active until the ZIP download is handled', async () => {
    let respond!: (response: Response) => void

    fetchMock.mockReturnValueOnce(new Promise(resolve => { respond = resolve }))
    click.mockImplementation(() => expect(renderTransfer().pending).toBe('export'))

    const transfer = renderTransfer()
    const running = transfer.exportZip('cth', ['C_CODELIST', 'UserRight'])

    expect(renderTransfer().pending).toBe('export')
    await expect(transfer.exportZip('cth', ['Setting'])).resolves.toBe(false)
    expect(fetchMock).toHaveBeenCalledTimes(1)

    const [, request] = fetchMock.mock.calls[0]

    expect(JSON.parse(String(request?.body))).toEqual({
      table_names: ['C_CODELIST', 'UserRight'], format: 'Json', batch_size: 0
    })
    expect(new Headers(request?.headers).get('accept')).toBe('application/zip')

    const zip = new Uint8Array([80, 75, 5, 6, ...Array(18).fill(0)])

    respond(new Response(zip, { headers: { 'content-type': 'application/zip' } }))
    await expect(running).resolves.toBe(true)
    expect(click).toHaveBeenCalledOnce()
    expect(remove).toHaveBeenCalledOnce()
    expect(renderTransfer().pending).toBeNull()
    expect(renderTransfer().result).toEqual({ operation: 'export' })
  })

  it('closes the overlay and preserves the execution reference on a JSON failure', async () => {
    fetchMock.mockResolvedValueOnce(Response.json({ execution_id: 'export-ref' }, { status: 502 }))

    const running = renderTransfer().exportZip('cms', ['Setting'])

    expect(renderTransfer().pending).toBe('export')
    await expect(running).resolves.toBe(false)
    expect(renderTransfer().pending).toBeNull()
    expect(renderTransfer().result?.error?.executionId).toBe('export-ref')
    expect(click).not.toHaveBeenCalled()
  })

  it('closes the overlay when the request is aborted', async () => {
    fetchMock.mockRejectedValueOnce(new DOMException('Request aborted', 'AbortError'))

    const running = renderTransfer().exportZip('cms', ['Setting'])

    expect(renderTransfer().pending).toBe('export')
    await expect(running).resolves.toBe(false)
    expect(renderTransfer().pending).toBeNull()
    expect(click).not.toHaveBeenCalled()
  })

  it.each(['empty', 'truncated'])('rejects an %s ZIP without downloading it', async kind => {
    const body = kind === 'empty' ? new Uint8Array() : new Uint8Array([80, 75, 3, 4])

    fetchMock.mockResolvedValueOnce(new Response(body, { headers: { 'content-type': 'application/zip' } }))

    await expect(renderTransfer().exportZip('cms', ['Setting'])).resolves.toBe(false)
    expect(renderTransfer().pending).toBeNull()
    expect(renderTransfer().result?.error?.invalidZip).toBe(true)
    expect(click).not.toHaveBeenCalled()
  })
})

describe('Data Migration import state', () => {
  it('opens the overlay, blocks repeat submissions, and reports the backend description', async () => {
    let respond!: (response: Response) => void

    fetchMock.mockReturnValueOnce(new Promise(resolve => { respond = resolve }))

    const transfer = renderTransfer()
    const file = new File([new Uint8Array([80, 75, 5, 6, ...Array(18).fill(0)])], 'config.zip')
    const running = transfer.importZip('cth', file, true)

    expect(renderTransfer().pending).toBe('import')
    await expect(transfer.importZip('cth', file, false)).resolves.toBe(false)
    expect(fetchMock).toHaveBeenCalledTimes(1)

    const [url, request] = fetchMock.mock.calls[0]

    expect(url).toContain('service=cth&preserveIdentity=true')
    expect(new Headers(request?.headers).has('content-type')).toBe(false)
    expect((request?.body as FormData).get('file')).toMatchObject({ name: 'config.zip', size: file.size })

    respond(Response.json({ success: true, description: 'Imported by backend' }))
    await expect(running).resolves.toBe(true)
    expect(renderTransfer().pending).toBeNull()
    expect(renderTransfer().result).toEqual({ operation: 'import', description: 'Imported by backend' })
    expect(click).not.toHaveBeenCalled()
  })

  it('closes the overlay and preserves the error reference after a rejected import', async () => {
    fetchMock.mockResolvedValueOnce(Response.json({ execution_id: 'import-ref' }, { status: 413 }))

    await expect(renderTransfer().importZip('cms', new File(['zip'], 'config.zip'), false)).resolves.toBe(false)
    expect(renderTransfer().pending).toBeNull()
    expect(renderTransfer().result?.error).toMatchObject({ status: 413, executionId: 'import-ref' })
  })
})
