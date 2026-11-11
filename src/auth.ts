import NextAuth, { type NextAuthConfig, type User } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { jwtDecode } from "jwt-decode";
import { env } from "./env.mjs";
import { edgeFetch } from "@utils/edgeFetch";
import { i18n } from "@/configs/i18n";
import type { LoginErrorPayload } from "@features/auth/types";
import logger from '@lib/logger'

const throwLoginError = (payload: LoginErrorPayload): never => {
  throw new Error(JSON.stringify(payload));
};

const isStructuredLoginError = (message: string): boolean => {
  try {
    const parsed = JSON.parse(message);
    return !!parsed && typeof parsed.message === 'string';
  } catch {
    return false;
  }
};

export const authConfig: NextAuthConfig = {
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        username: {},
        password: {},
        my_device: {},
        language: {},
        realtoken: {},
        is_reset_device: {}
      },
      authorize: async (credentials): Promise<User | null> => {
        const {
          username,
          password,
          my_device,
          language,
          is_reset_device,
          realtoken
        } = credentials as any;

        // OTP relogin
        if (realtoken !== undefined) {
          return {
            input: {
              tokenreal: realtoken
            }
          } as User;
        }

        const deviceInfo = JSON.parse(my_device);

        try {
          const apiUrl = env.API_URL;

          if (!apiUrl) {
            return throwLoginError({
              message: 'API_URL is not defined in environment variables.',
              error_code: 'CONFIG_ERROR',
              execution_id: null,
              type_error: 'danger'
            });
          }

          let res: Response;
          try {
            // Use edge-compatible fetch with proper error handling
            res = await edgeFetch(`${apiUrl}/login`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                lang: language || i18n.defaultLocale,
                app: env.NEXT_PUBLIC_APPLICATION_CODE ?? "SYS",
                my_device: JSON.stringify(deviceInfo)
              },
              body: JSON.stringify({ username, password, is_reset_device }),
              timeout: 30000 // 30 second timeout
            });
          } catch (fetchError) {
            // Genuine network failure or timeout — the only case allowed to report "server unavailable".
            logger.error('[AUTH] Login request failed:', fetchError);
            return throwLoginError({
              message: 'The server is temporarily unavailable. Please try again later!',
              error_code: 'SERVER_UNAVAILABLE',
              execution_id: null,
              type_error: 'danger'
            });
          }

          // Check if response is JSON before parsing
          const contentType = res.headers.get("content-type");

          // Get the raw response text first to see what we're receiving
          const textResponse = await res.text();
          if (!contentType || !contentType.includes("application/json")) {
            logger.error('[AUTH] Non-JSON response received!');
            return throwLoginError({
              message: 'The server returned an invalid response. Please try again later!',
              error_code: 'INVALID_RESPONSE',
              execution_id: null,
              type_error: 'danger'
            });
          }

          // Parse the JSON from the text response
          let data: any;
          try {
            data = JSON.parse(textResponse);
          } catch (e) {
            logger.error('[AUTH] JSON parse error:', e);
            return throwLoginError({
              message: 'The server returned an invalid response. Please try again later!',
              error_code: 'INVALID_RESPONSE',
              execution_id: null,
              type_error: 'danger'
            });
          }

          if (res.status === 200 && data) {
            return {
              token: data.token,
              refresh_token: data.refresh_token
            } as unknown as User;
          }

          // Forward the structured error from /api/login as-is. Do not reinterpret the
          // HTTP status or error_code (e.g. key === "500") into a generic message — it can
          // still be a legitimate business error (e.g. account.temporarily.locked).
          return throwLoginError({
            message: data?.message ?? 'Login failed. Please try again.',
            error_code: data?.error_code ?? (res.status === 299 ? 'HAVELOGGED' : null),
            execution_id: data?.execution_id ?? null,
            type_error: data?.type_error ?? (res.status === 299 ? 'warning' : 'danger')
          });
        } catch (e: any) {
          // Preserve structured errors thrown above as-is; wrap anything unexpected.
          if (e instanceof Error && e.message && isStructuredLoginError(e.message)) {
            throw e;
          }
          logger.error("Authorize error:", e);
          return throwLoginError({
            message: e?.message || 'Unexpected authentication error.',
            error_code: null,
            execution_id: null,
            type_error: 'danger'
          });
        }
      }
    })
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60
  },
  pages: {
    signIn: "/login"
  },
  trustHost: true,
  secret: env.NEXTAUTH_SECRET,
  debug: env.AUTH_DEBUG === 'true',
  callbacks: {
    async jwt({ token, user }) {
      // Backend access/refresh token live ONLY inside this JWT, which NextAuth stores as an
      // encrypted, HttpOnly cookie (JWE, encrypted with NEXTAUTH_SECRET). They must never be
      // copied into the `session` object below — that object is what /api/auth/session and
      // useSession()/getSession() serialize straight to the browser. Server-only code that
      // needs the real backend token must read it via getBackendToken() (next-auth/jwt
      // getToken()), not via auth()/useSession().
      //
      // TODO(refresh-token): token.refresh_token is stored but never consumed anywhere in the
      // codebase — there is no active refresh flow. Today, once the backend access token expires
      // (or the 30-day NextAuth session maxAge below is reached), the user is forced back through
      // a full re-login (http.ts's 401 handling -> logoutClientSession()) rather than a silent
      // refresh. A future phase should add: on backend 401 with a still-valid refresh_token, call
      // the backend's refresh endpoint here (server-side only), rotate both tokens into `token`,
      // and update session.expires accordingly — with a concurrency lock so parallel requests
      // don't all trigger their own refresh. Not implemented in this pass.
      if (user && "token" in user) {
        token.token = (user as any).token ?? null;
        token.refresh_token = (user as any).refresh_token ?? null;
      }
      return token;
    },
    async session({ session, token }) {
      if (!session.user) return session;

      const backendToken = token.token as string | null;

      // Derive display-only claims from the backend JWT server-side so the UI keeps working
      // (username/usercode/login_name were previously read by decoding session.user.token on
      // the client). The raw token itself is intentionally never assigned to session.user.
      let claims: Record<string, unknown> = {};
      if (backendToken) {
        try {
          claims = jwtDecode<Record<string, unknown>>(backendToken);
        } catch {
          claims = {};
        }
      }

      session.user.login_name = (claims.login_name as string | undefined) ?? null;
      session.user.username = (claims.username as string | undefined) ?? null;
      session.user.usercode = (claims.usercode as string | undefined) ?? null;
      session.user.is_first_login = (claims.is_first_login as boolean | undefined) ?? null;
      session.user.authenticated = !!backendToken;

      // NOT a credential — see the doc comment on Session.user.token in next-auth.d.ts. A large
      // number of existing client call sites thread this value through as a `sessiontoken`
      // prop into workflowService/http calls; every one of those now hits a server route that
      // resolves the real backend token itself (getBackendToken()) and ignores this value
      // entirely. Kept as a non-empty/empty marker only so those call sites' truthiness checks
      // and TypeScript types keep working without a mechanical rename across ~150 files.
      session.user.token = backendToken ? 'ips-session-active' : null;

      return session;
    }
  }
};

// Exports
//
// IMPORTANT: `auth()` is used throughout this codebase not only to read the session, but also
// (very commonly) to pass the whole `session` object as a prop straight into Client Components
// (`<Foo session={session} />`, hundreds of call sites). Next.js serializes Server Component
// props into the RSC payload the browser receives, so `auth()` must NEVER carry the real
// backend access/refresh token — doing so would leak it just as badly as the old
// /api/auth/session response did, just via a different transport. `auth()` therefore returns
// exactly what the session() callback above produces: safe, browser-shaped data only.
//
// Server-side code that needs the REAL backend token for a genuine server-to-backend call
// (never forwarded into a Client Component prop) must use getServerBackendToken() from
// src/server/auth/getServerBackendToken.ts (Server Components) or getBackendToken(req) from
// src/server/auth/getBackendToken.ts (Route Handlers) instead.
export const { handlers, signIn, signOut, auth } = NextAuth(authConfig);
