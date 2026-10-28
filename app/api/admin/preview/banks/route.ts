import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { loadBankSummaries } from '@/lib/banks'

export async function GET() {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Sign in required' }, { status: 401 })
  }
  try {
    const banks = await loadBankSummaries()
    return NextResponse.json({ banks })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to load question banks'
    return NextResponse.json({ error: message }, { status: 503 })
  }
}
