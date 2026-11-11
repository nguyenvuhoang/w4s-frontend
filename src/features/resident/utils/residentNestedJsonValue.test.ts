import { describe, expect, it } from 'vitest'

import { extensionItem, extensionResponse } from '../services/residentRelatedMembers.test-fixtures'
import { buildResidentExtensionDataRequest, toResidentExtensionDrafts } from '../services/residentRelatedMembers.mapper'
import { changedResidentExtensionDrafts, summarizeRelatedMembers } from './residentRelatedMembers'
import {
    addNestedJsonField, childKeyIssues, isNestedJsonValue, nestedJsonTreeFromString, nestedJsonTreeFromText, parseNestedJsonValue,
    removeNestedJsonNode, setNestedJsonKey, setNestedJsonLeafValue, stringifyNestedJsonTree, toggleNestedJsonCollapsed,
    validateNestedJsonTree, type NestedJsonContainer, type NestedJsonNode
} from './residentNestedJsonValue'

const DEFAULT_KEY = 'Giá trị'

const children = (node: NestedJsonNode) => {
    if (node.kind === 'value') throw new Error('not a group')

    return node.children
}

const findNode = (node: NestedJsonNode, id: string): NestedJsonNode | undefined => {
    if (node.id === id) return node
    if (node.kind === 'value') return undefined
    for (const child of node.children) {
        const found = findNode(child, id)

        if (found) return found
    }

    return undefined
}

/** Simulates the user: fill the field just created by `+`. */
const fill = (tree: NestedJsonContainer, id: string, key: string, value?: string) => {
    const named = setNestedJsonKey(tree, id, key)

    return value === undefined ? named : setNestedJsonLeafValue(named, id, value)
}

const expectedValue = {
    'Tên': 'Nguyễn Văn A',
    'Số điện thoại': '038886133663',
    'Địa chỉ': { 'Tỉnh': 'TP.HCM', 'Ghi chú': 'Người thân' }
}

// Builds the task sample purely through editor operations: `+` on an empty value, then `+` on rows.
const buildSampleTree = () => {
    let { tree, newId } = nestedJsonTreeFromText('', DEFAULT_KEY)

    tree = fill(tree, newId, 'Tên', 'Nguyễn Văn A')
    let step = addNestedJsonField(tree, tree.id, DEFAULT_KEY)

    tree = fill(step.tree, step.newId, 'Số điện thoại', '038886133663')
    step = addNestedJsonField(tree, tree.id, DEFAULT_KEY)
    const addressId = step.newId

    tree = fill(step.tree, addressId, 'Địa chỉ')
    step = addNestedJsonField(tree, addressId, DEFAULT_KEY)
    tree = fill(step.tree, step.newId, 'Tỉnh', 'TP.HCM')
    step = addNestedJsonField(tree, addressId, DEFAULT_KEY)

    return fill(step.tree, step.newId, 'Ghi chú', 'Người thân')
}

describe('nested value parse/stringify', () => {
    it('only treats valid JSON objects/arrays as nested values', () => {
        expect(parseNestedJsonValue('{"a":1}')).toEqual({ a: 1 })
        expect(parseNestedJsonValue('  [1,"x"]  ')).toEqual([1, 'x'])

        for (const raw of ['', 'Nguyễn Văn A', '123', 'true', 'null', '"text"', '{abc}', '{"a":', '[1,2', '{} trailing', undefined, null]) {
            expect(parseNestedJsonValue(raw)).toBeNull()
            expect(isNestedJsonValue(raw)).toBe(false)
            expect(nestedJsonTreeFromString(raw)).toBeNull()
        }
    })

    it('produces exactly the task sample payload: one JSON string in `value`', () => {
        const value = stringifyNestedJsonTree(buildSampleTree())

        expect(value).toBe('{"Tên":"Nguyễn Văn A","Số điện thoại":"038886133663","Địa chỉ":{"Tỉnh":"TP.HCM","Ghi chú":"Người thân"}}')
        expect(JSON.parse(value)).toEqual(expectedValue)
    })

    it('round-trips save -> reload -> save to the same string, preserving scalar types, key order and legacy lists', () => {
        const stored = JSON.stringify({ a: 1, b: true, c: null, d: [1, { e: 'x' }, []], f: {}, ' khóa có khoảng trắng ': 'Giá trị' })
        const tree = nestedJsonTreeFromString(stored)!

        expect(stringifyNestedJsonTree(tree)).toBe(stored)
        expect(stringifyNestedJsonTree(nestedJsonTreeFromString(stringifyNestedJsonTree(tree))!)).toBe(stored)
        expect(stringifyNestedJsonTree(nestedJsonTreeFromString('[{"a":"1"},"x"]')!)).toBe('[{"a":"1"},"x"]')
    })

    it('supports 5 levels of nesting built with `+`', () => {
        let tree = nestedJsonTreeFromText('', DEFAULT_KEY).tree
        let parentId = tree.id

        for (let level = 1; level <= 5; level++) {
            const step = addNestedJsonField(tree, parentId, DEFAULT_KEY)

            tree = fill(step.tree, step.newId, `L${level}`, `v${level}`)
            parentId = step.newId
        }

        // Each `+` on a filled row moved its text into a first sub-field instead of dropping it.
        expect(JSON.parse(stringifyNestedJsonTree(tree))).toEqual({
            '': '',
            L1: { [DEFAULT_KEY]: 'v1', L2: { [DEFAULT_KEY]: 'v2', L3: { [DEFAULT_KEY]: 'v3', L4: { [DEFAULT_KEY]: 'v4', L5: 'v5' } } } }
        })
    })
})

describe('safe conversion with `+`', () => {
    it('turns existing plain text into a group without losing the text', () => {
        const { tree, newId } = nestedJsonTreeFromText('Nguyễn Văn A', DEFAULT_KEY)

        expect(children(tree)).toHaveLength(2)
        expect(children(tree)[0]).toMatchObject({ key: DEFAULT_KEY, kind: 'value', value: 'Nguyễn Văn A' })
        expect(children(tree)[1]).toMatchObject({ id: newId, key: '', kind: 'value', value: '' })
    })

    it('an empty value becomes a group with just the new sub-field', () => {
        const { tree } = nestedJsonTreeFromText('', DEFAULT_KEY)

        expect(children(tree)).toHaveLength(1)
    })

    it('`+` on a filled sub-field keeps its value (including non-text values) as the first sub-field', () => {
        const tree = nestedJsonTreeFromString('{"n":1,"s":"x"}')!
        const [n] = children(tree)
        const { tree: next } = addNestedJsonField(tree, n.id, DEFAULT_KEY)

        expect(JSON.parse(stringifyNestedJsonTree(next))).toEqual({ n: { [DEFAULT_KEY]: 1, '': '' }, s: 'x' })
        expect(findNode(next, n.id)?.kind).toBe('object')
    })

    it('removing the last sub-field of a nested group turns it back into an empty value; the root is kept', () => {
        const tree = nestedJsonTreeFromString('{"g":{"a":"1"},"b":"2"}')!
        const [group, b] = children(tree)
        const afterNested = removeNestedJsonNode(tree, children(group)[0].id)

        expect(JSON.parse(stringifyNestedJsonTree(afterNested))).toEqual({ g: '', b: '2' })
        expect(JSON.parse(stringifyNestedJsonTree(removeNestedJsonNode(removeNestedJsonNode(tree, group.id), b.id)))).toEqual({})
    })
})

describe('double stringify protection', () => {
    it('never stringifies twice: the saved value parses to an object in a single JSON.parse', () => {
        const value = stringifyNestedJsonTree(buildSampleTree())

        expect(value.startsWith('{')).toBe(true)
        expect(value).not.toContain('\\"')
        expect(typeof JSON.parse(value)).toBe('object')
    })

    it('does not parse JSON-looking text inside a sub-field a second time', () => {
        const stored = JSON.stringify({ note: '{"inner":1}' })
        const tree = nestedJsonTreeFromString(stored)!

        expect(children(tree)[0]).toMatchObject({ kind: 'value', value: '{"inner":1}' })
        expect(stringifyNestedJsonTree(tree)).toBe(stored)
    })

    it('keeps an already double-stringified legacy value as plain text instead of unwrapping it', () => {
        expect(nestedJsonTreeFromString(JSON.stringify(JSON.stringify({ a: 1 })))).toBeNull()
    })
})

describe('edits keep row identity (no re-render / remount of untouched rows)', () => {
    it('editing one field only copies its path; sibling nodes and ids are untouched', () => {
        const tree = nestedJsonTreeFromString('{"a":"1","g":{"x":"1","y":"2"},"z":"3"}')!
        const [a, g, z] = children(tree)
        const x = children(g)[0]
        const next = setNestedJsonLeafValue(tree, x.id, '1!')

        expect(next).not.toBe(tree)
        expect(children(next)[0]).toBe(a)
        expect(children(next)[2]).toBe(z)
        expect(children(children(next)[1])[1]).toBe(children(g)[1])
        expect(children(children(next)[1])[0].id).toBe(x.id)
    })

    it('a no-op edit returns the same tree object', () => {
        const tree = nestedJsonTreeFromString('{"a":"1"}')!
        const [a] = children(tree)

        expect(setNestedJsonLeafValue(tree, a.id, '1')).toBe(tree)
        expect(setNestedJsonKey(tree, a.id, 'a')).toBe(tree)
    })

    it('ids are stable and unique, never derived from content', () => {
        const tree = nestedJsonTreeFromString('{"a":"same","b":"same"}')!
        const ids = children(tree).map(child => child.id)

        expect(new Set(ids).size).toBe(2)
        expect(children(setNestedJsonKey(tree, ids[0], 'renamed')).map(child => child.id)).toEqual(ids)
    })

    it('expand/collapse is UI state only', () => {
        const tree = nestedJsonTreeFromString('{"g":{"a":"1"}}')!

        expect(stringifyNestedJsonTree(toggleNestedJsonCollapsed(tree, children(tree)[0].id))).toBe(stringifyNestedJsonTree(tree))
    })
})

describe('sub-field name validation', () => {
    it('flags empty and duplicate sibling names (which stringify would otherwise drop)', () => {
        let tree = nestedJsonTreeFromString('{"a":"1","b":{"x":"1"}}')!

        expect(validateNestedJsonTree(tree)).toEqual([])
        const step = addNestedJsonField(tree, tree.id, DEFAULT_KEY)

        tree = step.tree
        expect(validateNestedJsonTree(tree)).toEqual([{ nodeId: step.newId, reason: 'key_required' }])
        tree = setNestedJsonKey(tree, step.newId, ' a ')
        expect(validateNestedJsonTree(tree).map(issue => issue.reason)).toEqual(['key_duplicate', 'key_duplicate'])
        expect(childKeyIssues(tree).get(step.newId)).toBe('key_duplicate')

        // The same name in different groups is fine; list items have no names to validate.
        tree = setNestedJsonKey(tree, step.newId, 'x')
        expect(validateNestedJsonTree(tree)).toEqual([])
        expect(validateNestedJsonTree(nestedJsonTreeFromString('["a","a"]')!)).toEqual([])
    })
})

describe('integration with the existing related-member submit flow', () => {
    const base = extensionResponse([
        extensionItem(),
        extensionItem({ id: 502, field_key: 'related', field_label: 'Người liên quan', field_value: '', sort_order: 2 })
    ])

    it('submits the nested value as the existing string `field_value`; other rows stay untouched', () => {
        const drafts = toResidentExtensionDrafts(base).map(row => row.field_key === 'related'
            ? { ...row, field_value: stringifyNestedJsonTree(buildSampleTree()) }
            : row)
        const request = buildResidentExtensionDataRequest(17699, changedResidentExtensionDrafts(drafts, base))

        expect(request.items).toHaveLength(1)
        expect(request.items[0].field_label).toBe('Người liên quan')
        expect(typeof request.items[0].field_value).toBe('string')
        expect(JSON.parse(request.items[0].field_value)).toEqual(expectedValue)
    })

    it('loading a stored nested value without editing it does not mark the row dirty', () => {
        const stored = '{\n  "Tên": "Nguyễn Văn A"\n}'
        const loaded = extensionResponse([extensionItem({ field_value: stored })])

        expect(nestedJsonTreeFromString(stored)).not.toBeNull()
        expect(changedResidentExtensionDrafts(toResidentExtensionDrafts(loaded), loaded)).toEqual([])
    })

    it('the page-level summary only changes when something visible changes, not on every keystroke', () => {
        const drafts = toResidentExtensionDrafts(base)
        const clean = summarizeRelatedMembers(drafts, base)
        const typed = (text: string) => summarizeRelatedMembers(drafts.map((row, index) => index === 0 ? { ...row, field_value: text } : row), base)

        expect(clean.changedCount).toBe(0)
        expect(typed('N').signature).not.toBe(clean.signature)
        expect(typed('Ng').signature).toBe(typed('N').signature)
        expect(typed('Nguyễn').signature).toBe(typed('N').signature)
        expect(summarizeRelatedMembers([{ ...drafts[0], field_label: ' ' }], base).labelInvalid).toEqual([true])
    })
})
