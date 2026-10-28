import { NextResponse } from 'next/server'
import { verifyCredentials, withSessionCookie } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const email = String(body?.email || '')
    const password = String(body?.password || '')
    if (!verifyCredentials(email, password)) {
      return NextResponse.json({ error: 'Incorrect email or password' }, { status: 401 })
    }
    return withSessionCookie(NextResponse.json({ authenticated: true }), email)
  } catch {
    return NextResponse.json({ error: 'Sign-in unavailable' }, { status: 503 })
  }
}
