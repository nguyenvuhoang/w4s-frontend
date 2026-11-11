import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import type { ApartmentDetailApartment } from './types'

// Only the HTTP call is mocked: the real workflowService.runFODynamic + createDefaultBody build the request body, so
// this asserts the exact `{ workflowid, fields }` sent for WF_BO_UPDATE_APARTMENT.
const { apiPost } = vi.hoisted(() => ({ apiPost: vi.fn() }))

vi.mock('@/env.mjs', () => ({ env: { NEXT_PUBLIC_APPLICATION_CODE: 'BO' } }))
// Transport layer (reads the real .env): never reached since apiPost itself is mocked.
vi.mock('@/servers/lib/http', () => ({ default: {}, isClient: false }))
vi.mock('@/servers/lib/api', async importOriginal => ({ ...(await importOriginal<typeof import('@/servers/lib/api')>()), apiPost }))

let helpers: typeof import('./apartmentEditHelpers')
let service: typeof import('./services/apartmentSearchService')

beforeAll(async () => {
  helpers = await import('./apartmentEditHelpers')
  service = await import('./services/apartmentSearchService')
})

beforeEach(() => {
  apiPost.mockReset()
  apiPost.mockResolvedValue({ success: true, code: 'success', errors: [], data: {} })
})

const detail: ApartmentDetailApartment = {
  id: 13, project_id: 1, building_id: 1, floor_id: 1, apartment_code: 'AG-03-02', project_code: 'AG', building_code: 'AG',
  floor_code: 'AG-03', floor: '03', unit_number: '02', apartment_type: 'APARTMENT', area: 0, water_meter_code: 'W1-AG-03-02',
  water_meter_code2: '', electric_meter_code: '', electricity_meter_code: '', room_count: 1, handover_date: '', description: '',
  payment_qr_code: null, apartment_status: 'LEASED', status: 'A'
}

/** Same chain as useApartmentEditForm.submit: form values -> buildApartmentUpdateRequest -> updateApartment. */
const submit = async (changes: Partial<ReturnType<typeof helpers.buildApartmentEditValues>>) => {
  const values = { ...helpers.buildApartmentEditValues(detail), ...changes }

  await service.apartmentSearchService.updateApartment({
    sessiontoken: 'token',
    language: 'vi',
    request: helpers.buildApartmentUpdateRequest(detail.id, values, { buildingCode: 'AG', floorNo: '03' }, {
      water_meter_code2: detail.water_meter_code2,
      electric_meter_code: detail.electric_meter_code
    })
  })

  expect(apiPost).toHaveBeenCalledTimes(1)

  return apiPost.mock.calls[0][1] as { workflowid: string; fields: Record<string, unknown> }
}

describe('WF_BO_UPDATE_APARTMENT workflow request (final body)', () => {
  it('initial form state carries the detail apartment_status (LEASED)', () => {
    expect(helpers.buildApartmentEditValues(detail).apartment_status).toBe('LEASED')
    expect(helpers.buildApartmentEditValues({ ...detail, apartment_status: 'OCCUPIED' }).apartment_status).toBe('OCCUPIED')
  })

  it('LEASED -> VACANT: the body sent has apartment_status "VACANT" and status "A", with all 17 fields', async () => {
    const body = await submit({ apartment_status: 'VACANT' })

    expect(body).toEqual({
      workflowid: 'WF_BO_UPDATE_APARTMENT',
      fields: expect.objectContaining({ apartment_status: 'VACANT', status: 'A' })
    })
    expect(body.fields).toEqual({
      id: 13,
      building_id: 1,
      floor_id: 1,
      apartment_code: 'AG-03-02',
      unit_number: '02',
      floor: '03',
      water_meter_code: 'W1-AG-03-02',
      water_meter_code2: '',
      electric_meter_code: '',
      electricity_meter_code: '',
      apartment_type: 'APARTMENT',
      apartment_status: 'VACANT',
      area: '0',
      room_count: 1,
      handover_date: '',
      description: '',
      status: 'A'
    })
    expect(body.fields.apartment_status).not.toBe('Căn hộ trống')
  })

  it('apartment_status and status are independent fields of the same body', async () => {
    const both = await submit({ apartment_status: 'VACANT', status: 'I' })

    expect(both.fields).toMatchObject({ apartment_status: 'VACANT', status: 'I' })

    apiPost.mockClear()
    const statusOnly = await submit({ status: 'I' })

    expect(statusOnly.fields).toMatchObject({ apartment_status: 'LEASED', status: 'I' })
  })

  it('unchanged legacy value is sent back as is', async () => {
    const body = await submit({ apartment_status: 'LEGACY_STATUS' })

    expect(body.fields.apartment_status).toBe('LEGACY_STATUS')
  })
})
