import type { VerticalMenuDataType, VerticalSubMenuDataType } from '@shared/types/menuTypes'

export type SearchableMenuItem = {
  id: string
  title: string
  route?: string
  icon?: string
  description?: string
  breadcrumb: string
  favorite?: boolean
  commandCode?: string
  category?: string
  searchText: string
}

export const getMenuChildren = (item: any): VerticalMenuDataType[] => item?.children || item?.items || item?.submenus || []

export const getMenuTitle = (item: any): string => {
  if (!item) return ''

  return String(item.label ?? item.command_name_language ?? item.command_name ?? item.title ?? '')
}

export const getMenuRoute = (item: any): string | undefined => {
  return item?.href || item?.command_uri || item?.command_url || undefined
}

const getDescription = (item: any): string | undefined => {
  return item?.description || item?.command_description || item?.command_desc || item?.tooltip || undefined
}

const getCategory = (item: any): string | undefined => {
  return item?.category || item?.section || item?.group || item?.group_name || item?.module_group || undefined
}

const buildBreadcrumb = (item: any, parents: string[]) => {
  const title = getMenuTitle(item)

  return [...parents, title].filter(Boolean).join(' / ')
}

export const flattenMenus = (items: VerticalMenuDataType[], parents: string[] = []): SearchableMenuItem[] => {
  const flattened: SearchableMenuItem[] = []

  items.forEach((item: any) => {
    const title = getMenuTitle(item)
    const route = getMenuRoute(item)
    const children = getMenuChildren(item)
    const breadcrumb = buildBreadcrumb(item, parents)
    const description = getDescription(item)
    const commandCode = item.command_code || item.command_id || item.id
    const favorite = Boolean(item.favorite ?? item.is_favorite)
    const category = getCategory(item)

    if (route) {
      const searchText = [title, breadcrumb, route, description || '', commandCode || '', category || '']
        .join(' ')
        .toLowerCase()

      flattened.push({
        id: String(item.id ?? item.command_id ?? `${breadcrumb}-${route}`),
        title,
        route,
        icon: item.icon || item.group_menu_icon || item.command_icon,
        description,
        breadcrumb,
        favorite,
        commandCode: commandCode ? String(commandCode) : undefined,
        category,
        searchText
      })
    }

    if (children.length > 0) {
      flattened.push(...flattenMenus(children, title ? [...parents, title] : parents))
    }
  })

  return flattened
}

export const hasMenuChildren = (item: VerticalSubMenuDataType | null | undefined) => getMenuChildren(item).length > 0
