import NextAuth, { type NextAuthConfig, type User } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { env } from "./env.mjs";
import { edgeFetch } from "./utils/edgeFetch";

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
          console.log('[AUTH] API_URL:', apiUrl);
          console.log('[AUTH] Full URL:', `${apiUrl}/login`);
          
          if (!apiUrl) {
            throw new Error('[AUTH] API_URL is not defined in environment variables');
          }

          // Use edge-compatible fetch with proper error handling
          const res = await edgeFetch(`${apiUrl}/login`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              lang: language,
              app: env.NEXT_PUBLIC_APPLICATION_CODE ?? "SYS",
              my_device: JSON.stringify(deviceInfo)
            },
            body: JSON.stringify({ username, password, is_reset_device }),
            timeout: 30000 // 30 second timeout
          });
          // Check if response is JSON before parsing
          const contentType = res.headers.get("content-type");
          
          // Get the raw response text first to see what we're receiving
          const textResponse = await res.text();
          if (!contentType || !contentType.includes("application/json")) {
            console.error('[AUTH] Non-JSON response received!');
            throw new Error(`Expected JSON but received ${contentType || 'unknown content type'}. This usually means the API endpoint is unreachable or returning an error page.`);
          }

          // Parse the JSON from the text response
          let data;
          try {
            data = JSON.parse(textResponse);
          } catch (e) {
            console.error('[AUTH] JSON parse error:', e);
            throw new Error(`Failed to parse JSON response: ${textResponse.substring(0, 200)}`);
          }
          
          console.log('[AUTH] Response data:', data);
          
          if ([401, 404].includes(res.status)) {
            throw new Error(`[CTH_LOGIN] [ERROR] ${data.error}`);
          }

          if (res.status === 299) {
            throw new Error(JSON.stringify({
              code: data.error,
              message: data.message,
              level: "warning"
            }));
          }

          if (res.status === 500) {
            throw new Error("The server is temporarily unavailable. Please try again later!");
          }

          if (res.status === 200 && data) {
            return {
              token: data.token,
              refresh_token: data.refresh_token
            } as unknown as User;
          }

          return null;
        } catch (e: any) {
          console.error("Authorize error:", e);
          throw new Error(e?.message || "Unexpected error");
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
  debug: process.env.NODE_ENV === 'development',
  callbacks: {
    async jwt({ token, user }) {
      if (user && "token" in user) {
        token.token = (user as any).token ?? null;
        token.refresh_token = (user as any).refresh_token ?? null;
      }
      return token;
    },
    async session({ session, token }) {
      if (!session.user) return session;

      session.user.token = token.token as string | null;
      session.user.refresh_token = token.refresh_token as string | null;

      return session;
    }
  }
};

// Exports
export const { handlers, signIn, signOut, auth } = NextAuth(authConfig);
