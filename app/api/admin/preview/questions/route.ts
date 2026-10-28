import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { loadPreviewQuestions } from '@/lib/questions'

export async function GET() {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Sign in required' }, { status: 401 })
  }
  try {
    const questions = await loadPreviewQuestions()
    if (!questions.length) {
      return NextResponse.json({ error: 'Question preview database returned no papers' }, { status: 503 })
    }
    return NextResponse.json({ questions, source: 'database' })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Question preview database is unavailable'
    return NextResponse.json({ error: message }, { status: 503 })
  }
}
