// Next Imports
import { NextResponse } from 'next/server';


export async function POST(req: Request) {
    // Vars
    const requestData = await req.json()

    const tokenInfo = req.headers.get('uid');

    const requestbank = await fetch(`${process.env.NEXT_PUBLIC_REST_API_ENDPOINT}`, {
        method: 'POST',
        headers: {
            'content-type': 'application/json',
            'lang': req.headers.get('lang') || 'en',
            'app': req.headers.get('app') || '89',
            "uid": `${tokenInfo}`
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
