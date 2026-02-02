import envConfig from '@/configs/config';
import { normalizePath } from '@utils';
import { decrypt, isEncryptedPayload, createEncryptedPayload, generateNonce, createHMAC } from '@lib/crypto';

type CustomOptions = Omit<RequestInit, 'method'> & {
  baseUrl?: string | undefined;
  /** CÃ³ mÃ£ hÃ³a request body khÃ´ng */
  encrypt?: boolean;
  /** CÃ³ giáº£i mÃ£ response khÃ´ng */
  decryptResponse?: boolean;
}

export const ENTITY_ERROR_STATUS = 422
export const AUTHENTICATION_ERROR_STATUS = 401
export const VERIFY_ERROR_STATUS = 501
export const BAD_REQUEST = 400
export const NOTFOUND = 404
export const FORBIDDEN = 403
export const INTERNAL_SERVER_ERROR = 500
export const TOO_MANY_REQUESTS = 429
export const SERVICE_UNAVAILABLE = 503
export const GATEWAY_TIMEOUT = 504

type EntityErrorPayload = {
  message: string
  errors: {
    field: string
    message: string
  }[]
}

export class HttpError extends Error {
  status: number
  payload: {
    message: string
    [key: string]: any
  }
  constructor({ status, payload }: { status: number; payload: any }) {
    super('Http Error')
    this.status = status
    this.payload = payload
  }
}

export class EntityError extends HttpError {
  status: 422 | 501 | 500 | 403 | 404
  payload: EntityErrorPayload
  constructor({
    status,
    payload
  }: {
    status: 422 | 501 | 500 | 403 | 404
    payload: EntityErrorPayload
  }) {
    super({ status, payload })
    this.status = status
    this.payload = payload
  }
}

let clientLogoutRequest: null | Promise<any> = null

export const isClient = () => typeof window !== 'undefined'

const request = async <Response>(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  url: string,
  options?: CustomOptions | undefined
) => {
  let body: FormData | string | undefined = undefined
  const shouldEncrypt = options?.encrypt ?? false
  const shouldDecryptResponse = options?.decryptResponse ?? false

  if (options?.body instanceof FormData) {
    body = options.body
  } else if (options?.body) {
    // MÃ£ hÃ³a request body náº¿u cáº§n
    if (shouldEncrypt && typeof options.body === 'object') {
      const encryptedPayload = await createEncryptedPayload(options.body)
      encryptedPayload.nonce = generateNonce()
      // Táº¡o HMAC signature
      const signatureData = `${encryptedPayload.data}:${encryptedPayload.iv}:${encryptedPayload.timestamp}:${encryptedPayload.nonce}`
      encryptedPayload.signature = await createHMAC(signatureData, process.env.NEXT_PUBLIC_HMAC_SECRET || 'o24-hmac-secret')
      body = JSON.stringify(encryptedPayload)
    } else {
      body = JSON.stringify(options.body)
    }
  }

  const baseHeaders: {
    [key: string]: string
  } =
    body instanceof FormData
      ? {}
      : {
        'Content-Type': 'application/json'
      }

  // ThÃªm encryption headers náº¿u cáº§n
  if (shouldEncrypt) {
    baseHeaders['X-Encrypted-Request'] = 'true'
    baseHeaders['X-Encryption-Algorithm'] = 'AES-256-GCM'
  }

  if (isClient()) {
    const sessionToken = localStorage.getItem('token')

    if (sessionToken) {
      baseHeaders.Authorization = `Bearer ${sessionToken}`
    }
  }

  // Náº¿u khÃ´ng truyá»n baseUrl (hoáº·c baseUrl = undefined) thÃ¬ láº¥y tá»« envConfig.NEXT_PUBLIC_REST_API_ENDPOINT
  // Náº¿u truyá»n baseUrl thÃ¬ láº¥y giÃ¡ trá»‹ truyá»n vÃ o, truyá»n vÃ o '' thÃ¬ Ä‘á»“ng nghÄ©a vá»›i viá»‡c chÃºng ta gá»i API Ä‘áº¿n Next.js Server

  const baseUrl =
    options?.baseUrl === undefined
      ? envConfig.NEXT_PUBLIC_REST_API_ENDPOINT
      : options.baseUrl

  const fullUrl = url.startsWith('/') ? `${baseUrl}${url}` : `${baseUrl}/${url}`

  const res = await fetch(fullUrl, {
    ...options,
    headers: {
      ...baseHeaders,
      ...options?.headers
    } as any,
    body,
    method
  })

  const payload: Response = await res.json()

  // Giáº£i mÃ£ response náº¿u cáº§n
  let decryptedPayload = payload
  if (shouldDecryptResponse && typeof payload === 'object' && payload !== null) {
    if (isEncryptedPayload(payload)) {
      try {
        decryptedPayload = await decrypt<Response>((payload as any).data, (payload as any).iv)
      } catch (e) {
        console.error('Failed to decrypt response:', e)
      }
    }
  }

  // Check for requireLogout flag in response body (from API route)
  if ((payload as any)?.requireLogout === true) {
    console.log('ðŸ” requireLogout detected in response, treating as 401')
    if (isClient()) {
      if (!clientLogoutRequest) {
        localStorage.removeItem('token');
        localStorage.removeItem('refresh_token');
        
        clientLogoutRequest = fetch(`/api/logout`, {
          method: 'POST',
          body: JSON.stringify({ 
            force: true, 
            reason: 'require_logout_flag' 
          }),
          headers: {
            'Content-Type': 'application/json'
          }
        })

        try {
          await clientLogoutRequest
        } catch (error) {
          console.error('Logout request failed:', error);
        } finally {
          clientLogoutRequest = null
          const currentPath = window.location.pathname;
          if (!currentPath.includes('/login') && !currentPath.includes('/logout')) {
            const localeMatch = currentPath.match(/^\/([a-z]{2})/);
            const locale = localeMatch ? localeMatch[1] : 'en';
            location.href = `/${locale}/login`
          }
        }
      }
    }
    // Return data with 401 status for server-side handling
    return {
      status: 401,
      payload: decryptedPayload
    }
  }

  // Xá»¬ lÃ½ case Invalid Token (legacy check)
  if (!isClient()) {
    if (payload) {
      const dataresponse = (payload as any)?.dataresponse;

      if (dataresponse?.error?.[0] || dataresponse?.errors?.[0]) {
        const error = dataresponse.error?.[0] || dataresponse.errors?.[0];
        const errorcode = error?.code;
        const errorinfo = error?.info?.toLowerCase() || '';

        // Check for 401 or token-related errors
        const isTokenError = 
          errorcode === '401' || 
          errorinfo.includes('invalid.token') ||
          errorinfo.includes('invalid token') ||
          errorinfo.includes('token expired') ||
          errorinfo.includes('unauthorized');

        if (isTokenError) {
          try {
            await fetch(`/api/logout`, {
              method: 'POST',
              body: JSON.stringify({ 
                force: true, 
                reason: 'server_side_token_error' 
              }),
              headers: {
                'Content-Type': 'application/json'
              }
            });
          } catch (error) {
            console.log(`ðŸŸ¢ ==========Error Logout: ==> ${error}`);
          }
          
          // Return with requireLogout flag
          return {
            status: 401,
            payload: { ...decryptedPayload, requireLogout: true }
          }
        }
      }
    }
  }


  const data = {
    status: res.status,
    payload: decryptedPayload
  }


  // Interceptor lÃ  nÆ¡i chÃºng ta xá»­ lÃ½ request vÃ  response trÆ°á»›c khi tráº£ vá» cho phÃ­a component
  if (!res.ok) {
    if (res.status === ENTITY_ERROR_STATUS) {
      throw new EntityError(
        data as {
          status: 422
          payload: EntityErrorPayload
        }
      )
    } else if (res.status === AUTHENTICATION_ERROR_STATUS) {

      if (isClient()) {
        if (!clientLogoutRequest) {
          // Clear local storage immediately
          localStorage.removeItem('token');
          localStorage.removeItem('refresh_token');
          
          clientLogoutRequest = fetch(`/api/logout`, {
            method: 'POST',
            body: JSON.stringify({ 
              force: true, 
              reason: 'authentication_error' 
            }),
            headers: {
              'Content-Type': 'application/json'
            }
          })

          try {
            await clientLogoutRequest
          } catch (error) {
            console.error('Logout request failed:', error);
          } finally {
            clientLogoutRequest = null
            // Redirect to locale-specific login page
            const currentPath = window.location.pathname;
            if (!currentPath.includes('/login') && !currentPath.includes('/logout')) {
              // Extract locale from current path or default to 'en'
              const localeMatch = currentPath.match(/^\/([a-z]{2})/);
              const locale = localeMatch ? localeMatch[1] : 'en';
              location.href = `/${locale}/login`
            }
          }
        }
      } else {

        const sessionToken = (options?.headers as any)?.Authorization.split(
          'Bearer '
        )[1]

        console.log(`ðŸŸ¢ ==========Status Code: ==> ${res.status}`)
        console.log(`ðŸŸ¢ ==========SesionToken: ==> ${sessionToken}`)

        //
      }
    } else if (
      res.status === VERIFY_ERROR_STATUS ||
      res.status === BAD_REQUEST ||
      res.status === NOTFOUND ||
      res.status === FORBIDDEN ||
      res.status === INTERNAL_SERVER_ERROR ||
      res.status === TOO_MANY_REQUESTS ||
      res.status === SERVICE_UNAVAILABLE ||
      res.status === GATEWAY_TIMEOUT
    ) {
      return data
    } else {
      throw new HttpError(data)
    }
  }

  // Äáº£m báº£o logic dÆ°á»›i Ä‘Ã¢y chá»‰ cháº¡y á»Ÿ phÃ­a client (browser)
  if (isClient()) {
    if (
      ['login', 'register'].some(
        (item) => item === normalizePath(url)
      )
    ) {

      localStorage.setItem('token', 'token')
    } else if ('logout' === normalizePath(url)) {
      localStorage.removeItem('token')
    }
  }

  return data

}

const http = {
  get<Response>(
    url: string,
    options?: Omit<CustomOptions, 'body'> | undefined
  ) {
    return request<Response>('GET', url, options)
  },
  post<Response>(
    url: string,
    body: any,
    options?: Omit<CustomOptions, 'body'> | undefined
  ) {
    return request<Response>('POST', url, { ...options, body })
  },
  put<Response>(
    url: string,
    body: any,
    options?: Omit<CustomOptions, 'body'> | undefined
  ) {
    return request<Response>('PUT', url, { ...options, body })
  },
  delete<Response>(
    url: string,
    options?: Omit<CustomOptions, 'body'> | undefined
  ) {
    return request<Response>('DELETE', url, { ...options })
  }
}

export default http

