/**
 * Authorization utilities for route access control
 * 
 * This module provides server-side authorization checks to prevent
 * unauthorized access to routes even when users know the direct URL.
 */

import type { VerticalMenuDataType, VerticalSubMenuDataType } from '@/types/menuTypes';

/**
 * Extract all accessible routes from user_command menu structure
 * @param menuData - User's menu data from API (user_command)
 * @returns Set of accessible route paths
 */
export function extractAccessibleRoutes(menuData: VerticalSubMenuDataType[] | undefined): Set<string> {
  const routes = new Set<string>();

  if (!menuData || !Array.isArray(menuData)) {
    return routes;
  }

  function traverse(items: (VerticalSubMenuDataType | VerticalMenuDataType)[]): void {
    for (const item of items) {
      // Add href if it exists
      if ('href' in item && item.href) {
        routes.add(item.href);
      }

      // Recursively traverse children
      if ('children' in item && Array.isArray(item.children)) {
        traverse(item.children);
      }

      // Traverse utilities if exists
      if ('utilities' in item && Array.isArray(item.utilities)) {
        traverse(item.utilities);
      }
    }
  }

  traverse(menuData);
  return routes;
}

/**
 * Check if user has access to a specific route
 * @param userCommand - User's menu data from API
 * @param routePath - Path to check (e.g., '/contract-management/lock')
 * @returns true if user has access, false otherwise
 */
export function hasRouteAccess(
  userCommand: VerticalSubMenuDataType[] | undefined,
  routePath: string
): boolean {
  const accessibleRoutes = extractAccessibleRoutes(userCommand);
  
  // Normalize route path (remove trailing slash, ensure leading slash)
  const normalizedPath = routePath.startsWith('/') ? routePath : `/${routePath}`;
  const cleanPath = normalizedPath.replace(/\/$/, '');
  
  return accessibleRoutes.has(cleanPath);
}

/**
 * Check if user has access to any route matching a pattern
 * Useful for checking access to a group of routes
 * @param userCommand - User's menu data from API
 * @param pattern - RegExp or string pattern to match
 * @returns true if user has access to any matching route
 */
export function hasRouteAccessPattern(
  userCommand: VerticalSubMenuDataType[] | undefined,
  pattern: RegExp | string
): boolean {
  const accessibleRoutes = extractAccessibleRoutes(userCommand);
  const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
  
  for (const route of accessibleRoutes) {
    if (regex.test(route)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Get all accessible routes for debugging
 * @param userCommand - User's menu data from API
 * @returns Array of accessible route paths
 */
export function getAccessibleRoutes(userCommand: VerticalSubMenuDataType[] | undefined): string[] {
  return Array.from(extractAccessibleRoutes(userCommand)).sort();
}
