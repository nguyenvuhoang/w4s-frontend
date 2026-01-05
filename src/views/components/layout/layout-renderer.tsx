'use client';

import { PageContentProps } from '@/types';

import StaticPageRenderer, { hasStaticPage } from './static-pages/StaticPageRenderer';
import { DynamicFormRenderer } from './dynamic-pages';

// ============================================================================
// Main Component - Router for Static vs Dynamic
// ============================================================================

const LayoutRenderer = ({
  dictionary,
  formdata,
  id,
  locale,
  session,
  dataview
}: PageContentProps) => {
  const formcode = formdata?.form_design_detail?.info?.form_code;

  // If a static page exists for this formcode, render it
  if (formcode && hasStaticPage(formcode)) {
    return (
      <StaticPageRenderer
        formcode={formcode}
        dictionary={dictionary}
        formdata={formdata}
        id={id}
        locale={locale}
        session={session}
        dataview={dataview}
      />
    );
  }

  // Default: use dynamic form renderer
  return (
    <DynamicFormRenderer
      dictionary={dictionary}
      formdata={formdata}
      id={id}
      locale={locale}
      session={session}
    />
  );
};

export default LayoutRenderer;
