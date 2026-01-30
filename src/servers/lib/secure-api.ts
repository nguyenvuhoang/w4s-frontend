/**
 * Secure API Wrapper
 * 
 * HTTP client wrapper vá»›i tÃ­ch há»£p mÃ£ hÃ³a end-to-end.
 * Tá»± Ä‘á»™ng mÃ£ hÃ³a request vÃ  giáº£i mÃ£ response khi cáº§n.
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
} from '@shared/types/encryption';

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
  /** CÃ³ mÃ£ hÃ³a request khÃ´ng */
  encrypt?: boolean;
  /** CÃ³ expect encrypted response khÃ´ng */
  expectEncryptedResponse?: boolean;
  /** Timeout (ms) */
  timeout?: number;
}

/**
 * Táº¡o encrypted request body vá»›i metadata
 */
async function createSecurePayload(
  data: unknown,
  includeSignature: boolean = false
): Promise<EncryptedPayload> {
  const payload = await createEncryptedPayload(data);
  payload.nonce = generateNonce();

  if (includeSignature) {
    // Táº¡o HMAC signature tá»« encrypted data
    const signatureData = `${payload.data}:${payload.iv}:${payload.timestamp}:${payload.nonce}`;
    payload.signature = await createHMAC(signatureData, process.env.NEXT_PUBLIC_HMAC_SECRET || 'o24-hmac-secret');
  }

  return payload;
}

/**
 * Giáº£i mÃ£ response tá»« server náº¿u cáº§n
 */
async function parseSecureResponse<T>(responseData: unknown): Promise<T> {
  if (isEncryptedPayload(responseData)) {
    return decrypt<T>(responseData.data, responseData.iv);
  }

  // Response khÃ´ng encrypted, tráº£ vá» trá»±c tiáº¿p
  if (typeof responseData === 'object' && responseData !== null) {
    const data = responseData as Record<string, unknown>;
    return (data.dataresponse || data.data || data) as T;
  }

  return responseData as T;
}

/**
 * Secure POST request vá»›i mÃ£ hÃ³a tá»± Ä‘á»™ng
 * 
 * @param url - API endpoint
 * @param data - Data cáº§n gá»­i (sáº½ Ä‘Æ°á»£c mÃ£ hÃ³a náº¿u options.encrypt = true)
 * @param sessiontoken - Session token cho authentication
 * @param options - Request options
 * 
 * @example
 * ```typescript
 * // Gá»­i request Ä‘Æ°á»£c mÃ£ hÃ³a
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

  // MÃ£ hÃ³a request náº¿u cáº§n
  if (shouldEncrypt) {
    requestBody = await createSecurePayload(data, true);
    headers['X-Encrypted-Request'] = 'true';
    headers['X-Encryption-Algorithm'] = 'AES-256-GCM';
  }

  // Gá»i API thÃ´ng qua http wrapper
  const response = await http.post<T>(url, requestBody, {
    baseUrl,
    headers
  });

  // Giáº£i mÃ£ response náº¿u cáº§n
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
 * Táº¡o secure request body theo chuáº©n workflow cá»§a dá»± Ã¡n
 * Káº¿t há»£p createDefaultBody vá»›i mÃ£ hÃ³a
 * 
 * @param workflowid - Workflow ID
 * @param fields - Fields data (sáº½ Ä‘Æ°á»£c mÃ£ hÃ³a)
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
 * Secure API Post vá»›i workflow pattern
 * Wrapper cho apiPost vá»›i mÃ£ hÃ³a tá»± Ä‘á»™ng
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
    encrypt: false // Body Ä‘Ã£ Ä‘Æ°á»£c encrypt á»Ÿ level fields
  });
}

/**
 * Utility function Ä‘á»ƒ mÃ£ hÃ³a form data trÆ°á»›c khi submit
 * 
 * @param formData - Form data object
 * @param sensitiveFields - List cÃ¡c field cáº§n mÃ£ hÃ³a
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
 * MÃ£ hÃ³a toÃ n bá»™ object vÃ  tráº£ vá» encrypted payload
 */
export async function encryptObject<T>(data: T): Promise<EncryptedPayload> {
  return createSecurePayload(data, true);
}

/**
 * Giáº£i mÃ£ encrypted payload
 */
export async function decryptObject<T>(payload: EncryptedPayload): Promise<T> {
  return decrypt<T>(payload.data, payload.iv);
}

/**
 * Export cÃ¡c utility functions tá»« crypto module
 */
export {
  encrypt,
  decrypt,
  isEncryptedPayload,
  generateNonce
};

