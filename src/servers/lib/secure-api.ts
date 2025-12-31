/**
 * Secure API Wrapper
 * 
 * HTTP client wrapper với tích hợp mã hóa end-to-end.
 * Tự động mã hóa request và giải mã response khi cần.
 * 
 * @module servers/lib/secure-api
 */

import { env } from '@/env.mjs';
import http from './http';
import {
  encrypt,
  decrypt,
  createEncryptedPayload,
  isEncryptedPayload,
  generateNonce,
  createHMAC,
  type EncryptedPayload
} from '@lib/crypto';
import type {
  SecureRequestConfig,
  SecureApiConfig
} from '@/types/encryption';

/**
 * Default configuration cho secure API
 */
const DEFAULT_CONFIG: SecureApiConfig = {
  baseUrl: process.env.NEXT_PUBLIC_API_URL || '',
  encryptAllRequests: false,
  timeout: 5 * 60 * 1000 // 5 minutes
};

/**
 * Custom options cho secure request
 */
interface SecureRequestOptions {
  /** Base URL override */
  baseUrl?: string;
  /** Custom headers */
  headers?: Record<string, string>;
  /** Có mã hóa request không */
  encrypt?: boolean;
  /** Có expect encrypted response không */
  expectEncryptedResponse?: boolean;
  /** Timeout (ms) */
  timeout?: number;
}

/**
 * Tạo encrypted request body với metadata
 */
async function createSecurePayload(
  data: unknown,
  includeSignature: boolean = false
): Promise<EncryptedPayload> {
  const payload = await createEncryptedPayload(data);
  payload.nonce = generateNonce();

  if (includeSignature) {
    // Tạo HMAC signature từ encrypted data
    const signatureData = `${payload.data}:${payload.iv}:${payload.timestamp}:${payload.nonce}`;
    payload.signature = await createHMAC(signatureData, process.env.NEXT_PUBLIC_HMAC_SECRET || 'o24-hmac-secret');
  }

  return payload;
}

/**
 * Giải mã response từ server nếu cần
 */
async function parseSecureResponse<T>(responseData: unknown): Promise<T> {
  if (isEncryptedPayload(responseData)) {
    return decrypt<T>(responseData.data, responseData.iv);
  }
  
  // Response không encrypted, trả về trực tiếp
  if (typeof responseData === 'object' && responseData !== null) {
    const data = responseData as Record<string, unknown>;
    return (data.dataresponse || data.data || data) as T;
  }
  
  return responseData as T;
}

/**
 * Secure POST request với mã hóa tự động
 * 
 * @param url - API endpoint
 * @param data - Data cần gửi (sẽ được mã hóa nếu options.encrypt = true)
 * @param sessiontoken - Session token cho authentication
 * @param options - Request options
 * 
 * @example
 * ```typescript
 * // Gửi request được mã hóa
 * const response = await securePost<ResponseType>(
 *   '/system-service',
 *   sensitiveData,
 *   token,
 *   { encrypt: true }
 * );
 * ```
 */
export async function securePost<T>(
  url: string,
  data: unknown,
  sessiontoken: string,
  options: SecureRequestOptions = {}
): Promise<{ status: number; payload: T }> {
  const {
    baseUrl = process.env.NEXT_PUBLIC_API_URL ?? '',
    headers: customHeaders = {},
    encrypt: shouldEncrypt = true,
    expectEncryptedResponse = false
  } = options;

  let requestBody: unknown = data;
  const headers: Record<string, string> = {
    uid: sessiontoken,
    app: env.NEXT_PUBLIC_APPLICATION_CODE ?? 'BO',
    ...customHeaders
  };

  // Mã hóa request nếu cần
  if (shouldEncrypt) {
    requestBody = await createSecurePayload(data, true);
    headers['X-Encrypted-Request'] = 'true';
    headers['X-Encryption-Algorithm'] = 'AES-256-GCM';
  }

  // Gọi API thông qua http wrapper
  const response = await http.post<T>(url, requestBody, {
    baseUrl,
    headers
  });

  // Giải mã response nếu cần
  let payload = response.payload;
  if (expectEncryptedResponse && isEncryptedPayload(payload)) {
    payload = await parseSecureResponse<T>(payload);
  }

  return {
    status: response.status,
    payload
  };
}

/**
 * Tạo secure request body theo chuẩn workflow của dự án
 * Kết hợp createDefaultBody với mã hóa
 * 
 * @param workflowid - Workflow ID
 * @param fields - Fields data (sẽ được mã hóa)
 * 
 * @example
 * ```typescript
 * const body = await createSecureBody('USER_LOGIN', {
 *   username: 'admin',
 *   password: 'secret123'
 * });
 * ```
 */
export async function createSecureBody(
  workflowid: string,
  fields: Record<string, unknown> = {},
  encryptFields: boolean = true
): Promise<{
  bo: Array<{
    use_microservice: boolean;
    input: {
      workflowid: string;
      learn_api: string;
      fields: EncryptedPayload | Record<string, unknown>;
      encrypted?: boolean;
    };
  }>;
}> {
  let processedFields: EncryptedPayload | Record<string, unknown> = fields;

  if (encryptFields && Object.keys(fields).length > 0) {
    processedFields = await createSecurePayload(fields, true);
  }

  return {
    bo: [{
      use_microservice: true,
      input: {
        workflowid,
        learn_api: 'cbs_workflow_execute',
        fields: processedFields,
        encrypted: encryptFields
      }
    }]
  };
}

/**
 * Secure API Post với workflow pattern
 * Wrapper cho apiPost với mã hóa tự động
 * 
 * @example
 * ```typescript
 * const response = await secureApiPost<ResponseType>(
 *   '/system-service',
 *   'USER_CREATE',
 *   { username: 'newuser', password: 'secret' },
 *   sessionToken,
 *   { lang: 'en' }
 * );
 * ```
 */
export async function secureApiPost<T>(
  url: string,
  workflowid: string,
  fields: Record<string, unknown>,
  sessiontoken: string,
  headerOverrides: Record<string, string> = {},
  encryptFields: boolean = true
): Promise<{ status: number; payload: T }> {
  const body = await createSecureBody(workflowid, fields, encryptFields);
  
  return securePost<T>(url, body, sessiontoken, {
    headers: headerOverrides,
    encrypt: false // Body đã được encrypt ở level fields
  });
}

/**
 * Utility function để mã hóa form data trước khi submit
 * 
 * @param formData - Form data object
 * @param sensitiveFields - List các field cần mã hóa
 * 
 * @example
 * ```typescript
 * const encryptedForm = await encryptFormData(
 *   { username: 'admin', password: 'secret', remember: true },
 *   ['password']
 * );
 * // Result: { username: 'admin', password: EncryptedPayload, remember: true }
 * ```
 */
export async function encryptFormData<T extends Record<string, unknown>>(
  formData: T,
  sensitiveFields: (keyof T)[]
): Promise<Record<string, unknown | EncryptedPayload>> {
  const result: Record<string, unknown | EncryptedPayload> = { ...formData };

  for (const field of sensitiveFields) {
    if (field in formData && formData[field] !== undefined) {
      result[field as string] = await createSecurePayload(formData[field], false);
    }
  }

  return result;
}

/**
 * Mã hóa toàn bộ object và trả về encrypted payload
 */
export async function encryptObject<T>(data: T): Promise<EncryptedPayload> {
  return createSecurePayload(data, true);
}

/**
 * Giải mã encrypted payload
 */
export async function decryptObject<T>(payload: EncryptedPayload): Promise<T> {
  return decrypt<T>(payload.data, payload.iv);
}

/**
 * Export các utility functions từ crypto module
 */
export {
  encrypt,
  decrypt,
  isEncryptedPayload,
  generateNonce
};
