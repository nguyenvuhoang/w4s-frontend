import { NextResponse } from 'next/server';
import { infisicalServerService } from '@/servers/system-service/services/infisical.server';

export async function GET(request: Request) {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];

    try {
        const res = await infisicalServerService.getWorkspaces(token);
        return NextResponse.json(res.payload, { status: res.status });
    } catch (error) {
        console.error('API Workspaces error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
