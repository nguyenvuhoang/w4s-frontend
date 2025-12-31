import { ChildrenType } from '@/@core/types'
import { Box } from '@mui/material'
const WrapperContentPage = ({ children }: ChildrenType) => {
    return (
        <Box id="main-content">
            {children}
        </Box>
    )
}

export default WrapperContentPage
