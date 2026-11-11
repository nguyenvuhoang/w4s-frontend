import { NextResponse } from 'next/server'
import { PARTNER_SESSION_COOKIE } from '@/features/partner-portal/server/partnerWorkflow'
export async function POST() { const response = NextResponse.json({ success: true }); response.cookies.delete(PARTNER_SESSION_COOKIE); return response }
