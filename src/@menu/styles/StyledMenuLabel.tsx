// Third-party Imports
import styled from '@emotion/styled'

// Type Imports
import type { RootStylesType } from '../types'
import { useTheme } from '@mui/material'

type StyledMenuLabelProps = RootStylesType & {
  textTruncate?: boolean
  active?: boolean
}

const StyledMenuLabel = styled.span<StyledMenuLabelProps>((props) => {
  const theme = useTheme()
  return `
    font-size: 16px;
    flex-grow: 1;
    ${props.textTruncate &&
    `
        text-overflow: ellipsis;
        overflow: hidden;
        white-space: nowrap;
      `
    };
    ${props.rootStyles};
  `
})

export default StyledMenuLabel
