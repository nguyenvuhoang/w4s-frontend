/**
 * Brand Color Configuration
 * Centralized color management for Vietnix Portal
 * 
 * Main brand color: #225087 (Vietnix Blue)
 * This color is used throughout the system for:
 * - Navigation menus
 * - Banner text and headers
 * - Primary buttons
 * - Icons and highlights
 * - Table headers
 * - Success notifications
 */

export type BrandColors = {
  /** Primary brand color - Vietnix Blue */
  primary: string
  /** Primary color with opacity variants */
  primaryLight: string
  primaryDark: string
  primaryOpacity03: string
  primaryOpacity04: string
  primaryOpacity06: string
  /** RGB values for dynamic usage */
  primaryRgb: string
  /** Hover state for primary color */
  primaryHover: string
}

/**
 * Vietnix Brand Color Configuration
 * Change the 'primary' value to update the color across the entire system
 */
const brandColorConfig: BrandColors = {
  // Main brand color - Change this to update system-wide color
  primary: '#225087',
  
  // Computed variants (automatically derived from primary)
  primaryLight: '#6EC2F7',
  primaryDark: '#1780AC',
  primaryHover: '#1780AC',
  
  // Opacity variants for backgrounds and highlights
  primaryOpacity03: 'rgba(39, 164, 242, 0.03)',
  primaryOpacity04: 'rgba(39, 164, 242, 0.04)',
  primaryOpacity06: 'rgba(39, 164, 242, 0.6)',
  
  // RGB format for dynamic color composition
  primaryRgb: '39, 164, 242'
}

/**
 * Helper function to get brand color with custom opacity
 * @param opacity - Opacity value between 0 and 1
 * @returns RGBA color string
 */
export const getBrandColorWithOpacity = (opacity: number): string => {
  return `rgba(${brandColorConfig.primaryRgb}, ${opacity})`
}

/**
 * Helper function to apply brand color to MUI components
 * Usage: <Button sx={brandButtonSx}>Click me</Button>
 */
export const brandButtonSx = {
  bgcolor: brandColorConfig.primary,
  '&:hover': {
    bgcolor: brandColorConfig.primaryHover
  },
  color: 'white',
  textTransform: 'none'
} as const

/**
 * Helper for outlined button with brand color
 */
export const brandOutlinedButtonSx = {
  color: brandColorConfig.primary,
  borderColor: brandColorConfig.primary,
  '&:hover': {
    borderColor: brandColorConfig.primaryHover,
    bgcolor: brandColorConfig.primaryOpacity03
  },
  textTransform: 'none'
} as const

/**
 * Helper for table header with brand color background
 */
export const brandTableHeaderSx = {
  backgroundColor: brandColorConfig.primary,
  color: 'white',
  fontWeight: 600
} as const

/**
 * Helper for icon with brand color
 */
export const brandIconSx = {
  color: brandColorConfig.primary
} as const

/**
 * Helper for typography with brand color
 */
export const brandTypographySx = {
  color: brandColorConfig.primary,
  fontWeight: 600
} as const

export default brandColorConfig
