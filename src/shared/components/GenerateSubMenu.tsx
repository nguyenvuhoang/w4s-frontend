import React, { Dispatch, SetStateAction } from 'react'
// Type Imports
import type {
  VerticalSubMenuDataType
} from '@shared/types/menuTypes'
import Image from 'next/image'
import Link from 'next/link'
import { getDictionary } from '@utils/getDictionary'
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
    const itemChildren = subMenuItem?.children || (subMenuItem as any)?.items || (subMenuItem as any)?.submenus || []
    const validChildren = itemChildren.filter((c: any) => {
      const cType = c.command_type || c.commandType;
      return !cType || cType.toUpperCase() === 'M';
    });

    return (
      <div className='space-y-6'>
        <div id="generate-menu" className="grid grid-cols-2 gap-2">
          {validChildren.map((submenu, index: number) => {
            const nestedChildren = (submenu as any).children || (submenu as any).items || (submenu as any).submenus || [];
            const hasChildren = nestedChildren.length > 0;

            return (
              <div key={index} className="flex flex-col p-4 space-y-4 bg-backgroundPrimary box shadow-small !rounded-xl h-full items-start" style={{ width: '100%' }}>
                <Link
                  href={submenu.href || '#'}
                  onClick={() => !hasChildren && setIsSubNavVisible(false)}
                  className='flex items-start self-stretch w-full h-full gap-2 items-start hover:text-[#2b630d] hover:opacity-50'
                >
                  <div className="flex self-stretch gap-2 items-start">
                    <Image src={`${env.NEXT_PUBLIC_API_IMAGE}/sub/${submenu.prefix}/${submenu.icon}.svg`} alt={index.toString()} width={28} height={28} />
                  </div>
                  <div className="text-14-semibold text-textBasePrimary">
                    {submenu.label}
                  </div>
                </Link>

                {hasChildren && (
                  <div className="flex flex-col w-full space-y-2 mt-2 pl-2 border-l-2 border-gray-100">
                    {nestedChildren.map((child: any, childIdx: number) => (
                      <Link
                        key={childIdx}
                        href={child.href || '#'}
                        onClick={() => setIsSubNavVisible(false)}
                        className="text-12-medium text-gray-500 hover:text-[#2b630d] transition-colors"
                      >
                        • {child.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
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


