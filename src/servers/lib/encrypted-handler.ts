/**
 * Encrypted Request Handler
 * 
 * Middleware utilities cho Next.js API routes để xử lý encrypted requests.
 * Giải mã request body và cung cấp helpers cho encrypted responses.
 * 
 * @module servers/lib/encrypted-handler
 */

import { NextResponse } from 'next/server';
import logger from '@lib/logger';
import {
  decrypt,
  encrypt,
  isEncryptedPayload,
  verifyHMAC,
  type EncryptedPayload
} from '@lib/crypto';

/**
 * Request handler function type
 */
type RequestHandler<T = unknown> = (
  decryptedData: T,
  req: Request,
  context?: Record<string, unknown>
) => Promise<NextResponse>;

/**
 * Options cho encrypted handler
 */
interface EncryptedHandlerOptions {
  /** Có verify HMAC signature không */
  verifySignature?: boolean;
  /** Timeout cho request (ms) - default 5 phút */
  maxAge?: number;
  /** Có mã hóa response không */
  encryptResponse?: boolean;
  /** HMAC secret (nếu khác default) */
  hmacSecret?: string;
}

/**
 * Kết quả giải mã request
 */
interface DecryptedRequest<T = unknown> {
  success: boolean;
  data: T | null;
  error?: string;
  isEncrypted: boolean;
}

/**
 * Giải mã request body từ encrypted payload
 * 
 * @param req - Request object
 * @param options - Decrypt options
 * @returns Decrypted data hoặc error
 * 
 * @example
 * ```typescript
 * export async function POST(req: Request) {
 *   const { success, data, error } = await decryptRequestBody<MyDataType>(req);
 *   
 *   if (!success) {
 *     return NextResponse.json({ error }, { status: 400 });
 *   }
 *   
 *   // Xử lý data đã giải mã
 * }
 * ```
 */
export async function decryptRequestBody<T = unknown>(
  req: Request,
  options: EncryptedHandlerOptions = {}
): Promise<DecryptedRequest<T>> {
  const {
    verifySignature = true,
    maxAge = 5 * 60 * 1000, // 5 minutes
    hmacSecret = process.env.NEXT_PUBLIC_HMAC_SECRET || 'o24-hmac-secret'
  } = options;

  try {
    const body = await req.json();

    // Kiểm tra xem request có được mã hóa không
    const isEncrypted = req.headers.get('X-Encrypted-Request') === 'true' || 
                        isEncryptedPayload(body);

    if (!isEncrypted) {
      // Request không được mã hóa, trả về trực tiếp
      return {
        success: true,
        data: body as T,
        isEncrypted: false
      };
    }

    // Validate encrypted payload
    if (!body.data || !body.iv) {
      return {
        success: false,
        data: null,
        error: 'Invalid encrypted payload: missing data or iv',
        isEncrypted: true
      };
    }

    const encryptedPayload = body as EncryptedPayload;

    // Kiểm tra timestamp để chống replay attack
    if (encryptedPayload.timestamp) {
      const age = Date.now() - encryptedPayload.timestamp;
      if (age > maxAge) {
        logger.warn(`Request expired: age=${age}ms, maxAge=${maxAge}ms`);
        return {
          success: false,
          data: null,
          error: 'Request expired',
          isEncrypted: true
        };
      }
    }

    // Verify HMAC signature nếu có
    if (verifySignature && encryptedPayload.signature) {
      const signatureData = `${encryptedPayload.data}:${encryptedPayload.iv}:${encryptedPayload.timestamp}:${encryptedPayload.nonce}`;
      const isValid = await verifyHMAC(signatureData, encryptedPayload.signature, hmacSecret);
      
      if (!isValid) {
        logger.warn('Invalid HMAC signature');
        return {
          success: false,
          data: null,
          error: 'Invalid signature',
          isEncrypted: true
        };
      }
    }

    // Giải mã data
    const decryptedData = await decrypt<T>(encryptedPayload.data, encryptedPayload.iv);

    logger.info('Successfully decrypted request body');

    return {
      success: true,
      data: decryptedData,
      isEncrypted: true
    };
  } catch (error) {
    logger.error('Failed to decrypt request body:', error);
    return {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : 'Decryption failed',
      isEncrypted: true
    };
  }
}

/**
 * Tạo encrypted response
 * 
 * @param data - Data cần mã hóa và trả về
 * @param status - HTTP status code
 * @returns NextResponse với encrypted data
 */
export async function createEncryptedResponse<T>(
  data: T,
  status: number = 200
): Promise<NextResponse> {
  try {
    const { encryptedData, iv, timestamp } = await encrypt(data);

    return NextResponse.json(
      {
        encrypted: true,
        data: encryptedData,
        iv,
        timestamp,
        algorithm: 'AES-256-GCM'
      },
      {
        status,
        headers: {
          'X-Encrypted-Response': 'true',
          'X-Encryption-Algorithm': 'AES-256-GCM'
        }
      }
    );
  } catch (error) {
    logger.error('Failed to encrypt response:', error);
    return NextResponse.json(
      { error: 'Failed to encrypt response' },
      { status: 500 }
    );
  }
}

/**
 * Higher-order function để wrap API route handler với decryption
 * 
 * @param handler - Request handler function
 * @param options - Handler options
 * @returns Wrapped handler với auto-decryption
 * 
 * @example
 * ```typescript
 * // src/app/api/secure-endpoint/route.ts
 * export const POST = withEncryptedRequest<MyDataType>(
 *   async (decryptedData, req) => {
 *     // decryptedData đã được giải mã tự động
 *     console.log(decryptedData.username);
 *     
 *     return NextResponse.json({ success: true });
 *   },
 *   { verifySignature: true, encryptResponse: true }
 * );
 * ```
 */
export function withEncryptedRequest<T = unknown>(
  handler: RequestHandler<T>,
  options: EncryptedHandlerOptions = {}
): (req: Request, context?: Record<string, unknown>) => Promise<NextResponse> {
  const { encryptResponse = false } = options;

  return async (req: Request, context?: Record<string, unknown>): Promise<NextResponse> => {
    // Giải mã request
    const { success, data, error, isEncrypted } = await decryptRequestBody<T>(req, options);

    if (!success) {
      logger.warn(`Decryption failed: ${error}`);
      return NextResponse.json(
        { 
          success: false,
          error: error || 'Failed to decrypt request' 
        },
        { status: 400 }
      );
    }

    try {
      // Gọi handler với data đã giải mã
      const response = await handler(data as T, req, context);

      // Mã hóa response nếu cần
      if (encryptResponse && isEncrypted) {
        const responseBody = await response.json();
        return createEncryptedResponse(responseBody, response.status);
      }

      return response;
    } catch (error) {
      logger.error('Handler error:', error);
      return NextResponse.json(
        { 
          success: false,
          error: error instanceof Error ? error.message : 'Internal server error' 
        },
        { status: 500 }
      );
    }
  };
}

/**
 * Middleware function để parse và decrypt workflow request body
 * Xử lý cả encrypted fields trong bo[].input.fields
 */
export async function decryptWorkflowRequest<T = unknown>(
  req: Request
): Promise<{
  success: boolean;
  workflowId: string | null;
  fields: T | null;
  originalBody: unknown;
  error?: string;
}> {
  try {
    const body = await req.json();

    // Kiểm tra cấu trúc workflow request
    if (!body.bo || !Array.isArray(body.bo) || body.bo.length === 0) {
      return {
        success: true,
        workflowId: null,
        fields: body as T,
        originalBody: body
      };
    }

    const boItem = body.bo[0];
    const input = boItem.input || {};
    const workflowId = input.workflowid || null;
    let fields = input.fields || {};

    // Kiểm tra xem fields có được mã hóa không
    if (input.encrypted && isEncryptedPayload(fields)) {
      fields = await decrypt<T>(fields.data, fields.iv);
    }

    return {
      success: true,
      workflowId,
      fields: fields as T,
      originalBody: body
    };
  } catch (error) {
    logger.error('Failed to parse workflow request:', error);
    return {
      success: false,
      workflowId: null,
      fields: null,
      originalBody: null,
      error: error instanceof Error ? error.message : 'Parse failed'
    };
  }
}

/**
 * Utility function để log encrypted request (ẩn sensitive data)
 */
export function logEncryptedRequest(
  payload: EncryptedPayload,
  prefix: string = 'Encrypted Request'
): void {
  logger.info(`${prefix}:`, {
    encrypted: payload.encrypted,
    algorithm: payload.algorithm,
    timestamp: payload.timestamp,
    nonce: payload.nonce,
    hasSignature: !!payload.signature,
    dataLength: payload.data?.length || 0,
    ivLength: payload.iv?.length || 0
  });
}
