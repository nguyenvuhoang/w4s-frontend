import { ChildrenType } from '@/@menu/types'
import { Button, ButtonProps } from '@mui/material'
import classNames from 'classnames'

type Props = ChildrenType & ButtonProps

const ButtonGradient = (props: Props) => {
    return (
        <Button
            fullWidth variant='contained'
            className={classNames('mt-5 p-3', props.className)}
            type='submit'
            sx={{
                background: 'radial-gradient(300.55% 959.41% at 293.35% -237.5%, #00502F 0%, #0A6F47 67.24%, #629F0D 98.3%)',
                color: 'white',
                '&:hover': {
                    opacity: "0.5",
                }
            }}
            {...props}
        >
            {props.children}
        </Button>
    )
}

export default ButtonGradient
