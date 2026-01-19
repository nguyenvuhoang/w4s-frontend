import { Box, Skeleton } from '@mui/material'

const SelectAppSkeleton = ({ dictionary }: any) => (
    <Box sx={{ my: 4 }}>
        <Skeleton variant="text" width={300} height={40} />
        <Skeleton variant="rectangular" width="100%" height={200} sx={{ mt: 2 }} />
    </Box>
)

export default SelectAppSkeleton
