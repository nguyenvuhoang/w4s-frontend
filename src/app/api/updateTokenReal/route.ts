// src/app/api/updateTokenReal/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { env } from '@/env.mjs';

export async function POST(req: NextRequest) {
    const body = await req.json();

    const token = await getToken({ req, secret: env.NEXTAUTH_SECRET });
    
    if (!token) {
        return NextResponse.json({ message: 'Failed to retrieve token' }, { status: 500 });
    }

    if (body.tokenreal) {
        token.tokenreal = body.tokenreal;
    }

    return NextResponse.json(
        {
            message: 'Token updated successfully', tokenreal: token.tokenreal
        },
        {
            status: 200
        }
    );
}
