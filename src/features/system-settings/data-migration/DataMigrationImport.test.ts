import { Children, isValidElement, type ReactElement, type ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import en from '@/data/dictionaries/en.json'

const state = vi.hoisted(() => ({ cursor: 0, slots: [] as unknown[] }))

vi.mock('react', async importOriginal => ({
  ...await importOriginal<typeof import('react')>(),
  useState(initial: unknown) {
    const index = state.cursor++

    if (!(index in state.slots)) state.slots[index] = initial

    return [state.slots[index], (value: unknown) => { state.slots[index] = value }]
  }
}))

vi.mock('@mui/material', () => ({
  Alert: 'alert', Button: 'button', Dialog: 'dialog', DialogActions: 'actions',
  DialogContent: 'content', DialogContentText: 'description', DialogTitle: 'title',
  FormControlLabel: 'field', Paper: 'paper', Stack: 'stack', Switch: 'switch', Typography: 'text'
}))
vi.mock('@mui/icons-material/UploadFileRounded', () => ({ default: 'icon' }))

import DataMigrationImport from './DataMigrationImport'

const labels = en.data_migration
const onImport = vi.fn<(file: File, preserveIdentity: boolean) => Promise<boolean>>()
const zip = new File([new Uint8Array([80, 75, 5, 6, ...Array(18).fill(0)])], 'config.zip')

type Element = ReactElement<{
  children?: ReactNode
  control?: Element
  checked?: boolean
  open?: boolean
  severity?: string
  onClick?: () => void | Promise<void>
  onDrop?: (event: { preventDefault: () => void; dataTransfer: { files: File[] } }) => void
  onChange?: (event: { target: { value: string; files: File[] } }, checked?: boolean) => void
}>

const find = (node: ReactNode, predicate: (element: Element) => boolean): Element | undefined => {
  for (const child of Children.toArray(node)) {
    if (!isValidElement<Element['props']>(child)) continue
    if (predicate(child)) return child

    const nested = find(child.props.children, predicate)

    if (nested) return nested
  }
}

const render = () => {
  state.cursor = 0

  return DataMigrationImport({ serviceLabel: 'CTH', locale: 'en', isProduction: true, labels, disabled: false, isImporting: false, onImport })
}

const element = (type: string) => find(render(), child => child.type === type)!
const button = (label: string) => find(render(), child => child.type === 'button' && child.props.children === label)!

beforeEach(() => {
  state.slots = []
  onImport.mockReset().mockResolvedValue(false)
})

describe('Data Migration import form', () => {
  it('selects a ZIP without uploading, defaults Preserve Identity to true and cancels confirmation', async () => {
    element('input').props.onChange?.({ target: { files: [zip], value: zip.name } })
    expect(element('field').props.control?.props.checked).toBe(true)
    expect(onImport).not.toHaveBeenCalled()

    await button(labels.import_zip).props.onClick?.()
    expect(element('dialog').props.open).toBe(true)
    expect(find(element('dialog'), child => child.props.severity === 'error')?.props.children).toBe(labels.import_production_warning)

    await button(labels.cancel).props.onClick?.()
    expect(element('dialog').props.open).toBe(false)
    expect(onImport).not.toHaveBeenCalled()
  })

  it('accepts a dropped ZIP, forwards the toggled option only after confirmation and retains the file on failure', async () => {
    element('paper').props.onDrop?.({ preventDefault: vi.fn(), dataTransfer: { files: [zip] } })
    element('field').props.control?.props.onChange?.({ target: { files: [], value: '' } }, false)
    expect(element('field').props.control?.props.checked).toBe(false)
    expect(onImport).not.toHaveBeenCalled()

    await button(labels.import_zip).props.onClick?.()
    await button(labels.confirm_import).props.onClick?.()
    expect(onImport).toHaveBeenCalledExactlyOnceWith(zip, false)
    expect(find(render(), child => child.props.children === zip.name)).toBeDefined()
  })
})
