// Third-party Imports
import styled from '@emotion/styled'

// Type Imports
import type { VerticalNavProps } from '../../components/vertical-menu/VerticalNav'

type StyledVerticalNavBgColorContainerProps = Pick<VerticalNavProps, 'backgroundColor'>

const StyledVerticalNavBgColorContainer = styled.div<StyledVerticalNavBgColorContainerProps>`
  position: relative;
  height: 100vh;
  min-height: 100dvh;
  z-index: 3;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  overflow-x: hidden;
  ${({ backgroundColor }) => backgroundColor && `background-color:${backgroundColor};`}
`

export default StyledVerticalNavBgColorContainer
