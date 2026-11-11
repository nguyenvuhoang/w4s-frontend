import { auth } from '@/auth';
import { i18n } from '@/configs/i18n';
import { constructValidLocaleUrl, extractLocaleFromPath, isValidLocale } from '@utils/locale';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  // Skip middleware for static files and API routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/images') ||
    pathname.startsWith('/assets') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  const hostname = request.headers.get('host')?.split(':')[0]?.toLowerCase() ?? '';
  const isPartnerHost = hostname === 'partner.ips.vn' || hostname.startsWith('partner.');
  const partnerRouteMatch = pathname.match(/^\/([a-z]{2})\/partner(?:\/|$)/);

  // Partner Portal shares this app but keeps its route and session isolated from Backoffice.
  if (isPartnerHost || partnerRouteMatch) {
    const locale = partnerRouteMatch?.[1] ?? i18n.defaultLocale;
    const basePath = `/${locale}/partner`;
    const partnerPath = partnerRouteMatch ? (pathname.slice(basePath.length) || '/') : pathname;
    const canonicalPath = `${basePath}${partnerPath === '/' ? '/login' : partnerPath}`;

    // Always expose the locale-prefixed canonical URL requested by the Partner Portal.
    if (!partnerRouteMatch) {
      return NextResponse.redirect(new URL(canonicalPath, request.url));
    }

    const partnerSession = request.cookies.get('ips_partner_session')?.value;
    const isPartnerLogin = partnerPath === '/login';
    if (!partnerSession && !isPartnerLogin) {
      const loginUrl = new URL(`${basePath}/login`, request.url);
      loginUrl.searchParams.set('redirectTo', pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (partnerSession && isPartnerLogin) {
      return NextResponse.redirect(new URL(`${basePath}/scan`, request.url));
    }
    return NextResponse.next();
  }

  const isAuthRoute =
    pathname.includes('/login') ||
    pathname.includes('/logout') ||
    pathname.includes('/auth') ||
    pathname.includes('/forgot-password') ||
    pathname.includes('/verify-') ||
    pathname.includes('/change-password') ||
    pathname.includes('/maintenance');

  // Handle invalid locales - redirect to default locale with same path structure
  const { locale: extractedLocale, isValid: isValidExtractedLocale } = extractLocaleFromPath(pathname);

  if (!isValidExtractedLocale && extractedLocale !== i18n.defaultLocale) {
    console.log(`[Middleware] Invalid locale '${extractedLocale}' detected, redirecting to default locale '${i18n.defaultLocale}'`);

    // Construct a valid URL with the default locale
    const redirectUrl = constructValidLocaleUrl(pathname, request.url);
    return NextResponse.redirect(redirectUrl);
  }

  const hasLocalePrefix = pathname === `/${i18n.defaultLocale}` || i18n.locales.some(
    locale => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`)
  );

  if (!hasLocalePrefix) {
    const redirectUrl = new URL(`/${i18n.defaultLocale}${pathname === '/' ? '' : pathname}`, request.url);
    return NextResponse.redirect(redirectUrl);
  }

  // Auth-related routes are public once the locale prefix is valid.
  if (isAuthRoute) {
    return NextResponse.next();
  }

  // Handle locale-only paths (e.g., /en, /la, /vi) - redirect to default dashboard page
  const localeOnlyMatch = pathname.match(/^\/([a-z]{2})$/);
  if (localeOnlyMatch) {
    const locale = localeOnlyMatch[1];

    // Additional validation for locale-only paths
    if (!isValidLocale(locale)) {
      console.log(`[Middleware] Invalid locale-only path '/${locale}', redirecting to '/${i18n.defaultLocale}'`);
      return NextResponse.redirect(new URL(`/${i18n.defaultLocale}`, request.url));
    }

    console.log(`[Middleware] Locale-only path /${locale} accessed`);

    // Check session for locale-only paths
    try {
      const session = await auth();
      if (session) {
        // User is authenticated, redirect to dashboards
        if (session.user?.is_first_login) {
          console.log(`[Middleware] First login detected for user, redirecting to change-password`);
          return NextResponse.redirect(new URL(`/${locale}/change-password`, request.url));
        }
        console.log(`[Middleware] Authenticated user accessing /${locale}, redirecting to dashboards`);
        return NextResponse.redirect(new URL(`/${locale}/dashboards`, request.url));
      } else {
        // User is not authenticated, redirect to login
        console.log(`[Middleware] Unauthenticated user accessing /${locale}, redirecting to login`);
        return NextResponse.redirect(new URL(`/${locale}/login`, request.url));
      }
    } catch (error) {
      console.error('[Middleware] Error checking session for locale path:', error);
      return NextResponse.redirect(new URL(`/${locale}/login`, request.url));
    }
  }

  try {
    // Get current session
    const session = await auth();

    // If no session and trying to access protected routes, redirect to login
    if (!session) {
      console.log(`[Middleware] No session found for ${pathname}, redirecting to login`);

      // Extract locale from pathname with validation
      const { validLocale } = extractLocaleFromPath(pathname);

      // Create login URL with redirect parameter
      const loginUrl = new URL(`/${validLocale}/login`, request.url);
      loginUrl.searchParams.set('redirectTo', pathname);

      return NextResponse.redirect(loginUrl);
    }

    // If session exists but trying to access login page, redirect to dashboards
    if (session && pathname.includes('/login')) {
      console.log(`[Middleware] Session exists but accessing login page, redirecting to dashboards`);

      const { validLocale } = extractLocaleFromPath(pathname);

      const dashboardUrl = new URL(`/${validLocale}/dashboards`, request.url);
      return NextResponse.redirect(dashboardUrl);
    }

  } catch (error) {
    console.error('[Middleware] Error checking session:', error);

    // On error, redirect to login with valid locale
    const { validLocale } = extractLocaleFromPath(pathname);
    const loginUrl = new URL(`/${validLocale}/login`, request.url);

    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public assets
     */
    '/((?!api|_next/static|_next/image|favicon.ico|images|assets|public).*)',
  ],
};
