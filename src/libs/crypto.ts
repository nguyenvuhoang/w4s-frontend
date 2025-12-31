/**
 * End-to-End Encryption Utilities
 * 
 * Cung cấp các hàm mã hóa/giải mã AES-256-GCM cho giao tiếp client-server.
 * Sử dụng Web Crypto API (browser) và Node Crypto API (server) để đảm bảo tương thích.
 * 
 * Luồng hoạt động:
 * 1. Client encrypt data với AES-256-GCM
 * 2. IV (Initialization Vector) được tạo ngẫu nhiên cho mỗi request
 * 3. Encrypted payload + IV được gửi lên server
 * 4. Server decrypt với cùng key và IV
 * 
 * @module libs/crypto
 */

// Encryption key - Trong production, nên lưu trong biến môi trường
const ENCRYPTION_KEY = process.env.NEXT_PUBLIC_ENCRYPTION_KEY || 'o24-api-manager-secure-key-32ch!';

// Sử dụng TextEncoder/TextDecoder cho cả browser và Node.js
const encoder = new TextEncoder();
const decoder = new TextDecoder();

/**
 * Chuyển đổi string thành ArrayBuffer (compatible với Web Crypto API)
 */
export function stringToBytes(str: string): ArrayBuffer {
  return encoder.encode(str).buffer as ArrayBuffer;
}

/**
 * Chuyển đổi ArrayBuffer/Uint8Array thành string
 */
export function bytesToString(bytes: Uint8Array | ArrayBuffer): string {
  return decoder.decode(bytes);
}

/**
 * Chuyển đổi ArrayBuffer/Uint8Array thành Base64 string
 */
export function arrayBufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Chuyển đổi Base64 string thành Uint8Array
 */
export function base64ToArrayBuffer(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Tạo CryptoKey từ encryption key string
 * Sử dụng PBKDF2 để derive key từ password
 */
async function getCryptoKey(keyString: string): Promise<CryptoKey> {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    stringToBytes(keyString),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  // Derive AES-GCM key từ key material
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: stringToBytes('o24-api-manager-salt'),
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Mã hóa data sử dụng AES-256-GCM
 * 
 * @param data - Data cần mã hóa (object hoặc string)
 * @param customKey - Optional custom encryption key
 * @returns Object chứa encrypted data (base64) và IV (base64)
 * 
 * @example
 * ```typescript
 * const { encryptedData, iv } = await encrypt({ username: 'test', password: 'secret' });
 * // Gửi encryptedData và iv lên server
 * ```
 */
export async function encrypt(
  data: unknown,
  customKey?: string
): Promise<{ encryptedData: string; iv: string; timestamp: number }> {
  const key = await getCryptoKey(customKey || ENCRYPTION_KEY);
  
  // Tạo random IV (12 bytes cho GCM)
  const iv = crypto.getRandomValues(new Uint8Array(12));
  
  // Convert data to JSON string nếu là object
  const plaintext = typeof data === 'string' ? data : JSON.stringify(data);
  
  // Mã hóa
  const encryptedBuffer = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv.buffer as ArrayBuffer },
    key,
    stringToBytes(plaintext)
  );

  return {
    encryptedData: arrayBufferToBase64(encryptedBuffer),
    iv: arrayBufferToBase64(iv.buffer as ArrayBuffer),
    timestamp: Date.now()
  };
}

/**
 * Giải mã data đã được mã hóa bằng AES-256-GCM
 * 
 * @param encryptedData - Encrypted data (base64)
 * @param iv - Initialization Vector (base64)
 * @param customKey - Optional custom encryption key
 * @returns Decrypted data (parsed as JSON if possible)
 * 
 * @example
 * ```typescript
 * const decrypted = await decrypt(encryptedData, iv);
 * // decrypted = { username: 'test', password: 'secret' }
 * ```
 */
export async function decrypt<T = unknown>(
  encryptedData: string,
  iv: string,
  customKey?: string
): Promise<T> {
  const key = await getCryptoKey(customKey || ENCRYPTION_KEY);
  
  const encryptedBuffer = base64ToArrayBuffer(encryptedData);
  const ivBuffer = base64ToArrayBuffer(iv);
  
  const decryptedBuffer = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: ivBuffer.buffer as ArrayBuffer },
    key,
    encryptedBuffer.buffer as ArrayBuffer
  );

  const plaintext = bytesToString(new Uint8Array(decryptedBuffer));
  
  // Cố gắng parse JSON, nếu không được thì trả về string
  try {
    return JSON.parse(plaintext) as T;
  } catch {
    return plaintext as unknown as T;
  }
}

/**
 * Tạo request body đã mã hóa cho client component
 * 
 * @param payload - Data cần gửi lên server
 * @returns Encrypted request body
 */
export async function createEncryptedPayload(payload: unknown): Promise<EncryptedPayload> {
  const { encryptedData, iv, timestamp } = await encrypt(payload);
  
  return {
    encrypted: true,
    data: encryptedData,
    iv,
    timestamp,
    algorithm: 'AES-256-GCM' as const
  };
}

/**
 * Giải mã request body từ client
 * 
 * @param encryptedPayload - Encrypted payload từ client
 * @returns Decrypted data
 */
export async function decryptPayload<T = unknown>(
  encryptedPayload: EncryptedPayload
): Promise<T> {
  // Validate payload
  if (!encryptedPayload.encrypted || !encryptedPayload.data || !encryptedPayload.iv) {
    throw new Error('Invalid encrypted payload');
  }

  // Kiểm tra timestamp để chống replay attack (5 phút timeout)
  const MAX_AGE = 5 * 60 * 1000; // 5 minutes
  if (encryptedPayload.timestamp && Date.now() - encryptedPayload.timestamp > MAX_AGE) {
    throw new Error('Request expired');
  }

  return decrypt<T>(encryptedPayload.data, encryptedPayload.iv);
}

/**
 * Type định nghĩa cho encrypted payload
 */
export interface EncryptedPayload {
  encrypted: boolean;
  data: string;      // Base64 encoded encrypted data
  iv: string;        // Base64 encoded IV
  timestamp: number; // Timestamp để chống replay attack
  algorithm: 'AES-256-GCM' | 'AES-256-CBC'; // Algorithm được sử dụng
  nonce?: string;    // Optional nonce for request unique identification
  signature?: string; // Optional HMAC signature
}

/**
 * Type guard để kiểm tra xem payload có phải encrypted payload không
 */
export function isEncryptedPayload(payload: unknown): payload is EncryptedPayload {
  return (
    typeof payload === 'object' &&
    payload !== null &&
    'encrypted' in payload &&
    (payload as EncryptedPayload).encrypted === true &&
    'data' in payload &&
    'iv' in payload
  );
}

/**
 * Hash data sử dụng SHA-256
 * Dùng để tạo checksum hoặc signature
 */
export async function hashSHA256(data: string): Promise<string> {
  const dataBuffer = stringToBytes(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  return arrayBufferToBase64(hashBuffer);
}

/**
 * Tạo HMAC signature cho data
 * Dùng để verify integrity của data
 */
export async function createHMAC(data: string, secret: string): Promise<string> {
  const secretBuffer = stringToBytes(secret);
  const key = await crypto.subtle.importKey(
    'raw',
    secretBuffer,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const dataBuffer = stringToBytes(data);
  const signature = await crypto.subtle.sign('HMAC', key, dataBuffer);
  return arrayBufferToBase64(signature);
}

/**
 * Verify HMAC signature
 */
export async function verifyHMAC(
  data: string,
  signature: string,
  secret: string
): Promise<boolean> {
  const secretBuffer = stringToBytes(secret);
  const key = await crypto.subtle.importKey(
    'raw',
    secretBuffer,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify']
  );

  const signatureBuffer = base64ToArrayBuffer(signature);
  const dataBuffer = stringToBytes(data);
  return crypto.subtle.verify('HMAC', key, signatureBuffer.buffer as ArrayBuffer, dataBuffer);
}

/**
 * Tạo random nonce string
 * Dùng cho các request cần unique identifier
 */
export function generateNonce(length: number = 16): string {
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return arrayBufferToBase64(bytes);
}
