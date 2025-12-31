import logger from '@lib/logger';
import { NextResponse } from 'next/server';
import { decryptRequestBody } from '@/servers/lib/encrypted-handler';

export async function POST(req: Request) {
    try {
        // Kiểm tra xem request có được mã hóa không
        const isEncrypted = req.headers.get('X-Encrypted-Request') === 'true';
        
        let requestData;
        if (isEncrypted) {
            // Clone request để đọc body
            const clonedReq = req.clone();
            const { success, data, error } = await decryptRequestBody(clonedReq);
            
            if (!success) {
                logger.error('❌ Failed to decrypt request:', error);
                return NextResponse.json(
                    { message: 'Failed to decrypt request', error },
                    { status: 400 }
                );
            }
            requestData = data;
            logger.info('🔓 Request decrypted successfully');
        } else {
            requestData = await req.json();
        }

        const tokenInfo = req.headers.get('uid');

        logger.start('=====================Request Data====================')
        logger.info(JSON.stringify(requestData))
        logger.info('====================End Request Data=====================')

        const endpoint = `${process.env.NEXT_PUBLIC_REST_API_ENDPOINT}`;
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'content-type': 'application/json',
                lang: req.headers.get('lang') || 'en',
                app: req.headers.get('app') || 'BO',
                uid: tokenInfo || '',
            },
            body: JSON.stringify(requestData),
        });

        if (!response.ok) {
            const status = response.status;
            const errorMessage = await safeParseJSON(response);

            return NextResponse.json(
                {
                    message: errorMessage?.message || 'Unexpected error from backend service.',
                    dataresponse: errorMessage ?? null,
                },
                { status }
            );
        }

        const dataresponse = await response.json();
        
        return NextResponse.json(
            { dataresponse },
            {
                status: 200,
                statusText: 'Success',
            }
        );
    } catch (error: any) {
        logger.error('❌ Request failed:', error);

        return NextResponse.json(
            {
                message: ['❌ The server is temporarily unavailable. Please try again later!'],
            },
            {
                status: 500,
            }
        );
    }
}

async function safeParseJSON(response: Response) {
    try {
        return await response.json();
    } catch {
        return null;
    }
}
