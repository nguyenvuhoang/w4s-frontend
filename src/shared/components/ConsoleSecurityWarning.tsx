'use client'

import { O24Console } from '@vknighthub/o24-console/react'

const ConsoleSecurityWarning = () => {
  return (
    <O24Console
      product='IPS'
      description='Integrated Property System'
      environment={process.env.NEXT_PUBLIC_APP_ENV}
      version={process.env.NEXT_PUBLIC_APP_VERSION}
      build='Local'
    />
  )
}

export default ConsoleSecurityWarning