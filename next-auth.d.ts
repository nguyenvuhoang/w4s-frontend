// types/next-auth.d.ts
import NextAuth, { DefaultSession, DefaultUser } from "next-auth"

declare module "next-auth" {
  // Whitelist of what is visible via /api/auth/session, useSession(), getSession() (next-auth/react)
  // AND `auth()` server-side — all four resolve through the SAME session() callback in src/auth.ts
  // (NextAuth v5 gives `auth()` no separate code path), so there is no server-only variant of this
  // type: `token` is ALWAYS the non-secret placeholder ('ips-session-active' / null), never the
  // real backend JWT, regardless of whether the caller is the browser, a Server Component, or a
  // Route Handler. `refresh_token` is likewise always null here.
  //
  // Code that genuinely needs the real backend access/refresh token (a real server-to-backend
  // call) must bypass this type entirely and use getBackendToken(req) (Route Handlers) or
  // getServerBackendToken() (Server Components) — see src/server/auth/ — which decode the
  // encrypted session cookie directly, upstream of this callback.
  interface Session extends DefaultSession {
    user?: {
      name?: string | null
      email?: string | null
      login_name?: string | null
      username?: string | null
      usercode?: string | null
      is_first_login?: boolean | null
      authenticated?: boolean
      token?: string | null
      refresh_token?: string | null
    }
  }

  interface User extends DefaultUser {
    input: {
      name?: string | null
      email?: string | null
      token?: string | null
      refresh_token?: string | null
      is_first_login?: boolean | null
    }
  }
}
