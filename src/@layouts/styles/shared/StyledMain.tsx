// Third-party Imports
import styled from '@emotion/styled'

// Config Imports
import themeConfig from '@configs/themeConfig'

// Util Imports
import { commonLayoutClasses } from '@layouts/utils/layoutClasses'

type StyledMainProps = {
  isContentCompact: boolean
}

const StyledMain = styled.main<StyledMainProps>`
  width:100%;
  min-width: 0;
  position: relative; 
  z-index: 30 !important; 
  padding: 0 !important;
  ${({ isContentCompact }) =>
    isContentCompact &&
    `
    margin-inline: auto;
    max-inline-size: ${themeConfig.compactContentWidth}px;
  `}

  &:has(.${commonLayoutClasses.contentHeightFixed}) {
    display: flex;
    overflow: hidden;
  }
`

export default StyledMain
