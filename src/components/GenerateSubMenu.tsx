import React, { Dispatch, SetStateAction } from 'react'
// Type Imports
import type {
  VerticalSubMenuDataType
} from '@/types/menuTypes'
import Image from 'next/image'
import Link from 'next/link'
import { getDictionary } from '@/utils/getDictionary'
import { env } from '@/env.mjs'


type Props = {
  dictionary: Awaited<ReturnType<typeof getDictionary>>
  menuData: VerticalSubMenuDataType | null
  setIsSubNavVisible: Dispatch<SetStateAction<boolean>>
}
// Generate Vertical menu from the menu data array
export const GenerateSubMenu = ({ menuData, dictionary, setIsSubNavVisible }: Props) => {

  const renderSubMenuItems = (data: VerticalSubMenuDataType | null) => {
    const subMenuItem = data as VerticalSubMenuDataType

    return (
      <div className='space-y-6'>
        <div id="generate-menu" className="grid grid-cols-2 gap-2">
          {subMenuItem && subMenuItem.children.map((submenu, index: number) => {
            return (
              <Link key={index} href={`${submenu.href}`} className='flex items-start py-3 space-x-3 cursor-pointer hover:text-[#2b630d] hover:opacity-50'>
                <div className="flex flex-col p-4 space-y-4 bg-backgroundPrimary box shadow-small !rounded-xl h-full cursor-pointer items-start" style={{ width: '100%' }}>
                  <div className="flex self-stretch w-full h-full gap-2 items-start">
                    <Image src={`${env.NEXT_PUBLIC_API_IMAGE}/sub/${submenu.prefix}/${submenu.icon}.svg`} alt={index.toString()} width={28} height={28} />
                  </div>
                  <div className="text-14-semibold text-textBasePrimary">
                    {submenu.label}
                  </div>
                </div>
              </Link>

            )
          })}
        </div>
        {subMenuItem && subMenuItem.utilities &&
          <div className="shadow-sm box">
            <div className="box-content box-content-solid">
              <div className="space-y-4">
                <div className="text-heading-5-extrabold">{dictionary['navigation'].utilities}</div>
                <div className="group">
                  {subMenuItem.utilities.map((utilitiesmenu, index) => {
                    return (
                      <Link key={index}
                        href={`/${utilitiesmenu.href}`}
                        onClick={() => setIsSubNavVisible(false)}
                        className='flex items-start py-3 space-x-3 cursor-pointer hover:text-[#2b630d] hover:opacity-50'
                      >
                        <Image src={`/images/transfer/${utilitiesmenu.icon}`} alt='setting limit amount' width={24} height={24}></Image>
                        <div className="title min-h-[24px] flex flex-1 items-center text-14-semibold">{utilitiesmenu.label}</div>
                      </Link>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        }
      </div>
    )
  }

  return <>{renderSubMenuItems(menuData)}</>
}

