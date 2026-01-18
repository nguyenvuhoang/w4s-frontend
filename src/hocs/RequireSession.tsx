import { auth } from '@/auth';
import Logout from '@/views/pages/auth/Logout';
import { getDictionary } from '@/utils/getDictionary';
import { Locale } from '@/configs/i18n';
import React from 'react';

interface RequireSessionProps {
  locale: Locale;
  dictionary?: any;
  children: React.ReactNode;
}

export default async function RequireSession({ locale, dictionary, children }: RequireSessionProps) {
  const [dict, session] = await Promise.all([
    dictionary ? Promise.resolve(dictionary) : getDictionary(locale),
    auth()
  ]);

  if (!session || !session.user || session.user.token?.length === 0) {
    return <Logout locale={locale} dictionary={dict} />;
  }

  return <>{children}</>;
}
