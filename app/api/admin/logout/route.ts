import { NextResponse } from 'next/server'
import { withClearedSessionCookie } from '@/lib/auth'

export async function POST() {
  return withClearedSessionCookie(new NextResponse(null, { status: 204 }))
}
