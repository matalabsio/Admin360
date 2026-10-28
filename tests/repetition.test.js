import { describe, expect, test } from 'bun:test'
import { findRepetitions, normalizeText, softExactKey } from '../lib/repetition'

const q = (question_en, year, part = 'C', extras = {}) => ({
  question_en, year, part, part_name: part === 'A' ? 'General Knowledge & Mental Ability' : part === 'B' ? 'Current Affairs' : 'Aptitude for the Study of Law',
  exam: 'TG', course: '3-Year LLB', shift: 1, answer: extras.answer || 'A', ...extras,
})

describe('repetition preview', () => {
  test('groups case and punctuation variants without dropping legal identifiers or negation', () => {
    expect(normalizeText('Article 14-A is NOT applicable?')).toBe('article 14-a is not applicable')
    const result = findRepetitions([
      q('Article 14-A is NOT applicable?', 2020),
      q('article 14-a is not applicable.', 2021),
      q('Article 14 is applicable?', 2025),
    ])
    expect(result.exact).toHaveLength(1)
    expect(result.exact[0].items).toHaveLength(2)
  })

  test('maps near-exact OCR variants into one exact group', () => {
    expect(softExactKey('Where is the National Judicial Academy located?')).toBe(softExactKey('Where is National Judicial Academy located .'))
    const result = findRepetitions([
      q('Where is the National Judicial Academy located?', 2020),
      q('Where is National Judicial Academy located .', 2023),
      q('Which of the following countries has an unwritten Constitution?', 2021),
      q('Which of the following countries has unwritten Constitution?', 2022),
    ])
    expect(result.exact).toHaveLength(2)
    expect(result.exact.every(group => group.items.length === 2)).toBe(true)
  })

  test('clusters overlapping wording across papers and flags answer conflicts', () => {
    const result = findRepetitions([
      q('Which article protects the freedom of speech in India?', 2020, 'C', { answer: 'A' }),
      q('Which article protects the freedom of speech in the Constitution of India?', 2021, 'C', { answer: 'B' }),
      q('Which article protects freedom of speech under the Constitution of India?', 2025, 'C', { answer: 'B' }),
      q('Which article protects the freedom of speech in the Constitution of India?', 2021, 'A', { answer: 'A' }),
    ])
    expect(result.similar.length).toBe(1)
    expect(result.similar[0].items).toHaveLength(3)
    expect(result.similar[0].answerConflict).toBe(true)
  })
})
