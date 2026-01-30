import { NextResponse } from 'next/server';
import { store } from '@/server/api-manager/store';
import { Route } from '@/types/api-manager';

export async function GET() {
    return NextResponse.json(store.routes);
}

export async function POST(request: Request) {
    const body = await request.json();
    const newRoute: Route = {
        ...body,
        id: `route-${Date.now()}`
    };
    store.routes.push(newRoute);
    return NextResponse.json(newRoute);
}
