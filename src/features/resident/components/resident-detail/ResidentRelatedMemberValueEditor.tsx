'use client'

import { memo, useCallback, useEffect, useLayoutEffect, useMemo, useReducer, useRef, useState, type FocusEvent } from 'react'

import AddIcon from '@mui/icons-material/Add'
import CloseIcon from '@mui/icons-material/Close'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import { Box, Button, IconButton, Stack, TextField, Tooltip, Typography } from '@mui/material'

import {
    addNestedJsonField, childKeyIssues, countNestedJsonFields, nestedJsonTreeFromString, nestedJsonTreeFromText,
    removeNestedJsonNode, setNestedJsonKey, setNestedJsonLeafValue, stringifyNestedJsonTree, toggleNestedJsonCollapsed,
    validateNestedJsonTree, type NestedJsonContainer, type NestedJsonIssueReason, type NestedJsonNode, type NestedJsonPrimitive,
    type NestedValueBridge
} from '../../utils/residentNestedJsonValue'

type Text = (key: string) => string

type Actions = {
    setKey: (id: string, key: string) => void
    setValue: (id: string, value: string) => void
    add: (id: string) => void
    remove: (id: string) => void
    toggle: (id: string) => void
}

// ---------------------------------------------------------------------------------------------
// Local tree state. Typing only updates this reducer; the tree is serialized into the form
// (one JSON.stringify) when focus leaves the editor or right before Save.
// ---------------------------------------------------------------------------------------------

type State = { tree: NestedJsonContainer | null; committed: NestedJsonContainer | null; focusId: string | null }
type Action =
    | { type: 'reset'; tree: NestedJsonContainer | null }
    | { type: 'commit'; tree: NestedJsonContainer }
    | { type: 'edit'; update: (tree: NestedJsonContainer) => NestedJsonContainer }
    | { type: 'add'; id: string; defaultKey: string }
    | { type: 'fromText'; text: string; defaultKey: string }

const reducer = (state: State, action: Action): State => {
    switch (action.type) {
        case 'reset': return { tree: action.tree, committed: action.tree, focusId: null }
        case 'commit': return { ...state, committed: action.tree }
        case 'edit': {
            if (!state.tree) return state
            const tree = action.update(state.tree)

            return tree === state.tree ? state : { ...state, tree }
        }

        case 'add': {
            if (!state.tree) return state
            const { tree, newId } = addNestedJsonField(state.tree, action.id, action.defaultKey)

            return { ...state, tree, focusId: newId }
        }

        case 'fromText': {
            const { tree, newId } = nestedJsonTreeFromText(action.text, action.defaultKey)

            // `committed` stays null: the converted tree is a pending (dirty) change until committed.
            return { ...state, tree, focusId: newId }
        }
    }
}

const initState = (value: string): State => {
    const tree = nestedJsonTreeFromString(value)

    return { tree, committed: tree, focusId: null }
}

// ---------------------------------------------------------------------------------------------
// Rows
// ---------------------------------------------------------------------------------------------

const iconButtonSx = { width: 40, height: 40, flexShrink: 0 } as const

const leafText = (value: NestedJsonPrimitive) => value === null ? '' : String(value)

const RowActions = memo(({ id, actions, text, disabled }: { id: string; actions: Actions; text: Text; disabled?: boolean }) => (
    <Stack direction="row" sx={{ flexShrink: 0 }}>
        <Tooltip title={text('nested_add_child')}>
            <span>
                <IconButton aria-label={text('nested_add_child')} disabled={disabled} onClick={() => actions.add(id)} sx={iconButtonSx}>
                    <AddIcon fontSize="small" />
                </IconButton>
            </span>
        </Tooltip>
        <Tooltip title={text('nested_remove')}>
            <span>
                <IconButton aria-label={text('nested_remove')} color="error" disabled={disabled} onClick={() => actions.remove(id)} sx={iconButtonSx}>
                    <CloseIcon fontSize="small" />
                </IconButton>
            </span>
        </Tooltip>
    </Stack>
))

RowActions.displayName = 'RowActions'

const GroupToggle = ({ id, collapsed, count, actions, text }: { id: string; collapsed: boolean; count: number; actions: Actions; text: Text }) => (
    <Button
        type="button" size="small" color="inherit" onClick={() => actions.toggle(id)} aria-expanded={!collapsed}
        aria-label={text(collapsed ? 'nested_expand' : 'nested_collapse')}
        startIcon={collapsed ? <ExpandMoreIcon /> : <ExpandLessIcon />}
        sx={{ minHeight: 40, justifyContent: 'flex-start', color: 'text.secondary', textTransform: 'none', fontWeight: 500, whiteSpace: 'nowrap' }}
    >
        {text('nested_field_count').replace('{count}', String(count))}
    </Button>
)

type FieldRowProps = {
    node: NestedJsonNode
    // Set for list items (legacy array data): shown instead of an editable name.
    itemLabel?: string
    issue?: NestedJsonIssueReason
    focusId: string | null
    actions: Actions
    text: Text
    disabled?: boolean
}

/**
 * One sub-field. Memoized: editing a field only creates new objects along its path, so sibling
 * rows (and their inputs) keep identity, skip rendering and are never remounted.
 */
const FieldRow = memo(({ node, itemLabel, issue, focusId, actions, text, disabled }: FieldRowProps) => {
    // Decided once per mounted input: toggling `multiline` would swap <input>/<textarea> and lose focus.
    const [multiline] = useState(() => node.kind === 'value' && typeof node.value === 'string' && node.value.includes('\n'))
    const childIssues = useMemo(() => childKeyIssues(node), [node])

    const nameField = itemLabel !== undefined
        ? <Typography variant="body2" color="text.secondary" sx={{ minHeight: 40, display: 'flex', alignItems: 'center' }}>{itemLabel}</Typography>
        : <TextField
            size="small" fullWidth value={node.key} disabled={disabled} required autoFocus={node.id === focusId}
            placeholder={text('key')} error={Boolean(issue)} helperText={issue ? text(`nested_${issue}`) : undefined}
            slotProps={{ htmlInput: { 'aria-label': text('key') } }}
            onChange={event => actions.setKey(node.id, event.target.value)}
        />

    return (
        <Box>
            <Stack direction={{ xs: 'column', sm: 'row' }} gap={1} alignItems={{ xs: 'stretch', sm: 'flex-start' }}>
                <Box sx={{ flex: { sm: '1 1 0' }, minWidth: 0 }}>{nameField}</Box>
                <Stack direction="row" gap={0.5} alignItems="flex-start" sx={{ flex: { sm: '2 1 0' }, minWidth: 0 }}>
                    <Box sx={{ flex: '1 1 0', minWidth: 0 }}>
                        {node.kind === 'value'
                            ? <TextField
                                size="small" fullWidth multiline={multiline} value={leafText(node.value)} disabled={disabled}
                                placeholder={text('value')} autoFocus={itemLabel !== undefined && node.id === focusId}
                                slotProps={{ htmlInput: { 'aria-label': text('value') } }}
                                onChange={event => actions.setValue(node.id, event.target.value)}
                            />
                            : <GroupToggle id={node.id} collapsed={Boolean(node.collapsed)} count={countNestedJsonFields(node)} actions={actions} text={text} />}
                    </Box>
                    <RowActions id={node.id} actions={actions} text={text} disabled={disabled} />
                </Stack>
            </Stack>

            {node.kind !== 'value' && !node.collapsed && (
                <Stack gap={1} sx={{ mt: 1, ml: { xs: 0.5, sm: 1 }, pl: { xs: 1, sm: 2 }, borderLeft: 1, borderColor: 'divider' }}>
                    {node.children.map((child, index) => (
                        <FieldRow
                            key={child.id} node={child} issue={childIssues.get(child.id)} focusId={focusId}
                            itemLabel={node.kind === 'array' ? text('nested_item_label').replace('{index}', String(index + 1)) : undefined}
                            actions={actions} text={text} disabled={disabled}
                        />
                    ))}
                </Stack>
            )}
        </Box>
    )
})

FieldRow.displayName = 'FieldRow'

// ---------------------------------------------------------------------------------------------
// Value editor (one per top-level related-member row)
// ---------------------------------------------------------------------------------------------

type Props = {
    value: string
    onChange: (value: string) => void
    onValidate?: () => void
    bridge?: NestedValueBridge
    disabled?: boolean
    label: string
    text: Text
}

/**
 * Edits one related-member `field_value`. A plain value is the existing string input. Pressing
 * `+` turns it into a group of sub-fields (keeping any existing text as the first sub-field);
 * a group is written back as a single `JSON.stringify` into the same string field.
 */
const ResidentRelatedMemberValueEditor = ({ value, onChange, onValidate, bridge, disabled, label, text }: Props) => {
    const [state, dispatch] = useReducer(reducer, value, initState)
    // The last value this editor emitted or derived its tree from.
    const [syncedValue, setSyncedValue] = useState(value)
    const [textMultiline] = useState(() => value.includes('\n'))

    // Re-derive only when the value changes from outside (reload, reconcile, reset) — never on our
    // own commits, so unsaved edits are not overwritten. Adjusting during render avoids an extra pass.
    if (value !== syncedValue) {
        setSyncedValue(value)
        dispatch({ type: 'reset', tree: nestedJsonTreeFromString(value) })
    }

    const latest = useRef({ state, onChange, text })

    useLayoutEffect(() => { latest.current = { state, onChange, text } })

    const emit = useCallback((next: string) => {
        setSyncedValue(next)
        latest.current.onChange(next)
    }, [])

    // Serialize the whole tree once, only when there is something uncommitted.
    const commit = useCallback(() => {
        const { tree, committed } = latest.current.state

        if (!tree || tree === committed) return
        dispatch({ type: 'commit', tree })
        emit(stringifyNestedJsonTree(tree))
    }, [emit])

    const actions = useMemo<Actions>(() => ({
        setKey: (id, key) => dispatch({ type: 'edit', update: tree => setNestedJsonKey(tree, id, key) }),
        setValue: (id, next) => dispatch({ type: 'edit', update: tree => setNestedJsonLeafValue(tree, id, next) }),
        toggle: id => dispatch({ type: 'edit', update: tree => toggleNestedJsonCollapsed(tree, id) }),
        add: id => dispatch({ type: 'add', id, defaultKey: latest.current.text('nested_default_key') }),
        remove: id => {
            const tree = latest.current.state.tree

            if (tree && tree.children.length === 1 && tree.children[0].id === id) {
                // Last sub-field removed: back to an empty plain value, committed immediately.
                dispatch({ type: 'reset', tree: null })
                emit('')
            } else {
                dispatch({ type: 'edit', update: current => removeNestedJsonNode(current, id) })
            }
        }
    }), [emit])

    const pending = state.tree !== null && state.tree !== state.committed
    const invalid = useMemo(() => state.tree ? validateNestedJsonTree(state.tree).length > 0 : false, [state.tree])
    const rootIssues = useMemo(() => state.tree ? childKeyIssues(state.tree) : new Map<string, NestedJsonIssueReason>(), [state.tree])

    // Each of these fires only when the boolean flips, not per keystroke.
    useEffect(() => { bridge?.onPendingChange(pending) }, [bridge, pending])
    useEffect(() => { bridge?.onValidityChange(invalid) }, [bridge, invalid])
    useEffect(() => () => { bridge?.onPendingChange(false); bridge?.onValidityChange(false) }, [bridge])
    useEffect(() => bridge?.registerFlush(commit), [bridge, commit])

    const handleBlur = (event: FocusEvent<HTMLElement>) => {
        // Commit only when focus leaves this editor, not while moving between its own inputs.
        if (event.currentTarget.contains(event.relatedTarget as Node | null)) return
        commit()
        onValidate?.()
    }

    const { tree } = state
    const addLabel = text('nested_add_child')

    return (
        <Stack direction="row" gap={0.5} alignItems="flex-start" sx={{ minWidth: 0, width: '100%' }} onBlur={handleBlur}>
            <Box sx={{ flex: '1 1 0', minWidth: 0 }}>
                {tree
                    ? <>
                        <GroupToggle id={tree.id} collapsed={Boolean(tree.collapsed)} count={countNestedJsonFields(tree)} actions={actions} text={text} />
                        {!tree.collapsed && <Stack gap={1} sx={{ mt: 1, ml: { xs: 0.5, sm: 1 }, pl: { xs: 1, sm: 2 }, borderLeft: 1, borderColor: 'divider' }}>
                            {tree.children.map((child, index) => (
                                <FieldRow
                                    key={child.id} node={child} issue={rootIssues.get(child.id)} focusId={state.focusId}
                                    itemLabel={tree.kind === 'array' ? text('nested_item_label').replace('{index}', String(index + 1)) : undefined}
                                    actions={actions} text={text} disabled={disabled}
                                />
                            ))}
                        </Stack>}
                        {invalid && <Typography variant="caption" color="error" sx={{ display: 'block', mt: 1 }}>{text('nested_has_errors')}</Typography>}
                    </>
                    : <TextField
                        size="small" fullWidth label={label} value={value} disabled={disabled} multiline={textMultiline}
                        onChange={event => emit(event.target.value)}
                    />}
            </Box>
            <Tooltip title={addLabel}>
                <span>
                    <IconButton
                        aria-label={addLabel} disabled={disabled} sx={iconButtonSx}
                        onClick={() => tree ? actions.add(tree.id) : dispatch({ type: 'fromText', text: value, defaultKey: text('nested_default_key') })}
                    >
                        <AddIcon fontSize="small" />
                    </IconButton>
                </span>
            </Tooltip>
        </Stack>
    )
}

export default memo(ResidentRelatedMemberValueEditor)
