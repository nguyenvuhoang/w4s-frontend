import useVerticalNav from '@/@menu/hooks/useVerticalNav'
import { GenerateSubMenu } from '@/components/GenerateSubMenu'
import { VerticalSubMenuDataType } from '@/types/menuTypes'
import { getDictionary } from '@/utils/getDictionary'
import menuItemStyles from '@core/styles/vertical/menuItemStyles'
import menuSectionStyles from '@core/styles/vertical/menuSectionStyles'
import { Menu } from '@menu/vertical-menu'
import { useTheme } from '@mui/material/styles'
import { Dispatch, SetStateAction } from 'react'
import PerfectScrollbar from 'react-perfect-scrollbar'

type Props = {
    dictionary: Awaited<ReturnType<typeof getDictionary>>
    scrollMenu: (container: any, isPerfectScrollbar: boolean) => void,
    parentItem: VerticalSubMenuDataType | null
    setIsSubNavVisible: Dispatch<SetStateAction<boolean>>
}
const VerticalSubMenu = ({ dictionary, scrollMenu, parentItem, setIsSubNavVisible }: Props) => {
    const { isBreakpointReached } = useVerticalNav()
    const ScrollWrapper = isBreakpointReached ? 'div' : PerfectScrollbar
    const verticalNavOptions = useVerticalNav()
    const theme = useTheme()
    return (
        <ScrollWrapper
            {...(isBreakpointReached
                ? {
                    className: 'bs-full overflow-y-auto overflow-x-hidden',
                    onScroll: container => scrollMenu(container, false)
                }
                : {
                    options: { wheelPropagation: false, suppressScrollX: true },
                    onScrollY: container => scrollMenu(container, true)
                })}
        >
            <Menu
                popoutMenuOffset={{ mainAxis: 18 }}
                menuItemStyles={menuItemStyles(verticalNavOptions, theme)}
                renderExpandedMenuItemIcon={{ icon: <i className='ri-circle-fill' /> }}
                menuSectionStyles={menuSectionStyles(verticalNavOptions, theme)}
            >
                <GenerateSubMenu
                    menuData={parentItem}
                    dictionary={dictionary}
                    setIsSubNavVisible={setIsSubNavVisible}
                />
            </Menu>

        </ScrollWrapper>
    )
}

export default VerticalSubMenu
