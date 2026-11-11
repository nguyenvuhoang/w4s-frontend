import { beforeAll, describe, expect, it } from 'vitest'

import type { ApartmentPayload } from './types'

process.env.NEXT_PUBLIC_REST_API_ENDPOINT ??= 'https://backend.example.com/api/v1/gateway'
process.env.NEXT_PUBLIC_APP_URL ??= 'https://portal.example.com'

let propertyAggregateService: typeof import('./propertyAggregateService').propertyAggregateService

beforeAll(async () => {
  ({ propertyAggregateService } = await import('./propertyAggregateService'))
})

describe('propertyAggregateService.create_apartment', () => {
  it('persists optional meter codes without surrounding whitespace', async () => {
    const payload = {
      project_code: 'O24_RESIDENTIAL',
      building_code: 'A',
      floor_code: 'A12',
      apartment_code: 'METER_TEST_001',
      apartment_no: '1201',
      area: 70,
      owner_name: '',
      water_meter_code: '  WM-001  ',
      electricity_meter_code: '  EM-001  ',
      qr_payment_enabled: false,
      status: 'vacant' as const,
      description: ''
    } satisfies ApartmentPayload

    const apartment = await propertyAggregateService.create_apartment(payload)

    expect(apartment.water_meter_code).toBe('WM-001')
    expect(apartment.electricity_meter_code).toBe('EM-001')
  })

  it('accepts empty optional meter codes', async () => {
    const apartment = await propertyAggregateService.create_apartment({
      project_code: 'O24_RESIDENTIAL',
      building_code: 'A',
      floor_code: 'A12',
      apartment_code: 'METER_TEST_002',
      apartment_no: '1202',
      area: 70,
      owner_name: '',
      water_meter_code: '',
      electricity_meter_code: '',
      qr_payment_enabled: false,
      status: 'vacant',
      description: ''
    })

    expect(apartment.electricity_meter_code).toBe('')
  })
})
