import React, { Dispatch, SetStateAction } from 'react'
// Type Imports
import type {
  VerticalSubMenuDataType
} from '@shared/types/menuTypes'
import Image from 'next/image'
import Link from 'next/link'
import { getDictionary } from '@utils/getDictionary'
import { env } from '@/env.mjs'

// Next Imports
import { useParams } from 'next/navigation'

// Util Imports
import { getLocalizedUrl } from '@utils/i18n'
import type { Locale } from '@configs/i18n'


type Props = {
  dictionary: Awaited<ReturnType<typeof getDictionary>>
  menuData: VerticalSubMenuDataType | null
  setIsSubNavVisible: Dispatch<SetStateAction<boolean>>
}
// Generate Vertical menu from the menu data array
export const GenerateSubMenu = ({ menuData, dictionary, setIsSubNavVisible }: Props) => {
  // Hooks
  const { locale } = useParams()

  const renderSubMenuItems = (data: VerticalSubMenuDataType | null) => {
    const subMenuItem = data as VerticalSubMenuDataType
    const itemChildren = subMenuItem?.children || (subMenuItem as any)?.items || (subMenuItem as any)?.submenus || []
    const validChildren = itemChildren.filter((c: any) => {
      const cType = c.command_type || c.commandType;
      return !cType || cType.toUpperCase() === 'M';
    });

    return (
      <div className='space-y-6'>
        <div id="generate-menu" className="grid grid-cols-2 gap-4">
          {validChildren.map((submenu, index: number) => {
            const nestedChildren = (submenu as any).children || (submenu as any).items || (submenu as any).submenus || [];
            const hasChildren = nestedChildren.length > 0;

            return (
              <div key={index} className="flex flex-col p-4 space-y-4 bg-white border border-gray-100 shadow-sm transition-all duration-200 hover:shadow-md hover:border-gray-200 !rounded-2xl h-full items-start" style={{ width: '100%' }}>
                <Link
                  href={getLocalizedUrl(submenu.href || '#', locale as Locale)}
                  onClick={() => !hasChildren && setIsSubNavVisible(false)}
                  className='flex items-start self-stretch w-full h-full gap-2 items-start hover:text-[#066a4c] transition-colors'
                >
                  <div className="flex self-stretch gap-2 items-start bg-gray-50 p-2 rounded-lg">
                    <Image
                      src={`${env.NEXT_PUBLIC_API_IMAGE}/sub/${submenu.prefix}/${submenu.icon}.svg`}
                      alt={typeof submenu.label === 'string' ? submenu.label : ''}
                      width={24}
                      height={24}
                      className="object-contain"
                      onError={(e: any) => {
                        e.currentTarget.style.display = 'none';
                        if (e.currentTarget.nextSibling) {
                          (e.currentTarget.nextSibling as HTMLElement).style.display = 'block';
                        }
                      }}
                    />
                    <i className="ri-list-settings-line text-[#066a4c] text-xl hidden" />
                  </div>
                  <div className="text-14-semibold text-[#066a4c] mt-1">
                    {submenu.label}
                  </div>
                </Link>

                {hasChildren && (
                  <div className="flex flex-col w-full space-y-1 mt-3 pl-1 border-l-2 border-[#066a4c]/10 ml-2">
                    {nestedChildren.map((child: any, childIdx: number) => (
                      <Link
                        key={childIdx}
                        href={getLocalizedUrl(child.href || '#', locale as Locale)}
                        onClick={() => setIsSubNavVisible(false)}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-13-medium text-gray-600 hover:text-[#066a4c] hover:bg-[#F3FFE9] transition-all group/nested"
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-gray-300 group-hover/nested:bg-[#066a4c] transition-colors" />
                        <span>{child.label}</span>
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
                        href={getLocalizedUrl(utilitiesmenu.href || '#', locale as Locale)}
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


