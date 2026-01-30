'use client'

// React Imports
import type { ReactElement } from 'react'

// Type Imports

// Hook Imports
import { useSettings } from '@core/hooks/useSettings'
import { Box } from '@mui/material'
import { Toaster } from 'react-hot-toast'

type LayoutWrapperProps = {
  verticalLayout: ReactElement
  horizontalLayout: ReactElement
}

const LayoutWrapper = (props: LayoutWrapperProps) => {
  // Props
  const { verticalLayout, horizontalLayout } = props

  // Hooks
  const { settings } = useSettings()

  // Return the layout based on the layout context
  return (
    <Box className='flex flex-col flex-auto' data-skin={settings.skin}>
      {settings.layout === 'horizontal' ? horizontalLayout : verticalLayout}

      <Toaster
        position="bottom-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#225087',
            color: 'white',
            fontSize: '14px'
          }
        }}
      />
    </Box>
  )
}

export default LayoutWrapper
