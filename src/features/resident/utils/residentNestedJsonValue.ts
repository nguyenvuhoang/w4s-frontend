// Nested field editing for a related-member value. The backend only ever stores `field_value`
// as a plain string; this module converts that string to an editable tree and back with a
// single JSON.stringify (only when the editor commits/saves, never per keystroke), so the
// existing submit/dirty-check logic keeps working on strings.

export type NestedJsonPrimitive = string | number | boolean | null
export type NestedJsonContainerKind = 'object' | 'array'

export type NestedJsonNode = {
    // Stable for the lifetime of the tree: used as React key, never derived from content.
    id: string
    // Only meaningful when the parent is an object. Array items keep '' here.
    key: string
} & (
    | { kind: 'value'; value: NestedJsonPrimitive }
    | { kind: NestedJsonContainerKind; children: NestedJsonNode[]; collapsed?: boolean }
)

export type NestedJsonContainer = Extract<NestedJsonNode, { kind: NestedJsonContainerKind }>

export type NestedJsonIssueReason = 'key_required' | 'key_duplicate'
export type NestedJsonIssue = { nodeId: string; reason: NestedJsonIssueReason }

/** Connects one row's value editor to the page-level form hook without per-keystroke updates. */
export type NestedValueBridge = {
    onValidityChange: (invalid: boolean) => void
    onPendingChange: (pending: boolean) => void
    registerFlush: (flush: () => void) => () => void
}

let sequence = 0

export const createNestedJsonId = () => `nf-${(sequence++).toString(36)}`

const isContainer = (value: unknown): value is Record<string, unknown> | unknown[] =>
    typeof value === 'object' && value !== null

/**
 * Returns the parsed object/array only when `raw` is a valid JSON string whose top level is an
 * object or array. Plain text, JSON scalars ("123", "true", "\"x\"") and invalid JSON return null
 * so ordinary Key/Value rows stay plain text untouched.
 */
export const parseNestedJsonValue = (raw: string | null | undefined): Record<string, unknown> | unknown[] | null => {
    if (typeof raw !== 'string') return null
    const text = raw.trim()

    if (!(text.startsWith('{') && text.endsWith('}')) && !(text.startsWith('[') && text.endsWith(']'))) return null

    try {
        const parsed: unknown = JSON.parse(text)

        return isContainer(parsed) ? parsed : null
    } catch {
        return null
    }
}

export const isNestedJsonValue = (raw: string | null | undefined) => parseNestedJsonValue(raw) !== null

const toNode = (key: string, value: unknown): NestedJsonNode => {
    const id = createNestedJsonId()

    if (Array.isArray(value)) return { id, key, kind: 'array', children: value.map(item => toNode('', item)) }
    if (isContainer(value)) return { id, key, kind: 'object', children: Object.entries(value).map(([childKey, child]) => toNode(childKey, child)) }
    // Leaf strings that merely look like JSON stay strings: never parse a nested level twice.
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' || value === null) return { id, key, kind: 'value', value }

    return { id, key, kind: 'value', value: String(value) }
}

/** Builds the tree for a raw `field_value`, or null when it is not a JSON object/array. */
export const nestedJsonTreeFromString = (raw: string | null | undefined): NestedJsonContainer | null => {
    const parsed = parseNestedJsonValue(raw)

    return parsed === null ? null : toNode('', parsed) as NestedJsonContainer
}

export const nestedJsonNodeToValue = (node: NestedJsonNode): unknown => {
    if (node.kind === 'value') return node.value
    if (node.kind === 'array') return node.children.map(nestedJsonNodeToValue)
    const result: Record<string, unknown> = {}

    for (const child of node.children) result[child.key] = nestedJsonNodeToValue(child)

    return result
}

/** The one and only stringify: the result goes straight into the existing `field_value`. */
export const stringifyNestedJsonTree = (tree: NestedJsonContainer) => JSON.stringify(nestedJsonNodeToValue(tree))

/** Key problems among one group's direct children. Arrays have no keys to validate. */
export const childKeyIssues = (group: NestedJsonNode): Map<string, NestedJsonIssueReason> => {
    const issues = new Map<string, NestedJsonIssueReason>()

    if (group.kind !== 'object') return issues
    const counts = new Map<string, number>()

    for (const child of group.children) counts.set(child.key.trim(), (counts.get(child.key.trim()) ?? 0) + 1)
    for (const child of group.children) {
        const key = child.key.trim()

        if (!key) issues.set(child.id, 'key_required')
        else if ((counts.get(key) ?? 0) > 1) issues.set(child.id, 'key_duplicate')
    }

    return issues
}

/** Keys must be non-empty and unique among siblings, otherwise stringify would drop data. */
export const validateNestedJsonTree = (tree: NestedJsonNode): NestedJsonIssue[] => {
    const issues: NestedJsonIssue[] = []

    const visit = (node: NestedJsonNode) => {
        if (node.kind === 'value') return
        for (const [nodeId, reason] of childKeyIssues(node)) issues.push({ nodeId, reason })
        node.children.forEach(visit)
    }

    visit(tree)

    return issues
}

// ---- Immutable tree edits (pure, unit-tested). Only the path to the edited node is copied,
// so untouched rows keep their object identity and memoized rows skip re-rendering. ----

const mapNode = (node: NestedJsonNode, id: string, update: (node: NestedJsonNode) => NestedJsonNode): NestedJsonNode => {
    if (node.id === id) return update(node)
    if (node.kind === 'value') return node
    let changed = false
    const children = node.children.map(child => {
        const next = mapNode(child, id, update)

        if (next !== child) changed = true

        return next
    })

    return changed ? { ...node, children } : node
}

export const updateNestedJsonNode = (tree: NestedJsonContainer, id: string, update: (node: NestedJsonNode) => NestedJsonNode) =>
    mapNode(tree, id, update) as NestedJsonContainer

export const setNestedJsonKey = (tree: NestedJsonContainer, id: string, key: string) =>
    updateNestedJsonNode(tree, id, node => node.key === key ? node : { ...node, key })

export const setNestedJsonLeafValue = (tree: NestedJsonContainer, id: string, value: string) =>
    updateNestedJsonNode(tree, id, node => node.kind === 'value' && node.value !== value ? { ...node, value } : node)

const hasLeafContent = (value: NestedJsonPrimitive) => value !== null && value !== ''

/**
 * Adds a sub-field to `target`. A plain value becomes a group: its existing content is moved,
 * never discarded, into a first sub-field named `defaultKey`, followed by the new empty field.
 */
const withNewField = (target: NestedJsonNode, defaultKey: string, newId: string): NestedJsonContainer => {
    if (target.kind !== 'value') {
        const child: NestedJsonNode = { id: newId, key: '', kind: 'value', value: '' }

        return { ...target, collapsed: false, children: [...target.children, child] }
    }

    const kept: NestedJsonNode[] = hasLeafContent(target.value) ? [{ id: createNestedJsonId(), key: defaultKey, kind: 'value', value: target.value }] : []

    return { id: target.id, key: target.key, kind: 'object', children: [...kept, { id: newId, key: '', kind: 'value', value: '' }] }
}

export const addNestedJsonField = (tree: NestedJsonContainer, targetId: string, defaultKey: string) => {
    const newId = createNestedJsonId()

    return { tree: updateNestedJsonNode(tree, targetId, node => withNewField(node, defaultKey, newId)), newId }
}

/** Converts a plain text value into a group of sub-fields without losing the text. */
export const nestedJsonTreeFromText = (text: string, defaultKey: string) => {
    const newId = createNestedJsonId()

    return { tree: withNewField({ id: createNestedJsonId(), key: '', kind: 'value', value: text }, defaultKey, newId), newId }
}

/**
 * Removes a node. A nested group left without sub-fields turns back into an empty plain value.
 * The root itself is never removed here (the editor handles an emptied root).
 */
export const removeNestedJsonNode = (tree: NestedJsonContainer, id: string): NestedJsonContainer => {
    const prune = (node: NestedJsonNode, isRoot: boolean): NestedJsonNode => {
        if (node.kind === 'value') return node
        const index = node.children.findIndex(child => child.id === id)

        if (index >= 0) {
            const children = node.children.filter(child => child.id !== id)

            return !children.length && !isRoot ? { id: node.id, key: node.key, kind: 'value', value: '' } : { ...node, children }
        }

        let changed = false
        const children = node.children.map(child => {
            const next = prune(child, false)

            if (next !== child) changed = true

            return next
        })

        return changed ? { ...node, children } : node
    }

    return prune(tree, true) as NestedJsonContainer
}

export const toggleNestedJsonCollapsed = (tree: NestedJsonContainer, id: string) =>
    updateNestedJsonNode(tree, id, node => node.kind === 'value' ? node : { ...node, collapsed: !node.collapsed })

export const countNestedJsonFields = (node: NestedJsonNode): number =>
    node.kind === 'value' ? 0 : node.children.length
