'use client'

import * as MuiIcons from '@mui/icons-material'
import type { SvgIconProps } from '@mui/material'

type DynamicMuiIconProps = SvgIconProps & {
    iconName?: string | null
    fallback?: keyof typeof MuiIcons
}

export const resolveMuiIcon = (iconName?: string | null, fallback: keyof typeof MuiIcons = 'GridView') =>
    (iconName && iconName in MuiIcons ? MuiIcons[iconName as keyof typeof MuiIcons] : MuiIcons[fallback])

export const DynamicMuiIcon = ({ iconName, fallback = 'GridView', ...svgIconProps }: DynamicMuiIconProps) => {
    const IconComponent = iconName && iconName in MuiIcons ? MuiIcons[iconName as keyof typeof MuiIcons] : MuiIcons[fallback]

    return <IconComponent {...svgIconProps} />
}

export default DynamicMuiIcon
