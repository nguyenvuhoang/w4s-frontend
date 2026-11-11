import type { ReactNode } from 'react'

import MenuCommandInfoItem from './MenuCommandInfoItem'

type Props = {
  label: string
  editing: boolean
  input: ReactNode
  value: ReactNode
  mono?: boolean
}

// A field that is read-only in view mode and an input in edit mode, described once instead of
// as two separately-maintained JSX branches (which is how the view/edit copies of a field drift
// out of sync). Renders through the same MenuCommandInfoItem as every other read-only field so
// the label/value typography stays identical between modes.
const MenuCommandEditableField = ({ label, editing, input, value, mono }: Props) => (
  editing
    ? <MenuCommandInfoItem label={label}>{input}</MenuCommandInfoItem>
    : <MenuCommandInfoItem label={label} value={value} mono={mono} />
)

export default MenuCommandEditableField
