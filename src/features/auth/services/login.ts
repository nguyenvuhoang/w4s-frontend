
import { getDeviceInfo } from '@/utils/getDeviceInfo';
import { getLocalizedUrl } from '@/utils/i18n';
import { ErrorType, FormData } from '@core/types';
import Cookies from 'js-cookie';

interface LoginServiceResult {
  success: boolean
  redirectUrl?: string
  verifyDevice?: {
    username: string
    deviceId: string
  }
  errorState?: ErrorType
}

export const handleLogin = async (
  data: FormData,
  locale: string,
  dictionary: Awaited<ReturnType<typeof import('@/utils/getDictionary').getDictionary>>,
): Promise<LoginServiceResult> => {


  try {

    const my_device = await getDeviceInfo()
    Cookies.set('my_device_info', JSON.stringify(my_device), {
      expires: 7,
      path: '/',
      sameSite: 'Lax',
    });

    const res = await fetch('/api/authenticate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: data.username,
        password: data.password,
        my_device: JSON.stringify(my_device),
        language: locale,
        realtoken: undefined,
        is_reset_device: false
      })
    });

    const authRes = await res.json();
    
    if (authRes && authRes.status === 299) {
      return {
        success: false,
        verifyDevice: {
          username: data.username,
          deviceId: my_device.device_id ?? ''
        },
        errorState: { message: [authRes.error || ''] }
      }
    }

    if (authRes && (authRes.error === null || authRes.error === '')) {
      return {
        success: true,
        redirectUrl: getLocalizedUrl(`/`, locale as any)
      }
    }

    return {
      success: false,
      errorState: { message: [dictionary['auth'].usernamepasswordincorrect] }
    }
  } catch (err) {
    console.error('[CTH_LOGIN] [ERROR]', err);
    return {
      success: false,
      errorState: { message: [dictionary['auth'].loginfailed] }
    }
  }
}
