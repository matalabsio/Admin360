import { createHmac, timingSafeEqual, randomBytes } from 'crypto'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export const COOKIE_NAME = 'vakeel_admin_session'
const MAX_AGE_SECONDS = 8 * 60 * 60

function sessionSecret() {
  const secret = process.env.ADMIN_SESSION_SECRET
  if (!secret) {
    throw new Error('ADMIN_SESSION_SECRET is not configured')
  }
  return secret
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

export function allowedEmails() {
  const primary = normalizeEmail(process.env.ADMIN_DEV_EMAIL || 'director@matalabs.io')
  const extra = (process.env.ADMIN_ALLOWED_EMAILS || '')
    .split(',')
    .map(normalizeEmail)
    .filter(Boolean)
  return new Set([primary, ...extra])
}

export function verifyCredentials(email: string, password: string) {
  const expectedPassword = process.env.ADMIN_DEV_PASSWORD || ''
  if (!expectedPassword) return false
  if (!allowedEmails().has(normalizeEmail(email))) return false
  const left = Buffer.from(password)
  const right = Buffer.from(expectedPassword)
  if (left.length !== right.length) return false
  return timingSafeEqual(left, right)
}

function sign(payload: string) {
  return createHmac('sha256', sessionSecret()).update(payload).digest('hex')
}

function toBase64Url(value: string) {
  return Buffer.from(value, 'utf8').toString('base64url')
}

function fromBase64Url(value: string) {
  return Buffer.from(value, 'base64url').toString('utf8')
}

export function createSessionToken(email: string) {
  const exp = Math.floor(Date.now() / 1000) + MAX_AGE_SECONDS
  const nonce = randomBytes(16).toString('hex')
  const body = toBase64Url(JSON.stringify({ email: normalizeEmail(email), exp, nonce }))
  return `${body}.${sign(body)}`
}

export function readSessionToken(token: string | undefined) {
  if (!token) return null
  const separator = token.lastIndexOf('.')
  if (separator <= 0) return null
  const body = token.slice(0, separator)
  const signature = token.slice(separator + 1)
  const expected = sign(body)
  try {
    const left = Buffer.from(signature)
    const right = Buffer.from(expected)
    if (left.length !== right.length || !timingSafeEqual(left, right)) return null
  } catch {
    return null
  }
  try {
    const payload = JSON.parse(fromBase64Url(body)) as { email?: string; exp?: number }
    const email = normalizeEmail(String(payload.email || ''))
    const exp = Number(payload.exp)
    if (!email || !Number.isFinite(exp) || exp * 1000 < Date.now()) return null
    if (!allowedEmails().has(email)) return null
    return { email, exp }
  } catch {
    return null
  }
}

function cookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    path: '/',
    maxAge,
    secure: process.env.NODE_ENV === 'production',
  }
}

export function withSessionCookie(response: NextResponse, email: string) {
  response.cookies.set(COOKIE_NAME, createSessionToken(email), cookieOptions(MAX_AGE_SECONDS))
  return response
}

export function withClearedSessionCookie(response: NextResponse) {
  response.cookies.set(COOKIE_NAME, '', cookieOptions(0))
  return response
}

export async function getSession() {
  const jar = await cookies()
  return readSessionToken(jar.get(COOKIE_NAME)?.value)
}
