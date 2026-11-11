import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const source = readFileSync(new URL('./ResidentDetailLoadState.tsx', import.meta.url), 'utf8')
const pageSource = readFileSync(new URL('../ResidentDetailPage.tsx', import.meta.url), 'utf8')
const vi = JSON.parse(readFileSync(new URL('../../../../data/dictionaries/vi.json', import.meta.url), 'utf8'))
const en = JSON.parse(readFileSync(new URL('../../../../data/dictionaries/en.json', import.meta.url), 'utf8'))

describe('resident detail load states', () => {
    it('renders a not-found state without workflow metadata and hides detail content', () => {
        expect(source).toContain("state: 'not-found' | 'error'")
        expect(pageSource).toContain("detailPageState === 'ready' ?")
        expect(source).not.toContain('workflowStep')
        expect(source).not.toContain('errorCode')
    })

    it('uses refresh retry state and the locale-aware resident list route', () => {
        expect(pageSource).toContain('router.refresh()')
        expect(pageSource).toContain('retrying={retrying}')
        expect(pageSource).toContain('const listHref = `/${locale}/resident/list`')
    })

    it('keeps related-apartment errors scoped to that section with their execution id', () => {
        expect(pageSource).toContain('<ContextErrorAlert dictionary={dictionary} error={contextResult.error} />')
        expect(pageSource).toContain('getResidentDetailFallbackFields(residentDetail)')
    })

    it('provides Vietnamese and English copy', () => {
        expect(vi.resident.detail_not_found_title).toBe('Không tìm thấy hồ sơ cư dân')
        expect(en.resident.detail_not_found_title).toBe('Resident record not found')
        expect(en.resident.detail_not_found_back).toBe('Back to resident list')
    })
})
