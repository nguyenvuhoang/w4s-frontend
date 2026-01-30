// Type Imports
import type { Locale } from '@configs/i18n';
import type { ChildrenType } from '@core/types';
// Component Imports
import RequireSession from '@/hocs/RequireSession';
import { getDictionary } from '@utils/getDictionary';

export default function AuthGuard({ children, locale, dictionary }:
  ChildrenType & {
    locale: Locale,
    dictionary: Awaited<ReturnType<typeof getDictionary>>
  }) {
  return <RequireSession locale={locale} dictionary={dictionary}>{children}</RequireSession>;
}

