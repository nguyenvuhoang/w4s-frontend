/**
 * Idle Timeout feature toggle (logout caused by user inactivity).
 *
 * - NEXT_PUBLIC_ENABLE_IDLE_TIMEOUT=true  -> enabled (current framework behavior)
 * - NEXT_PUBLIC_ENABLE_IDLE_TIMEOUT=false -> disabled, no auto-logout because of inactivity
 * - not set                               -> enabled (backward compatible default)
 *
 * Only affects inactivity-based logout. Manual logout, backend 401 / invalid token handling and
 * the NextAuth session expiry are independent and stay active regardless of this flag.
 *
 * NEXT_PUBLIC_* values are inlined at build time: changing this flag requires a rebuild.
 */
export const ENABLE_IDLE_TIMEOUT = process.env.NEXT_PUBLIC_ENABLE_IDLE_TIMEOUT?.trim().toLowerCase() !== 'false'
