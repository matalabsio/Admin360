import { NextResponse } from 'next/server'
import { verifyCredentials, withSessionCookie } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    if (!process.env.ADMIN_DEV_PASSWORD) {
      return NextResponse.json({ error: 'ADMIN_DEV_PASSWORD is not configured on the server' }, { status: 503 })
    }
    if (!process.env.ADMIN_SESSION_SECRET) {
      return NextResponse.json({ error: 'ADMIN_SESSION_SECRET is not configured on the server' }, { status: 503 })
    }
    const body = await request.json()
    const email = String(body?.email || '')
    const password = String(body?.password || '')
    if (!verifyCredentials(email, password)) {
      return NextResponse.json({ error: 'Incorrect email or password' }, { status: 401 })
    }
    return withSessionCookie(NextResponse.json({ authenticated: true }), email)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Sign-in unavailable'
    return NextResponse.json({ error: message }, { status: 503 })
  }
}
