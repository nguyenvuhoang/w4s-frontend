'use client';

import { useState, useCallback } from 'react';
import { createEncryptedPayload, generateNonce, type EncryptedPayload } from '@lib/crypto';
import type {
  EncryptedRequestState,
  UseEncryptedRequestReturn,
  SecureRequestConfig
} from '@/types/encryption';

/**
 * Hook để gửi request đã được mã hóa từ client component lên server API
 * 
 * Tự động mã hóa request body trước khi gửi và giải mã response nếu cần.
 * 
 * @template TRequest - Type của request data
 * @template TResponse - Type của response data
 * 
 * @param url - API endpoint URL
 * @param config - Configuration options
 * 
 * @example
 * ```tsx
 * // Trong client component
 * const { submit, data, isLoading, error } = useEncryptedRequest<LoginRequest, LoginResponse>(
 *   '/api/auth/login',
 *   { encryptRequest: true }
 * );
 * 
 * const handleLogin = async (formData: LoginRequest) => {
 *   const response = await submit(formData);
 *   if (response) {
 *     // Xử lý response
 *   }
 * };
 * ```
 */
export function useEncryptedRequest<TRequest = unknown, TResponse = unknown>(
  url: string,
  config: SecureRequestConfig = {}
): UseEncryptedRequestReturn<TRequest, TResponse> {
  const {
    encryptRequest = true,
    timeout = 5 * 60 * 1000, // 5 minutes
    headers: customHeaders = {}
  } = config;

  const [state, setState] = useState<EncryptedRequestState<TResponse>>({
    isLoading: false,
    data: null,
    error: null,
    status: null
  });

  const submit = useCallback(async (data: TRequest): Promise<TResponse | null> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      let requestBody: EncryptedPayload | TRequest;
      const requestHeaders: Record<string, string> = {
        ...customHeaders
      };

      if (encryptRequest) {
        // Mã hóa request data
        requestBody = await createEncryptedPayload(data);
        // Thêm nonce cho request
        (requestBody as EncryptedPayload).nonce = generateNonce();
        
        // Đánh dấu request là encrypted trong header
        requestHeaders['X-Encrypted-Request'] = 'true';
        requestHeaders['X-Encryption-Algorithm'] = 'AES-256-GCM';
        requestHeaders['Content-Type'] = 'application/json';
      } else {
        requestBody = data;
        requestHeaders['Content-Type'] = 'application/json';
      }

      // Thêm token từ localStorage nếu có
      const token = localStorage.getItem('token');
      if (token) {
        requestHeaders['Authorization'] = `Bearer ${token}`;
      }

      // Tạo AbortController cho timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: requestHeaders,
          body: JSON.stringify(requestBody),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        const responseData = await response.json();

        if (!response.ok) {
          const error = new Error(responseData.message || `HTTP Error ${response.status}`);
          setState({
            isLoading: false,
            data: null,
            error,
            status: response.status
          });
          return null;
        }

        // Xử lý response
        let parsedData: TResponse;
        
        // Kiểm tra xem response có được mã hóa không
        if (responseData.encrypted && responseData.data && responseData.iv) {
          // Import decrypt function dynamically để giảm bundle size khi không cần
          const { decrypt } = await import('@lib/crypto');
          parsedData = await decrypt<TResponse>(responseData.data, responseData.iv);
        } else {
          // Response không được mã hóa
          parsedData = responseData.dataresponse || responseData.data || responseData;
        }

        setState({
          isLoading: false,
          data: parsedData,
          error: null,
          status: response.status
        });

        return parsedData;
      } finally {
        clearTimeout(timeoutId);
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error occurred');
      
      // Kiểm tra nếu là abort error
      if (error.name === 'AbortError') {
        error.message = 'Request timeout';
      }

      setState({
        isLoading: false,
        data: null,
        error,
        status: null
      });
      
      return null;
    }
  }, [url, encryptRequest, timeout, customHeaders]);

  const reset = useCallback(() => {
    setState({
      isLoading: false,
      data: null,
      error: null,
      status: null
    });
  }, []);

  return {
    state,
    submit,
    reset,
    isLoading: state.isLoading,
    data: state.data,
    error: state.error
  };
}

/**
 * Hook đơn giản để mã hóa data trước khi submit form
 * 
 * @example
 * ```tsx
 * const { encryptData, encryptedPayload } = useEncryption();
 * 
 * const handleSubmit = async (formData) => {
 *   const encrypted = await encryptData(formData);
 *   // Gửi encrypted lên server
 * };
 * ```
 */
export function useEncryption() {
  const [encryptedPayload, setEncryptedPayload] = useState<EncryptedPayload | null>(null);
  const [isEncrypting, setIsEncrypting] = useState(false);

  const encryptData = useCallback(async (data: unknown): Promise<EncryptedPayload> => {
    setIsEncrypting(true);
    try {
      const encrypted = await createEncryptedPayload(data);
      encrypted.nonce = generateNonce();
      setEncryptedPayload(encrypted);
      return encrypted;
    } finally {
      setIsEncrypting(false);
    }
  }, []);

  const clearEncrypted = useCallback(() => {
    setEncryptedPayload(null);
  }, []);

  return {
    encryptData,
    encryptedPayload,
    isEncrypting,
    clearEncrypted
  };
}

/**
 * Higher-order function để wrap form submit với encryption
 * 
 * @example
 * ```tsx
 * const encryptedSubmit = withEncryption(async (data) => {
 *   return await fetch('/api/submit', {
 *     method: 'POST',
 *     body: JSON.stringify(data)
 *   });
 * });
 * 
 * // Sử dụng
 * await encryptedSubmit(formData);
 * ```
 */
export function withEncryption<T>(
  submitFn: (encryptedData: EncryptedPayload) => Promise<T>
): (data: unknown) => Promise<T> {
  return async (data: unknown) => {
    const encrypted = await createEncryptedPayload(data);
    encrypted.nonce = generateNonce();
    return submitFn(encrypted);
  };
}
