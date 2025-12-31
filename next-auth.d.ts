// types/next-auth.d.ts
import NextAuth, { DefaultSession, DefaultUser } from "next-auth"

declare module "next-auth" {
  interface Session extends DefaultSession {
    user?: {
      name?: string | null
      email?: string | null
      token?: string | null
      refresh_token?: string | null
      is_first_login?: boolean | null
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
