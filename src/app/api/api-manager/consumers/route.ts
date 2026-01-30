import { NextResponse } from 'next/server';
import { store } from '@/server/api-manager/store';

export async function GET() {
    return NextResponse.json(store.consumers);
}
