import { Box, Typography } from '@mui/material'

const SelectAppError = ({ dictionary, execute_id, errorinfo }: any) => (
    <Box sx={{ my: 4 }}>
        <Typography variant="h6" color="error">{dictionary['select_app']?.title || 'Select App'}</Typography>
        <Typography variant="body2" color="text.secondary">ExecutionID: {execute_id}</Typography>
        <Typography variant="body2" color="text.secondary">{errorinfo}</Typography>
    </Box>
)

export default SelectAppError
