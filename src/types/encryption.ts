/**
 * Encryption Types
 * 
 * Định nghĩa các types cho hệ thống mã hóa end-to-end.
 * 
 * @module types/encryption
 */

/**
 * Payload đã được mã hóa gửi từ client lên server
 */
export interface EncryptedPayload {
  /** Flag đánh dấu payload đã được mã hóa */
  encrypted: boolean;
  /** Dữ liệu đã mã hóa (Base64 encoded) */
  data: string;
  /** Initialization Vector (Base64 encoded) */
  iv: string;
  /** Timestamp tạo request (ms) - dùng để chống replay attack */
  timestamp: number;
  /** Algorithm sử dụng để mã hóa */
  algorithm: 'AES-256-GCM' | 'AES-256-CBC';
  /** Optional nonce cho request unique identification */
  nonce?: string;
  /** Optional HMAC signature để verify integrity */
  signature?: string;
}

/**
 * Response đã được mã hóa từ server về client
 */
export interface EncryptedResponse<T = unknown> {
  /** Flag đánh dấu response đã được mã hóa */
  encrypted: boolean;
  /** Dữ liệu đã mã hóa (Base64 encoded) */
  data: string;
  /** Initialization Vector (Base64 encoded) */
  iv: string;
  /** Original data type (sau khi giải mã sẽ parse về type này) */
  _type?: T;
}

/**
 * Options cho hàm encrypt
 */
export interface EncryptOptions {
  /** Custom encryption key (nếu không dùng default) */
  customKey?: string;
  /** Có tạo HMAC signature không */
  includeSignature?: boolean;
  /** Secret cho HMAC (nếu khác với encryption key) */
  hmacSecret?: string;
}

/**
 * Options cho hàm decrypt
 */
export interface DecryptOptions {
  /** Custom encryption key */
  customKey?: string;
  /** Verify HMAC signature nếu có */
  verifySignature?: boolean;
  /** Secret cho HMAC verification */
  hmacSecret?: string;
}

/**
 * Kết quả của quá trình giải mã
 */
export interface DecryptResult<T = unknown> {
  /** Dữ liệu đã giải mã */
  data: T;
  /** Signature có hợp lệ không (nếu có verify) */
  signatureValid?: boolean;
  /** Timestamp của request (nếu có) */
  timestamp?: number;
}

/**
 * Cấu hình mã hóa cho API request
 */
export interface SecureRequestConfig {
  /** Có mã hóa request body không */
  encryptRequest?: boolean;
  /** Có mã hóa response không */
  encryptResponse?: boolean;
  /** Timeout cho encrypted request (ms) - default 5 phút */
  timeout?: number;
  /** Custom headers cho encrypted request */
  headers?: Record<string, string>;
}

/**
 * State cho useEncryptedRequest hook
 */
export interface EncryptedRequestState<T = unknown> {
  /** Đang loading */
  isLoading: boolean;
  /** Data đã giải mã từ response */
  data: T | null;
  /** Error nếu có */
  error: Error | null;
  /** Response status */
  status: number | null;
}

/**
 * Return type cho useEncryptedRequest hook
 */
export interface UseEncryptedRequestReturn<TRequest, TResponse> {
  /** State hiện tại */
  state: EncryptedRequestState<TResponse>;
  /** Function để submit encrypted request */
  submit: (data: TRequest) => Promise<TResponse | null>;
  /** Reset state */
  reset: () => void;
  /** Check xem đang loading không */
  isLoading: boolean;
  /** Data từ response */
  data: TResponse | null;
  /** Error nếu có */
  error: Error | null;
}

/**
 * Configuration cho secure API client
 */
export interface SecureApiConfig {
  /** Base URL cho API */
  baseUrl: string;
  /** Default headers */
  headers?: Record<string, string>;
  /** Có mã hóa tất cả requests không */
  encryptAllRequests?: boolean;
  /** Timeout (ms) */
  timeout?: number;
}

/**
 * Encrypted form data type
 */
export interface EncryptedFormData {
  /** Fields đã mã hóa */
  encryptedFields: EncryptedPayload;
  /** Fields không cần mã hóa (như csrf token) */
  plainFields?: Record<string, string>;
}

/**
 * Key exchange payload cho public key cryptography (optional - cho advanced use case)
 */
export interface KeyExchangePayload {
  /** Public key (Base64 encoded) */
  publicKey: string;
  /** Algorithm sử dụng */
  algorithm: 'RSA-OAEP' | 'ECDH';
  /** Key size (bits) */
  keySize: number;
  /** Expiration timestamp */
  expiresAt: number;
}

/**
 * Server response wrapper cho encrypted responses
 */
export interface SecureApiResponse<T = unknown> {
  /** Success flag */
  success: boolean;
  /** Response data (encrypted hoặc plain) */
  payload: EncryptedResponse<T> | T;
  /** Error message nếu có */
  error?: string;
  /** Request ID cho tracking */
  requestId?: string;
}

/**
 * Sensitive fields configuration
 * Định nghĩa các field cần mã hóa trong form
 */
export interface SensitiveFieldsConfig {
  /** Field names cần mã hóa */
  fields: string[];
  /** Có mã hóa toàn bộ payload không (thay vì từng field) */
  encryptEntirePayload?: boolean;
}

/**
 * Request metadata được gửi kèm encrypted request
 */
export interface EncryptedRequestMetadata {
  /** Request ID unique */
  requestId: string;
  /** Client timestamp */
  timestamp: number;
  /** Client timezone */
  timezone: string;
  /** Session fingerprint */
  fingerprint?: string;
}
