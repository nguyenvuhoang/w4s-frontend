import { Box, Typography } from '@mui/material'
import Image from 'next/image'

type Props = {
    text: string
    width?: number | `${number}` | undefined
    height?: number | `${number}` | undefined
}

const NoData = ({ text, width, height }: Props) => {
    return (
        <Box sx={{ textAlign: 'center', padding: '50px' }}>
            <Image src="/images/illustrations/empty-list.svg" width={width} height={height} alt="No Transactions" style={{ marginBottom: '20px' }} />
            <Typography variant="body1" color="textSecondary">
                {text}
            </Typography>
        </Box>
    )
}

export default NoData
