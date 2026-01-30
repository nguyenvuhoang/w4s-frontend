import { useMemo } from 'react'
import { MenuItem } from '@shared/types/systemTypes'

export type MenuItemWithChildren = MenuItem & {
    children?: MenuItemWithChildren[]
    level?: number
}

export const useMenuTree = (items: MenuItem[]) => {
    // Build map of parent_id -> count of children
    const parentChildMap = useMemo(() => {
        const map = new Map<string, number>()
        items.forEach(item => {
            if (item.parent_id && item.parent_id !== '0') {
                map.set(item.parent_id, (map.get(item.parent_id) || 0) + 1)
            }
        })
        return map
    }, [items])

    // Build tree structure
    const buildTree = useMemo((): MenuItemWithChildren[] => {
        const map = new Map<string, MenuItemWithChildren>()
        const roots: MenuItemWithChildren[] = []

        // Create map of all items
        items.forEach(item => {
            map.set(item.command_id, { ...item, children: [], level: 0 })
        })

        // Build tree
        items.forEach(item => {
            const node = map.get(item.command_id)!
            const parentId = item.parent_id === '0' || !item.parent_id ? null : item.parent_id
            
            if (parentId && map.has(parentId)) {
                const parent = map.get(parentId)!
                node.level = (parent.level || 0) + 1
                parent.children!.push(node)
            } else {
                roots.push(node)
            }
        })

        // Sort by display_order
        const sortNodes = (nodes: MenuItemWithChildren[]) => {
            nodes.sort((a, b) => a.display_order - b.display_order)
            nodes.forEach(node => {
                if (node.children && node.children.length > 0) {
                    sortNodes(node.children)
                }
            })
        }
        sortNodes(roots)

        return roots
    }, [items])

    // Flatten tree for display with hierarchy
    const flattenTree = (nodes: MenuItemWithChildren[], expanded: Set<string>): MenuItemWithChildren[] => {
        const result: MenuItemWithChildren[] = []
        
        const traverse = (nodes: MenuItemWithChildren[]) => {
            nodes.forEach(node => {
                result.push(node)
                if (expanded.has(node.command_id) && node.children && node.children.length > 0) {
                    traverse(node.children)
                }
            })
        }
        
        traverse(nodes)
        return result
    }

    // Check if command has children
    const hasChildren = (commandId: string): boolean => {
        return (parentChildMap.get(commandId) || 0) > 0
    }

    // Get all parent IDs for expand all
    const getAllParentIds = (nodes: MenuItemWithChildren[]): string[] => {
        const ids: string[] = []
        const collectIds = (items: MenuItemWithChildren[]) => {
            items.forEach(item => {
                if (item.children && item.children.length > 0) {
                    ids.push(item.command_id)
                    collectIds(item.children)
                }
            })
        }
        collectIds(nodes)
        return ids
    }

    return {
        buildTree,
        flattenTree,
        hasChildren,
        getAllParentIds,
        parentChildMap
    }
}

