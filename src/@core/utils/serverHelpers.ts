import themeConfig from '@configs/themeConfig';
import type { Settings } from '@core/contexts/settingsContext';
import { cookies } from 'next/headers';
import { SystemMode } from '../types';

export const getSettingsFromCookie = async (): Promise<Settings> => {
    const cookieStore = await cookies()
    const cookieName = themeConfig.settingsCookieName
    return JSON.parse(cookieStore.get(cookieName)?.value || '{}')
}


export const getServerMode = async () => {
    const mode = getMode()
    const systemMode = getSystemMode()

    return (await mode) === 'system' ? systemMode : mode;
}


export const getSystemMode = async (): Promise<SystemMode> => {
    const cookieStore = await cookies()
    const mode = getMode()

    const colorPrefCookie = (cookieStore.get('colorPref')?.value || 'light') as SystemMode

    return ((await mode) === 'system' ? colorPrefCookie : (mode as unknown as SystemMode)) || 'light';
}


export const getMode = async () => {
    const settingsCookie = await getSettingsFromCookie()

    const _mode = settingsCookie.mode || themeConfig.mode

    return _mode
}
