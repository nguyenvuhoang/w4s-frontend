'use client'

import { Card, CardContent, Typography, Button } from '@mui/material'

type Props = {
  error: Error & { digest?: string }
  reset: () => void
}

export default function MenuManagementError({ error, reset }: Props) {
  return (
    <Card>
      <CardContent className='flex flex-col items-center gap-4 py-8'>
        <Typography variant='h5' color='error'>
          MenuManagement Error
        </Typography>
        <Typography variant='body2' color='text.secondary' className='text-center'>
          {error.message || 'Something went wrong loading menu-management'}
        </Typography>
        <Button variant='contained' onClick={reset}>
          Try Again
        </Button>
      </CardContent>
    </Card>
  )
}
