import envConfig from '@/configs/config';
import { normalizePath } from '@/utils';
import { decrypt, isEncryptedPayload, createEncryptedPayload, generateNonce, createHMAC } from '@lib/crypto';

type CustomOptions = Omit<RequestInit, 'method'> & {
  baseUrl?: string | undefined;
  /** Có mã hóa request body không */
  encrypt?: boolean;
  /** Có giải mã response không */
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
    // Mã hóa request body nếu cần
    if (shouldEncrypt && typeof options.body === 'object') {
      const encryptedPayload = await createEncryptedPayload(options.body)
      encryptedPayload.nonce = generateNonce()
      // Tạo HMAC signature
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

  // Thêm encryption headers nếu cần
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

  // Nếu không truyền baseUrl (hoặc baseUrl = undefined) thì lấy từ envConfig.NEXT_PUBLIC_REST_API_ENDPOINT
  // Nếu truyền baseUrl thì lấy giá trị truyền vào, truyền vào '' thì đồng nghĩa với việc chúng ta gọi API đến Next.js Server

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

  // Giải mã response nếu cần
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

  // XỬ lý case Invalid Token
  if (!isClient()) {
    if (payload) {
      const dataresponse = (payload as any)?.dataresponse;

      if (dataresponse?.error?.[0]) {
        const errorcode = dataresponse.error[0].code;

        if (errorcode === '401') {
          try {
            await fetch(`/api/logout`, {
              method: 'POST',
              body: JSON.stringify({ 
                force: true, 
                reason: 'server_side_401' 
              }),
              headers: {
                'Content-Type': 'application/json'
              }
            });
          } catch (error) {
            console.log(`🟢 ==========Error Logout: ==> ${error}`);
          }
        }
      }
    }
  }


  const data = {
    status: res.status,
    payload: decryptedPayload
  }


  // Interceptor là nơi chúng ta xử lý request và response trước khi trả về cho phía component
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

        console.log(`🟢 ==========Status Code: ==> ${res.status}`)
        console.log(`🟢 ==========SesionToken: ==> ${sessionToken}`)

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

  // Đảm bảo logic dưới đây chỉ chạy ở phía client (browser)
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
