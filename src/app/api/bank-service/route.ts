// Next Imports
import { i18n } from '@/configs/i18n';
import { NextResponse } from 'next/server';
import { getBackendToken } from '@/server/auth/getBackendToken';

export async function POST(req: Request) {
    // Resolve the caller's identity strictly from the server-side session cookie — never trust
    // a uid header sent by the browser (see /api/system-service for the same fix).
    const backendCredential = await getBackendToken(req)

    if (!backendCredential) {
        return NextResponse.json(
            { message: ['Phiên đăng nhập không hợp lệ.'] },
            { status: 401 }
        )
    }

    // Vars
    const requestData = await req.json()

    const requestbank = await fetch(`${process.env.NEXT_PUBLIC_REST_API_ENDPOINT}`, {
        method: 'POST',
        headers: {
            'content-type': 'application/json',
            'lang': req.headers.get('lang') || i18n.defaultLocale,
            'app': req.headers.get('app') || '89',
            "uid": backendCredential.accessToken
        } as any,
        body: JSON.stringify(requestData)
    });

    if (requestbank.status === 404) {
        return NextResponse.json(
            {
                message: "The link URI not found!. The server is temporarily down. Please try again later!",
                dataresponse: {
                    error: [{
                        key: "404",
                        message: "The link URI not found!. The server is temporarily down. Please try again later!"
                    }]
                }
            },
            {
                status: 404
            }
        )
    } else if (requestbank.status === 403) {
        return NextResponse.json(
            {
                message: "The server is temporarily down. Please try again later!"
            },
            { status: 403 }
        );
    }
    else if (requestbank.status === 500) {
        return NextResponse.json(
            {
                message: ['❌ The server is temporarily unavailable. Please try again later!']
            },
            {
                status: 500,
                statusText: 'The server is temporarily unavailable'
            }
        )
    }

    else if (requestbank.status === 401) {
        return NextResponse.json(
            {
                message: ['Unauthorized Access']
            },
            {
                status: 401,
                statusText: 'Unauthorized Access'
            }
        )
    } else {
        const dataresponse = await requestbank.json()

        if (requestbank.status === 200) {

            return NextResponse.json(
                {
                    dataresponse
                },
                {
                    status: 200,
                    statusText: 'Success'
                }
            )
        }
    }
}
