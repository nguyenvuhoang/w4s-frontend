'use client'

import { useSettings } from '@core/hooks/useSettings'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import { useState } from 'react'

const LayoutToggle = () => {
    const [tooltipOpen, setTooltipOpen] = useState(false)
    const { settings, updateSettings } = useSettings()

    const isHorizontal = settings.layout === 'horizontal'

    const handleToggle = () => {
        const newLayout = isHorizontal ? 'vertical' : 'horizontal'
        updateSettings({ layout: newLayout })
    }

    const tooltipTitle = isHorizontal ? 'Switch to Vertical Menu' : 'Switch to Horizontal Menu'

    return (
        <Tooltip
            title={tooltipTitle}
            onOpen={() => setTooltipOpen(true)}
            onClose={() => setTooltipOpen(false)}
            open={tooltipOpen}
        >
            <IconButton onClick={handleToggle} className='text-[22px] text-white'>
                <i className={isHorizontal ? 'ri-layout-left-line' : 'ri-layout-top-line'} />
            </IconButton>
        </Tooltip>
    )
}

export default LayoutToggle
