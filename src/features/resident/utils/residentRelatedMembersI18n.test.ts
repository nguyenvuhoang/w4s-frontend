import { readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'

const readDictionary = (locale: string) => JSON.parse(readFileSync(new URL(`../../../data/dictionaries/${locale}.json`, import.meta.url), 'utf8')).resident as Record<string, string>

describe('related member translations', () => {
    it('provides matching, non-empty Vietnamese and English keys', () => {
        const vi = readDictionary('vi')
        const en = readDictionary('en')
        const keys = Object.keys(vi).filter(key => key.startsWith('related_members_'))

        expect(keys.length).toBeGreaterThan(0)
        expect(keys.sort()).toEqual(Object.keys(en).filter(key => key.startsWith('related_members_')).sort())

        for (const key of keys) {
            expect(vi[key].trim()).not.toBe('')
            expect(en[key].trim()).not.toBe('')
            expect(vi[key]).not.toMatch(/Ã|Â|Ä|áº|á»|Æ|\uFFFD/)
        }

        expect(vi.related_members_title).toBe('Thông tin mở rộng')
        expect(vi.related_members_add).toBe('Thêm trường')
        expect(en.related_members_title).toBe('Related Members')
    })
})
