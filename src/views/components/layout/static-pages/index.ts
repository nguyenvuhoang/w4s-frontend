/**
 * Static Pages Registry
 * 
 * This file maps form_code values to their corresponding static page components.
 * When a formcode matches an entry in this registry, the DynamicRenderer will
 * render the static component instead of the dynamic form.
 * 
 * Usage:
 * 1. Create a new page component in the static-pages folder
 * 2. Import it here and add it to the STATIC_PAGES_MAP
 * 3. The component will be automatically rendered when the formcode matches
 */

import { ComponentType } from 'react';
import { PageContentProps } from '@/types';

// Import static page components
import WalletProfileViewPage from './WalletProfileViewPage';

/**
 * Static Page Component Type
 * All static pages must implement this interface
 */
export type StaticPageComponent = ComponentType<PageContentProps>;

/**
 * Static Pages Map
 * Key: form_code value from form_design_detail.info.form_code
 * Value: The static page component to render
 */
export const STATIC_PAGES_MAP: Record<string, StaticPageComponent> = {
  WalletProfileView: WalletProfileViewPage,
  // Add more static pages here as needed
  // Example:
  // CustomerDetailsView: CustomerDetailsViewPage,
  // TransactionHistoryView: TransactionHistoryViewPage,
};

/**
 * Check if a formcode has a corresponding static page
 */
export const hasStaticPage = (formcode: string | undefined | null): boolean => {
  if (!formcode) return false;
  return formcode in STATIC_PAGES_MAP;
};

/**
 * Get the static page component for a formcode
 */
export const getStaticPage = (formcode: string): StaticPageComponent | undefined => {
  return STATIC_PAGES_MAP[formcode];
};
