import { env } from "@/env.mjs";
import http from "./http";
import {
  createEncryptedPayload,
  generateNonce,
  createHMAC,
  type EncryptedPayload
} from '@lib/crypto';


interface CustomOptions {
  baseUrl?: string;
  headers?: Record<string, string>;
  /** Có mã hóa request không */
  encrypt?: boolean;
}



const getDefaultHeaders = (sessiontoken: string, overrides: Record<string, string> = {}): Omit<CustomOptions, 'body'> => {
  const headers: Record<string, string> = {
    uid: `${sessiontoken}`,
    app: env.NEXT_PUBLIC_APPLICATION_CODE ?? 'BO',
    ...overrides
  };

  return {
    baseUrl: process.env.NEXT_PUBLIC_API_URL ?? '',
    headers
  };
};

export const createDefaultBody = (
  workflowid: string,
  fields: Record<string, any>,
) => ({
  workflowid,
  fields
});

/**
 * Tạo secure body với mã hóa fields
 */
export const createSecureBody = async (
  workflowid: string,
  fields: Record<string, any>,
  use_microservice: boolean = true,
): Promise<{
  bo: Array<{
    use_microservice: boolean;
    input: {
      workflowid: string;
      learn_api: string;
      fields: EncryptedPayload;
      encrypted: boolean;
    };
  }>;
}> => {
  const encryptedPayload = await createEncryptedPayload(fields);
  encryptedPayload.nonce = generateNonce();
  const signatureData = `${encryptedPayload.data}:${encryptedPayload.iv}:${encryptedPayload.timestamp}:${encryptedPayload.nonce}`;
  encryptedPayload.signature = await createHMAC(signatureData, process.env.NEXT_PUBLIC_HMAC_SECRET || 'o24-hmac-secret');

  return {
    bo: [{
      use_microservice,
      input: {
        workflowid,
        learn_api: "cbs_workflow_execute",
        fields: encryptedPayload,
        encrypted: true
      }
    }]
  };
};

export const apiPost = <T>(
  url: string,
  data: any,
  sessiontoken: string,
  headerOverrides: Record<string, string> = {},
  options: { encrypt?: boolean } = {}
) => http.post<T>(url, data, { ...getDefaultHeaders(sessiontoken, headerOverrides), encrypt: options.encrypt });

/**
 * Secure API Post với mã hóa tự động
 * 
 * @example
 * ```typescript
 * const response = await secureApiPost<ResponseType>(
 *   '/system-service',
 *   'WORKFLOW_ID',
 *   { field1: 'value1' },
 *   sessionToken,
 *   { lang: 'en' }
 * );
 * ```
 */
export const secureApiPost = async <T>(
  url: string,
  workflowid: string,
  fields: Record<string, any>,
  sessiontoken: string,
  headerOverrides: Record<string, string> = {}
): Promise<{ status: number; payload: T }> => {
  const body = await createSecureBody(workflowid, fields);

  const headers: Record<string, string> = {
    uid: `${sessiontoken}`,
    app: env.NEXT_PUBLIC_APPLICATION_CODE ?? 'BO',
    'X-Encrypted-Request': 'true',
    'X-Encryption-Algorithm': 'AES-256-GCM',
    ...headerOverrides
  };

  return http.post<T>(url, body, {
    baseUrl: process.env.NEXT_PUBLIC_API_URL ?? '',
    headers
  });
};


export const apiPostForm = async <T>(
  formData: FormData,
  sessiontoken: string,
  headerOverrides: Record<string, string> = {},
  folderUpload?: string
): Promise<{ status: number; data: T }> => {
  const headers: HeadersInit = {
    uid: `${sessiontoken}`,
    app: env.NEXT_PUBLIC_APPLICATION_CODE ?? 'BO',
    ...headerOverrides
  };

  let url = `${env.NEXT_PUBLIC_REST_API_CDN_ENDPOINT}`;
  if (folderUpload) {
    url += `?folder=${folderUpload}`;
  }
  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: formData
  });

  const data = await res.json();

  if (!res.ok && res.status !== 409) {
    throw new Error(`Upload failed (${res.status}): ${JSON.stringify(data)}`);
  }

  return {
    status: res.status,
    data
  };
};
