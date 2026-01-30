/**
 * Secure Login API Route
 * 
 * API endpoint xá»­ lÃ½ login vá»›i End-to-End Encryption (AES-256-GCM).
 * Giáº£i mÃ£ request, xÃ¡c thá»±c, vÃ  tráº£ vá» káº¿t quáº£.
 * 
 * @module app/api/secure-login/route
 */

import { NextResponse } from 'next/server';
import logger from '@lib/logger';
import { decryptRequestBody } from '@/servers/lib/encrypted-handler';
import { encrypt as o9Encrypt } from '@utils/O9Extension';

interface LoginPayload {
  username: string;
  password: string;
  my_device: string;
  language: string;
  is_reset_device: boolean;
}

export async function POST(req: Request) {
  try {
    logger.start('=================== Secure Login API ===================');

    // Giáº£i mÃ£ request
    const { success, data, error, isEncrypted } = await decryptRequestBody<LoginPayload>(req, {
      verifySignature: false, // Táº¡m thá»i táº¯t signature verification cho testing
      maxAge: 5 * 60 * 1000 // 5 minutes
    });

    if (!success || !data) {
      logger.error(`Decryption failed: ${error}`);
      return NextResponse.json(
        { success: false, error: error || 'Failed to decrypt request' },
        { status: 400 }
      );
    }

    logger.info(`Login request received (encrypted: ${isEncrypted})`);
    logger.info(`Username: ${data.username}`);
    // KHÃ”NG log password!

    // MÃ£ hÃ³a password theo format cÅ© Ä‘á»ƒ gá»i API authenticate
    const encryptedPassword = o9Encrypt(`${data.username}_${data.password}`);

    // Gá»i API authenticate ná»™i bá»™
    const authResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/authenticate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Forward cookies tá»« request gá»‘c
        'Cookie': req.headers.get('cookie') || ''
      },
      body: JSON.stringify({
        username: data.username,
        password: encryptedPassword,
        my_device: data.my_device,
        language: data.language,
        realtoken: undefined,
        is_reset_device: data.is_reset_device
      })
    });

    const authResult = await authResponse.json();

    logger.info(`Auth response status: ${authResponse.status}`);
    logger.info('=================== End Secure Login ===================');

    // Láº¥y cookies tá»« response cá»§a /api/authenticate Ä‘á»ƒ forward vá» client
    const setCookieHeaders = authResponse.headers.getSetCookie();

    // Handle device verification
    if (authResult && authResult.status === 299) {
      return NextResponse.json({
        success: false,
        status: 299,
        error: authResult.error,
        verifyDevice: true
      });
    }

    // Handle success - forward cookies vá» client
    if (authResult && (authResult.error === null || authResult.error === '')) {
      const response = NextResponse.json({
        success: true,
        message: 'Login successful'
      });
      
      // Forward all Set-Cookie headers tá»« authenticate response
      if (setCookieHeaders && setCookieHeaders.length > 0) {
        setCookieHeaders.forEach(cookie => {
          response.headers.append('Set-Cookie', cookie);
        });
        logger.info(`Forwarded ${setCookieHeaders.length} cookies to client`);
      }
      
      return response;
    }

    // Handle error
    return NextResponse.json({
      success: false,
      error: authResult.error || 'Authentication failed'
    }, { status: 401 });

  } catch (error) {
    logger.error('Secure Login Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Secure Login API',
    description: 'Use POST with encrypted payload for authentication',
    encryption: {
      algorithm: 'AES-256-GCM',
      header: 'X-Encrypted-Request: true'
    }
  });
}

