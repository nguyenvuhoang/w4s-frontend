import { describe, expect, it } from 'vitest'

import {
    empty_resident_filter,
    getResidentAppUsageColor,
    getResidentAppUsageLabel,
    getResidentBuildingSelectLabel,
    getResidentRoleFilterSelectLabel,
    parseResidentBuildingFilterValue,
    toResidentBuildingPayloadValue
} from './residentListHelpers'

const dictionary = {
    resident: {
        filter_app_usage_not_used: 'Chưa sử dụng',
        filter_app_usage_unknown: 'Chưa xác định',
        filter_app_usage_used: 'Đã sử dụng',
        filter_building_all_option: 'Tất cả tòa nhà'
    }
} as any

const buildingOptions = [
    { id: 12, building_code: 'A1', name: 'Tòa A1' }
] as any

describe('resident building filter', () => {
    it('uses an empty string for the all-resident-roles filter value', () => {
        expect(empty_resident_filter.role).toBe('')
    })

    it('renders the all label when the resident role filter value is empty', () => {
        expect(getResidentRoleFilterSelectLabel({ common: { all: 'Tất cả' } } as any, [], '')).toBe('Tất cả')
    })

    it('initializes the all-buildings filter with the all-buildings label', () => {
        expect(empty_resident_filter.building_id).toBe('')
        expect(getResidentBuildingSelectLabel(dictionary, buildingOptions, empty_resident_filter.building_id)).toBe('Tất cả tòa nhà')
    })

    it('keeps the all-buildings label after the empty option is selected', () => {
        const buildingId = parseResidentBuildingFilterValue('')

        expect(buildingId).toBe('')
        expect(getResidentBuildingSelectLabel(dictionary, buildingOptions, buildingId)).toBe('Tất cả tòa nhà')
    })

    it('restores the all-buildings value and label from the reset filter', () => {
        const resetFilter = { ...empty_resident_filter }

        expect(resetFilter.building_id).toBe('')
        expect(getResidentBuildingSelectLabel(dictionary, buildingOptions, resetFilter.building_id)).toBe('Tất cả tòa nhà')
    })

    it('preserves the backend empty-string contract and renders specific buildings by name', () => {
        expect(toResidentBuildingPayloadValue('')).toBe('')
        expect(parseResidentBuildingFilterValue('12')).toBe(12)
        expect(getResidentBuildingSelectLabel(dictionary, buildingOptions, 12)).toBe('[A1] Tòa A1')
    })
})

describe('resident app usage display', () => {
    it.each([
        ['USED', 'Đã sử dụng'],
        [' not_used ', 'Chưa sử dụng'],
        [null, 'Chưa xác định'],
        ['unknown', 'Chưa xác định']
    ])('maps %s to the normalized display label', (value, expected) => {
        expect(getResidentAppUsageLabel(dictionary, value)).toBe(expected)
    })

    it.each([
        ['USED', 'success'],
        ['NOT_USED', 'default'],
        [null, 'default'],
        ['unknown', 'default']
    ])('uses %s badge color', (value, expected) => {
        expect(getResidentAppUsageColor(value)).toBe(expected)
    })
})
