import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest, { params }: { params: { path: string[] } }) {
  const path = params.path?.join('/') || ''
  
  // Handle Chrome DevTools configuration
  if (path === 'com.chrome.devtools.json') {
    return NextResponse.json({
      // Empty configuration - Chrome DevTools will use defaults
    }, { status: 200 })
  }
  
  // For other well-known requests, return 404
  return NextResponse.json(
    { error: 'Not found' },
    { status: 404 }
  )
}

export async function POST() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  )
}