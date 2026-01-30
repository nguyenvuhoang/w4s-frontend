'use client';
/* eslint-disable */

import { PageContentProps } from '@shared/types';
import { getStaticPage, hasStaticPage } from './index';

interface StaticPageRendererProps extends PageContentProps {
  formcode: string;
}

/**
 * StaticPageRenderer - Wrapper component to render static pages
 * 
 * This component exists to render static page components based on formcode.
 * The components are pre-defined in the registry (STATIC_PAGES_MAP) and
 * retrieved by reference - they are NOT created during render.
 * 
 * Note: The React Compiler warning about "creating components during render"
 * is a false positive here. We're only retrieving a reference to an existing
 * component from a static map, not dynamically creating a new component.
 */
const StaticPageRenderer = ({
  formcode,
  dictionary,
  formdata,
  id,
  locale,
  session,
  dataview
}: StaticPageRendererProps) => {
  // Get component reference from registry - this does NOT create a new component
  // It only retrieves a reference to an already-defined component from STATIC_PAGES_MAP
  const Component = getStaticPage(formcode);
  
  if (!Component) {
    return null;
  }

  return (
    <Component
      dictionary={dictionary}
      formdata={formdata}
      id={id}
      locale={locale}
      session={session}
      dataview={dataview}
    />
  );
};

export default StaticPageRenderer;
export { hasStaticPage };

