'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useLocaleValidation } from '@/hooks/useLocale';
import { constructValidLocaleUrl } from '@/utils/locale';

interface LocaleValidatorProps {
  children: React.ReactNode;
}

/**
 * Component to validate locale on client-side and redirect if invalid
 * This provides a fallback in case middleware doesn't catch invalid locales
 */
export function LocaleValidator({ children }: LocaleValidatorProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { currentLocale, validLocale, isValid } = useLocaleValidation();

  useEffect(() => {
    if (!isValid && currentLocale && pathname) {
      console.warn(`[LocaleValidator] Invalid locale '${currentLocale}' detected on client, redirecting to '${validLocale}'`);
      
      // Construct the valid URL and redirect
      const validUrl = constructValidLocaleUrl(pathname, window.location.origin, validLocale);
      router.replace(validUrl.pathname + validUrl.search);
    }
  }, [currentLocale, validLocale, isValid, pathname, router]);

  // Don't render children if locale is invalid (prevents flash)
  if (!isValid && currentLocale) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-sm text-gray-600">Redirecting to valid locale...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}