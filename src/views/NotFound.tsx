'use client'

// Next Imports
import Link from 'next/link'

// MUI Imports
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'

// Type Imports

// Hook Imports
import Image from 'next/image'

const NotFound = () => {
  // Vars
  const lightImg = '/images/pages/misc-mask-1-light.png'

  return (
    <div className='flex items-center justify-center min-bs-[100dvh] relative p-6 overflow-x-hidden'>
      <div className='flex items-center flex-col text-center gap-10'>
        <div className='flex flex-col gap-2 is-[90vw] sm:is-[unset]'>
          <Typography className='font-medium text-8xl' color='text.primary'>
            404
          </Typography>
          <Typography variant='h4'>Page Not Found ⚠️</Typography>
          <Typography>We couldn&#39;t find the page you are looking for.</Typography>
        </div>
        <Image
          alt='error-illustration'
          src='/images/illustrations/characters/3.png'
          className='object-cover bs-[400px] md:bs-[450px] lg:bs-[500px]'
          width={200}
          height={100}
        />
        <Button href='/' component={Link} variant='contained'>
          Back to Home
        </Button>
      </div>
      <Image src={lightImg}
        className='absolute bottom-0 z-[-1] is-full max-md:hidden'
        alt='miscbackground'
        width={1280}
        height={300}
      />
    </div>
  )
}

export default NotFound
