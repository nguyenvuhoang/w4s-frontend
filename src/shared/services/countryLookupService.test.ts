import { describe, expect, it } from 'vitest'

import { countryLookupLabel, mapCountrySearchResponse } from './countryLookupService'

describe('countryLookupService', () => {
    const country = {
        country_id: 'VN',
        country_code: 'VN',
        country_name: 'Vietnam',
        m_country_name: '{"vi":"Việt Nam","en":"Vietnam"}',
        status: 'A'
    }

    it('uses the safely parsed localized country name for the current locale', () => {
        expect(countryLookupLabel(country, 'vi')).toBe('Việt Nam')
        expect(countryLookupLabel(country, 'en')).toBe('Vietnam')
    })

    it('falls back to country_name when the localized name is invalid or missing', () => {
        expect(countryLookupLabel({ ...country, m_country_name: '{invalid' }, 'vi')).toBe('Vietnam')
        expect(countryLookupLabel({ ...country, m_country_name: '{"en":"Vietnam"}' }, 'vi')).toBe('Vietnam')
    })

    it('preserves the zero-based country workflow pagination response', () => {
        expect(mapCountrySearchResponse({
            data: {
                items: [country],
                total_count: 1,
                total_pages: 1,
                page_index: 0,
                page_size: 20
            }
        }, { search_text: '', page_index: 0, page_size: 20, status: 'A', exclude_deleted: true })).toMatchObject({
            items: [{ country_id: 'VN', country_code: 'VN' }],
            total_count: 1,
            page_index: 0,
            page_size: 20
        })
    })
})
