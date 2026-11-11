'use client'

import { useSettings } from '@core/hooks/useSettings'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import { useState } from 'react'

type LayoutToggleProps = {
    label?: string
    showLabel?: boolean
    fullWidth?: boolean
}

const LayoutToggle = ({ label, showLabel = false, fullWidth = false }: LayoutToggleProps) => {
    const [tooltipOpen, setTooltipOpen] = useState(false)
    const { settings, updateSettings } = useSettings()

    const isHorizontal = settings.layout === 'horizontal'

    const handleToggle = () => {
        const newLayout = isHorizontal ? 'vertical' : 'horizontal'
        updateSettings({ layout: newLayout })
    }

    const tooltipTitle = isHorizontal ? 'Switch to Vertical Menu' : 'Switch to Horizontal Menu'
    const iconClass = isHorizontal ? 'ri-layout-left-line' : 'ri-layout-top-line'

    return (
        <Tooltip
            title={tooltipTitle}
            onOpen={() => setTooltipOpen(true)}
            onClose={() => setTooltipOpen(false)}
            open={tooltipOpen}
        >
            {showLabel ? (
                <Button
                    onClick={handleToggle}
                    fullWidth={fullWidth}
                    startIcon={<i className={iconClass} />}
                    sx={{
                        justifyContent: 'flex-start',
                        minHeight: 38,
                        px: 1.5,
                        borderRadius: 2,
                        color: 'common.white',
                        textTransform: 'none',
                        fontWeight: 500,
                        '& .MuiButton-startIcon': { fontSize: 22, minWidth: 24 },
                        '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.12)' }
                    }}
                >
                    {label ?? tooltipTitle}
                </Button>
            ) : (
                <IconButton onClick={handleToggle} className='text-[22px] text-white'>
                    <i className={iconClass} />
                </IconButton>
            )}
        </Tooltip>
    )
}

export default LayoutToggle
