// /app/api/verify-turnstile/route.ts

import { env } from '@/env.mjs'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const body = await req.json()
  const token = body['cf-turnstile-response']
  const ip = req.headers.get('x-forwarded-for') || ''
  console.log(`env.TURNSTILE_SECRET: ${env.TURNSTILE_SECRET}`)
  const url = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      secret: env.TURNSTILE_SECRET!,
      response: token,
      remoteip: ip
    })
  })

  const data = await response.json()

  if (data.success) {
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ success: false, error: data['error-codes'] || [] }, { status: 400 })
}
