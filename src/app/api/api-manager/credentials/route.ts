import { NextResponse } from 'next/server';
import { store } from '@/server/api-manager/store';

export async function GET() {
    return NextResponse.json({
        apiKeys: store.apiKeys,
        oauthClients: store.oauthClients
    });
}
