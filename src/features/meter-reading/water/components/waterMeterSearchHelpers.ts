import type { WaterMeterSearchFilter } from '../types'

export const empty_water_search_filter: WaterMeterSearchFilter = {
    project_id: null,
    building_id: null,
    apartment_id: null,
    water_meter_period_id: null,
    search_text: '',
    page_index: 0,
    page_size: 10
}
