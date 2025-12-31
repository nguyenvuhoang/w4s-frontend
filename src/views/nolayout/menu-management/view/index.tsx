'use client'

import { Card, CardContent, Typography } from '@mui/material'
import type { Locale } from '@configs/i18n'

type Props = {
  locale: Locale
  id: string
}

export default function MenuManagementViewContent({ locale, id }: Props) {
  return (
    <Card>
      <CardContent>
        <Typography variant='h4' className='mb-4'>
          MenuManagement Details
        </Typography>
        
        {/* TODO: Implement detail view */}
        <Typography variant='body2' color='text.secondary'>
          ID: {id} | Locale: {locale}
        </Typography>
      </CardContent>
    </Card>
  )
}
