import 'server-only'
import { cookies } from 'next/headers'
import type { Settings } from '@core/contexts/settingsContext'
import type { SystemMode } from '@core/types'
import themeConfig from '@configs/themeConfig'

const safeParse = <T>(val: string | undefined, fallback: T): T => {
  try { return val ? (JSON.parse(val) as T) : fallback } catch { return fallback }
}

export const getSettingsFromCookie = async (): Promise<Settings> => {
  const cookieStore = await cookies()
  const cookieName = themeConfig.settingsCookieName
  return safeParse<Settings>(cookieStore.get(cookieName)?.value, {} as Settings)
}

export const getMode = async () => {
  const s = await getSettingsFromCookie()
  return s.mode || themeConfig.mode
}

export const getSystemMode = async (): Promise<SystemMode> => {
  const cookieStore = await cookies()
  const mode = await getMode()
  const colorPref = (cookieStore.get('colorPref')?.value || 'light') as SystemMode
  return (mode === 'system' ? colorPref : (mode as SystemMode)) || 'light'
}

export const getServerMode = async (): Promise<SystemMode> => {
  const mode = await getMode()
  const systemMode = await getSystemMode()
  return (mode === 'system' ? systemMode : (mode as SystemMode)) || 'light'
}

export const getSkin = async () => {
  const s = await getSettingsFromCookie()
  return s.skin || 'default'
}
