import { getSql } from './db'
import { matchesBank } from './bankMatch'

export type BankId = 'ts-ug' | 'ap-ug' | 'ts-pg' | 'ap-pg'

export type BankSummary = {
  id: BankId
  label: string
  exam: string
  description: string
  questions: number
  papers: number
  years: number[]
  tracks: string[]
  available: boolean
}

const BANKS: Omit<BankSummary, 'questions' | 'papers' | 'years' | 'tracks' | 'available'>[] = [
  {
    id: 'ts-ug',
    label: 'TS UG LAWCET',
    exam: 'TS LAWCET',
    description: 'Telangana 3-year and 5-year LLB entrance papers.',
  },
  {
    id: 'ap-ug',
    label: 'AP UG LAWCET',
    exam: 'AP LAWCET',
    description: 'Andhra Pradesh 3-year and 5-year LLB entrance papers.',
  },
  {
    id: 'ts-pg',
    label: 'TS PG LAWCET',
    exam: 'TS PGLCET',
    description: 'Telangana LLM / PGLCET papers.',
  },
  {
    id: 'ap-pg',
    label: 'AP PG LAWCET',
    exam: 'AP PGLCET',
    description: 'Andhra Pradesh LLM / PGLCET papers. Import when ready.',
  },
]

export { matchesBank }

export async function loadBankSummaries(): Promise<BankSummary[]> {
  const sql = getSql()
  const rows = await sql.query(`
    SELECT
      p.track_code,
      p.exam_year,
      p.session_code,
      count(*)::int AS question_count
    FROM content.papers p
    JOIN content.paper_questions pq ON pq.paper_id = p.id
    GROUP BY 1, 2, 3
    ORDER BY 1, 2, 3
  `) as Array<{ track_code: string; exam_year: number; session_code: string; question_count: number }>

  return BANKS.map(bank => {
    const matching = rows.filter(row => matchesBank(row.track_code, bank.id))
    const years = [...new Set(matching.map(row => Number(row.exam_year)))].sort((a, b) => b - a)
    const tracks = [...new Set(matching.map(row => row.track_code))].sort()
    const questions = matching.reduce((sum, row) => sum + Number(row.question_count), 0)
    return {
      ...bank,
      questions,
      papers: matching.length,
      years,
      tracks,
      available: questions > 0,
    }
  })
}
