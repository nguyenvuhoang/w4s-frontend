'use client'

import { useImageVariant } from '@/@core/hooks/useImageVariant'
import type { Mode } from '@core/types'
import Image from 'next/image'


const NavBackground = ({ mode }: { mode: Mode }) => {
    const lightImg = '/images/pages/website-mass.jpg'
    const darkImg = '/images/pages/Web-YouPro.jpg'
    const navbackground = useImageVariant(mode, lightImg, darkImg)

    return (
        <div className='outer-wrap had-sidebar'>
            <div className="relative layout-banner-wrap">
                <div className="top relative h-[320px] m-auto overflow-hidden">
                    <div className="bg-gradient-to-t from-backgroundBody to-50% to-backgroundBody/0 absolute top-0 left-0 w-full h-full z-10"></div>
                    <div className="-2xl:hidden bg-gradient-to-r from-backgroundBody to-50% to-backgroundBody/0 absolute top-0 left-0 w-[20%] h-full z-10"></div>
                    <div className="-2xl:hidden bg-gradient-to-l from-backgroundBody to-50% to-backgroundBody/0 absolute top-0 right-0 w-[20%] h-full z-10"></div>
                    <div className="h-full">
                        <Image className='object-cover object-center w-full h-full' src={navbackground} alt="mass" width={1590} height={320} ></Image>
                    </div>
                </div>
                <div className="bottom rotate-180 h-[320px] scale-x-[-1] opacity-40 m-auto overflow-hidden">
                    <div className="absolute bg-gradient-to-t from-backgroundBody via-backgroundBody/0 via-10% to-backgroundBody to-50% top-0 left-0 w-full h-full z-10"></div>
                    <div className="h-full">
                        <Image className='object-cover object-center w-full h-full' src={navbackground} alt="mass" width={1590} height={320} ></Image>
                    </div>
                </div>
            </div>
            <div className="decorative-light"></div>
        </div>
    )
}

export default NavBackground
