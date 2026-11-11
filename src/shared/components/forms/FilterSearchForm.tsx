import type { FormEvent, ReactNode } from 'react'

import { Box } from '@mui/material'
import type { SxProps, Theme } from '@mui/material/styles'

type Props = {
    /** Called once, whether the user clicked the (type="submit") Search button or pressed Enter. */
    on_search: () => void
    children: ReactNode
    sx?: SxProps<Theme>
}

/**
 * Shared "Enter submits the search" wrapper for filter bars.
 *
 * Renders a real <form onSubmit>, so:
 * - Enter inside any plain text field submits (native browser behavior) — no per-input
 *   onKeyDown needed.
 * - Enter inside a <textarea> does NOT submit (native browser behavior).
 * - Enter on a focused MUI Select/Autocomplete does NOT submit — those render a
 *   div[role=combobox]/listbox, not a text <input>, so the browser's implicit-submit-on-Enter
 *   rule (which only applies to single-line text inputs) never fires for them, and any Enter
 *   they do capture (e.g. to close their menu) never reaches this form as a submit.
 *
 * Usage: put your filter TextFields/Selects as children, and give the Search button
 * `type="submit"` with no onClick — Enter and click both funnel through the one on_search
 * handler here, so there is no risk of a double request.
 * Buttons that must NOT submit (e.g. Reset/Refresh) need explicit type="button".
 */
const FilterSearchForm = ({ on_search, children, sx }: Props) => (
    <Box
        component="form"
        noValidate
        onSubmit={(event: FormEvent<HTMLFormElement>) => {
            event.preventDefault()
            on_search()
        }}
        sx={sx}
    >
        {children}
    </Box>
)

export default FilterSearchForm
