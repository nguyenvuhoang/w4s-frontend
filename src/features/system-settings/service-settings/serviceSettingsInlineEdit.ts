import type { ServiceSettingItem, ServiceSettingUpdatePayload } from './types'

export const SENSITIVE_KEY_PATTERN = /(password|secret(?:key)?|token|api[_-]?key|private[_-]?key|connection[_-]?string)/i
export const MASKED_DISPLAY_VALUE = '••••••••••••'

// A value made only of mask glyphs is a backend/UI mask, never a real secret.
const MASK_ONLY_PATTERN = /^[*•●·]+$/

export const isSensitiveSetting = (item: Pick<ServiceSettingItem, 'name'>) => SENSITIVE_KEY_PATTERN.test(item.name)

export const isMaskedValue = (value: unknown) => typeof value === 'string' && value.length > 0 && (value === MASKED_DISPLAY_VALUE || MASK_ONLY_PATTERN.test(value))

export const displayValue = (item: ServiceSettingItem, isVisible = false) => {
  if (isSensitiveSetting(item) && !isVisible) return MASKED_DISPLAY_VALUE
  if (item.value === null || item.value === undefined || item.value === '') return '-'
  return typeof item.value === 'object' ? JSON.stringify(item.value) : String(item.value)
}

/**
 * Value the inline editor starts with. Never the display mask: for secrets whose real value is
 * not provided by the backend (missing or masked), the editor starts empty so the user types a
 * replacement value.
 */
export const getInitialEditValue = (item: ServiceSettingItem) => {
  const { value } = item

  if (value === null || value === undefined) return ''
  if (isSensitiveSetting(item) && (typeof value !== 'string' || isMaskedValue(value))) return ''
  return typeof value === 'object' ? JSON.stringify(value) : String(value)
}

/** Exact comparison: no trim, no type coercion. */
export const hasValueChanged = (item: ServiceSettingItem, draft: string) => draft !== getInitialEditValue(item)

export const getRowKey = (service: string, item: ServiceSettingItem) =>
  `${service}:${item.id !== null && item.id !== undefined ? item.id : item.name}`

/** `id`, `name`, `organization_id` are copied from the original record; only `value` changes. */
export const buildUpdatePayload = (item: ServiceSettingItem, value: string): ServiceSettingUpdatePayload | null => {
  if (item.id === null || item.id === undefined || item.id === '') return null

  return { name: item.name, value, organization_id: item.organizationId ?? null, id: item.id }
}

export const resolveInlineEditKey = (key: string): 'save' | 'cancel' | null =>
  key === 'Enter' ? 'save' : key === 'Escape' ? 'cancel' : null

// ---------------------------------------------------------------------------------------------
// Inline edit state machine (one row at a time)
// ---------------------------------------------------------------------------------------------

export type InlineEditState = {
  rowKey: string | null
  item: ServiceSettingItem | null
  draft: string
  saving: boolean
  error: string | null
}

export const INITIAL_INLINE_EDIT_STATE: InlineEditState = { rowKey: null, item: null, draft: '', saving: false, error: null }

export type InlineEditAction =
  | { type: 'start'; rowKey: string; item: ServiceSettingItem }
  | { type: 'change'; draft: string }
  | { type: 'cancel' }
  | { type: 'save_start' }
  | { type: 'save_success' }
  | { type: 'save_failure'; error: string }

export const inlineEditReducer = (state: InlineEditState, action: InlineEditAction): InlineEditState => {
  switch (action.type) {
    case 'start':
      // Only one row may be edited at a time: the current edit must be saved or cancelled first.
      if (state.rowKey !== null) return state
      return { rowKey: action.rowKey, item: action.item, draft: getInitialEditValue(action.item), saving: false, error: null }
    case 'change':
      if (state.rowKey === null || state.saving) return state
      return { ...state, draft: action.draft }
    case 'cancel':
      if (state.saving) return state
      return INITIAL_INLINE_EDIT_STATE
    case 'save_start':
      if (state.rowKey === null || state.saving) return state
      return { ...state, saving: true, error: null }
    case 'save_success':
      return INITIAL_INLINE_EDIT_STATE
    case 'save_failure':
      // Keep edit mode and the typed value so the user can fix and retry.
      return { ...state, saving: false, error: action.error }
    default:
      return state
  }
}

export type SaveDecision =
  | { kind: 'ignore' }
  | { kind: 'unchanged' }
  | { kind: 'invalid' }
  | { kind: 'submit'; payload: ServiceSettingUpdatePayload }

/** Decides what a save request should do for the current state (no API call when unchanged). */
export const decideSave = (state: InlineEditState): SaveDecision => {
  if (state.rowKey === null || !state.item || state.saving) return { kind: 'ignore' }
  if (!hasValueChanged(state.item, state.draft)) return { kind: 'unchanged' }

  const payload = buildUpdatePayload(state.item, state.draft)

  return payload ? { kind: 'submit', payload } : { kind: 'invalid' }
}

export type InlineSaveDeps = {
  update: (payload: ServiceSettingUpdatePayload) => Promise<unknown>
  onSuccess: (item: ServiceSettingItem, value: string) => void
  formatError: (error: unknown) => string
  invalidMessage: string
}

/** Runs one save attempt; dependencies are injected so the flow is testable without React. */
export const executeInlineSave = async (state: InlineEditState, dispatch: (action: InlineEditAction) => void, deps: InlineSaveDeps) => {
  const decision = decideSave(state)

  if (decision.kind === 'ignore') return decision
  if (decision.kind === 'unchanged') { dispatch({ type: 'cancel' }); return decision }
  if (decision.kind === 'invalid') { dispatch({ type: 'save_failure', error: deps.invalidMessage }); return decision }

  dispatch({ type: 'save_start' })
  try {
    await deps.update(decision.payload)
    dispatch({ type: 'save_success' })
    deps.onSuccess(state.item as ServiceSettingItem, decision.payload.value)
  } catch (error) {
    dispatch({ type: 'save_failure', error: deps.formatError(error) })
  }

  return decision
}
