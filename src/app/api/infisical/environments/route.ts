import { NextResponse } from 'next/server';
import { infisicalServerService } from '@/servers/system-service/services/infisical.server';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId');
    const authHeader = request.headers.get('Authorization');

    if (!workspaceId) {
        return NextResponse.json({ error: 'workspaceId is required' }, { status: 400 });
    }

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];

    try {
        const res = await infisicalServerService.getEnvironments(token, workspaceId);
        return NextResponse.json(res.payload, { status: res.status });
    } catch (error) {
        console.error('API Environments error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
