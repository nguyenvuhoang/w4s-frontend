import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    NEXTAUTH_SECRET: z.string().optional(),
    NEXT_PUBLIC_APPLICATION_CODE: z.string().optional(),
    TURNSTILE_SECRET: z.string().optional(),
    NEXT_PUBLIC_REPORT_URI: z.string().optional(),
    ALLOW_INSECURE_REPORT_SSL: z.string().optional(),
    NEXT_PUBLIC_REST_API_ENDPOINT: z.string().optional(),
    API_URL: z.string().optional(),

  },
  client: {
    NEXT_PUBLIC_APP_URL: z.string().optional(),
    NEXT_PUBLIC_API_URL: z.string().optional(),
    NEXT_PUBLIC_API_IMAGE: z.string().optional(),
    NEXT_PUBLIC_SIGNALR: z.string().optional(),
    NEXT_PUBLIC_REPORT_URI: z.string().optional(),
    NEXT_PUBLIC_APPLICATION_CODE: z.string().optional(),
    NEXT_PUBLIC_APPLICATION_TITLE: z.string().optional(),
    NEXT_PUBLIC_VERSION: z.string().optional(),
    NEXT_PUBLIC_REST_API_CDN_ENDPOINT: z.string().optional(),
    NEXT_PUBLIC_TURNSTILE_SITE_KEY: z.string().optional(),
    NEXT_PUBLIC_ENVIRONMENT: z.string().default("development"),
    ALLOW_INSECURE_REPORT_SSL: z.string().optional(),
    NEXT_PUBLIC_REST_API_ENDPOINT: z.string().optional(),
  },
  runtimeEnv: {
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_API_IMAGE: process.env.NEXT_PUBLIC_IMAGE_API_ENDPOINT,
    NEXT_PUBLIC_SIGNALR: process.env.NEXT_PUBLIC_SIGNALR,
    NEXT_PUBLIC_REPORT_URI: process.env.NEXT_PUBLIC_REPORT_URI,
    NEXT_PUBLIC_APPLICATION_CODE: process.env.NEXT_PUBLIC_APPLICATION_CODE,
    NEXT_PUBLIC_APPLICATION_TITLE: process.env.NEXT_PUBLIC_APPLICATION_TITLE,
    NEXT_PUBLIC_VERSION: process.env.NEXT_PUBLIC_VERSION,
    NEXT_PUBLIC_REST_API_CDN_ENDPOINT: process.env.NEXT_PUBLIC_REST_API_CDN_ENDPOINT,
    NEXT_PUBLIC_TURNSTILE_SITE_KEY: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
    TURNSTILE_SECRET: process.env.TURNSTILE_SECRET,
    NEXT_PUBLIC_ENVIRONMENT: process.env.NEXT_PUBLIC_ENVIRONMENT,
    ALLOW_INSECURE_REPORT_SSL: process.env.ALLOW_INSECURE_REPORT_SSL,
    NEXT_PUBLIC_REST_API_ENDPOINT: process.env.NEXT_PUBLIC_REST_API_ENDPOINT,
    API_URL: process.env.API_URL
  }
})
