import { ChildrenType } from '@/@menu/types'
import { Button, ButtonProps } from '@mui/material'

type Props = ChildrenType & ButtonProps

const ButtonColor = (props: Props) => {
    return (
        <Button
            fullWidth
            variant='contained' 
            className='mt-5 p-3'
            type='submit'
            sx={{
                backgroundColor: 'transparent',
                color: '#089356', 
                border: '1px solid #0A6F47', 
                '&:hover': {
                    backgroundColor: 'transparent',
                    opacity: "0.5", 
                }
            }}
            {...props}
        >
            {props.children}
        </Button>
    )
}

export default ButtonColor
