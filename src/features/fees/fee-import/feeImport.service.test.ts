import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/env.mjs', () => ({ env: { NEXT_PUBLIC_APPLICATION_CODE: 'BO' } }))

import { feeImportService } from './feeImport.service'

const fetchMock = vi.fn()
const file = new File([new Uint8Array([80, 75])], 'fees.xlsx')

const submitImport = async (notes: string) => {
  await feeImportService.import(file, 16, 'P16', 7, 'SKIP', notes, 'vi', 'failed')
  const [path, init] = fetchMock.mock.calls[0]

  return { path, init, body: init.body as FormData }
}

describe('feeImportService.import', () => {
  beforeEach(() => {
    fetchMock.mockReset().mockResolvedValue(new Response(JSON.stringify({ success: true, data: {} }), { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('sends the trimmed description as notes alongside the existing import fields', async () => {
    const { path, init, body } = await submitImport('  Phí tháng 10  ')

    expect(path).toBe('/api/fees/excel-import')
    expect(body.get('notes')).toBe('Phí tháng 10')
    expect(body.get('ProjectId')).toBe('16')
    expect(body.get('FeePeriodId')).toBe('7')
    expect(body.get('DuplicatePolicy')).toBe('SKIP')
    expect(body.get('File')).toBeInstanceOf(File)
    expect(init.headers).not.toHaveProperty('Content-Type')
  })

  it('omits notes when the description is empty or whitespace only', async () => {
    const { body } = await submitImport('   ')

    expect(body.has('notes')).toBe(false)
    expect(body.get('File')).toBeInstanceOf(File)
  })
})
