'use client'

import { IconButton } from '@mui/material'
import { signOut } from 'next-auth/react'
import React from 'react'

type Props = {}

const Logout = (props: Props) => {
    const handleUserLogout = async () => {
        try {
            // Sign out from the app
            await signOut({ callbackUrl: process.env.NEXT_PUBLIC_APP_URL })
        } catch (error) {
            console.error(error)
        }
    }
    return (
        <div className='flex items-center gap-4'>
            <div className='flex items-center gap-2'>
                <IconButton
                    className='flex gap-1 p-2 rounded-full cursor-pointer flag text-[22px] text-white'
                    onClick={handleUserLogout}
                >
                    <i className='ri-logout-box-r-line' />
                </IconButton>
            </div>
        </div>
    )
}

export default Logout
