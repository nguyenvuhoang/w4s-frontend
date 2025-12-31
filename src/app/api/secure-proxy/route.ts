/**
 * Secure Proxy API Route
 * 
 * Proxy endpoint để forward encrypted requests đến backend services.
 * Client gửi encrypted request → Proxy decrypt → Forward to backend → Encrypt response → Return
 * 
 * @module app/api/secure-proxy/route
 */

import { NextResponse } from 'next/server';
import logger from '@lib/logger';
import { decryptRequestBody, createEncryptedResponse } from '@/servers/lib/encrypted-handler';
import { env } from '@/env.mjs';

interface ProxyPayload {
  /** Target endpoint (e.g., '/system-service') */
  endpoint: string;
  /** HTTP method */
  method?: 'POST' | 'GET' | 'PUT' | 'DELETE';
  /** Request body to forward */
  body: unknown;
  /** Additional headers */
  headers?: Record<string, string>;
}

export async function POST(req: Request) {
  try {
    // Kiểm tra và decrypt request
    const isEncrypted = req.headers.get('X-Encrypted-Request') === 'true';
    let payload: ProxyPayload;

    if (isEncrypted) {
      const { success, data, error } = await decryptRequestBody<ProxyPayload>(req, {
        verifySignature: false,
        maxAge: 5 * 60 * 1000
      });

      if (!success || !data) {
        return NextResponse.json(
          { success: false, error: error || 'Failed to decrypt request' },
          { status: 400 }
        );
      }
      payload = data;
    } else {
      payload = await req.json();
    }

    const { endpoint, method = 'POST', body, headers: customHeaders = {} } = payload;

    if (!endpoint) {
      return NextResponse.json(
        { success: false, error: 'Endpoint is required' },
        { status: 400 }
      );
    }

    // Build target URL
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || env.NEXT_PUBLIC_REST_API_ENDPOINT;
    const targetUrl = `${baseUrl}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;

    logger.info(`[Secure Proxy] Forwarding to: ${targetUrl}`);

    // Forward request to backend
    const response = await fetch(targetUrl, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...customHeaders
      },
      body: method !== 'GET' ? JSON.stringify(body) : undefined
    });

    const responseData = await response.json();

    // Nếu request gốc là encrypted, encrypt response
    if (isEncrypted) {
      return createEncryptedResponse(responseData, response.status);
    }

    return NextResponse.json(responseData, { status: response.status });

  } catch (error) {
    logger.error('[Secure Proxy] Error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Proxy error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Secure Proxy API',
    description: 'Use POST with encrypted payload to forward requests securely',
    usage: {
      endpoint: '/system-service',
      method: 'POST',
      body: '{ ...your data }',
      headers: '{ uid: "token", app: "BO" }'
    }
  });
}
