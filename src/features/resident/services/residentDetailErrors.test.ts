import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const source = readFileSync(new URL('./residentService.ts', import.meta.url), 'utf8')

describe('resident detail workflow errors', () => {
    it('keeps structured workflow error fields instead of flattening errors to a string', () => {
        expect(source).toContain("import { createWorkflowError } from '@/shared/utils/workflowError'")
        expect(source).toContain('throw createWorkflowError(response, { fallback })')
    })
})
