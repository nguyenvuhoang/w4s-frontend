import { signIn } from '@/auth';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    const {
        username,
        password,
        my_device,
        language,
        realtoken,
        is_reset_device
    } = await req.json();

    const credentials = realtoken
        ? { realtoken, redirect: false }
        : { username, password, my_device, language, is_reset_device, redirect: false };

    try {
        const res = await signIn("credentials", credentials);

        if (!res || (res as any)?.error) {
            return NextResponse.json({
                status: 401,
                statusText: 'Unauthorized',
                error: 'Login failed. Please check your credentials.',
                ok: false,
                data: {}
            }, { status: 401 });
        }

        return NextResponse.json({
            status: 200,
            statusText: 'OK',
            error: '',
            data: res,
            ok: true
        }, { status: 200 });

    } catch (error) {
        return NextResponse.json({
            status: 500,
            statusText: 'Internal Server Error',
            error: 'Unexpected authentication error.',
            ok: false,
            data: {}
        }, { status: 500 });
    }
}
