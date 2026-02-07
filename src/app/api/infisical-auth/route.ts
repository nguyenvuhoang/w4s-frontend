import { env } from '@/env.mjs';
import { infisicalServerService } from '@/servers/system-service/services/infisical.server';
import { NextResponse } from 'next/server';

export async function POST() {
    try {
        const res = await infisicalServerService.login({
            clientId: env.INFISICAL_CLIENT_ID || '',
            clientSecret: env.INFISICAL_CLIENT_SECRET || '',
        });

        return NextResponse.json(res.payload, { status: res.status });
    } catch (error) {
        console.error('API Auth error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
