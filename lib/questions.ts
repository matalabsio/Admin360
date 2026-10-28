import { getSql } from './db'

export const PREVIEW_QUERY = `
SELECT jsonb_build_object(
  'id', coalesce(nullif(pq.source_question_id,''), qs.source_question_id, pq.question_version_id::text),
  'exam', CASE
    WHEN p.track_code = 'TS-PG' THEN 'TS PGLCET'
    WHEN p.track_code LIKE 'TS-%' THEN 'TS LAWCET'
    WHEN p.track_code = 'AP-PG' THEN 'AP PGLCET'
    WHEN p.track_code LIKE 'AP-%' THEN 'AP LAWCET'
    ELSE p.track_code
  END,
  'year', p.exam_year,
  'exam_date', coalesce(to_char(p.exam_date, 'YYYY-MM-DD'), ''),
  'course', CASE
    WHEN p.track_code LIKE '%-LLB3' THEN '3-Year LLB'
    WHEN p.track_code LIKE '%-LLB5' THEN '5-Year LLB'
    WHEN p.track_code LIKE '%-PG' THEN 'PGLCET'
    ELSE p.track_code
  END,
  'shift', CASE
    WHEN p.session_code ~ '^shift-([0-9]+)$' THEN (regexp_match(p.session_code, '^shift-([0-9]+)$'))[1]::int
    ELSE 0
  END,
  'question_no', pq.question_number,
  'part', CASE lower(coalesce(pq.section_code,''))
    WHEN 'part-a' THEN 'A'
    WHEN 'general-knowledge-mental-ability' THEN 'A'
    WHEN 'part-b' THEN 'B'
    WHEN 'current-affairs' THEN 'B'
    WHEN 'part-c' THEN 'C'
    WHEN 'legal-aptitude' THEN 'C'
    ELSE upper(left(coalesce(pq.section_code,'?'), 1))
  END,
  'part_name', CASE WHEN p.track_code LIKE '%-PG' THEN upper(replace(coalesce(pq.section_code, 'unclassified'), '-', ' ')) ELSE CASE lower(coalesce(pq.section_code,''))
    WHEN 'part-a' THEN 'General Knowledge & Mental Ability'
    WHEN 'general-knowledge-mental-ability' THEN 'General Knowledge & Mental Ability'
    WHEN 'part-b' THEN 'Current Affairs'
    WHEN 'current-affairs' THEN 'Current Affairs'
    WHEN 'part-c' THEN 'Aptitude for the Study of Law'
    WHEN 'legal-aptitude' THEN 'Aptitude for the Study of Law'
    ELSE coalesce(nullif(pq.section_code,''), 'Unclassified')
  END END,
  'topic_code', coalesce(t.code, ''),
  'topic', coalesce(nullif(t.name_en,''), 'Unclassified'),
  'question_en', qv.stem_en,
  'option_a', coalesce(oa.body_en, ''),
  'option_b', coalesce(ob.body_en, ''),
  'option_c', coalesce(oc.body_en, ''),
  'option_d', coalesce(od.body_en, ''),
  'answer', CASE ak.correct_position WHEN 1 THEN 'A' WHEN 2 THEN 'B' WHEN 3 THEN 'C' WHEN 4 THEN 'D' ELSE '' END,
  'answer_text', CASE ak.correct_position
    WHEN 1 THEN coalesce(oa.body_en, '')
    WHEN 2 THEN coalesce(ob.body_en, '')
    WHEN 3 THEN coalesce(oc.body_en, '')
    WHEN 4 THEN coalesce(od.body_en, '')
    ELSE ''
  END,
  'track_code', p.track_code,
  'session_code', p.session_code,
  'status', qv.status
) AS question
FROM content.papers p
JOIN content.paper_questions pq ON pq.paper_id = p.id
JOIN content.question_versions qv ON qv.id = pq.question_version_id
LEFT JOIN content.answer_keys ak ON ak.question_version_id = qv.id
LEFT JOIN catalog.topics t ON t.id = qv.topic_id
LEFT JOIN content.question_options oa ON oa.question_version_id = qv.id AND oa.position = 1
LEFT JOIN content.question_options ob ON ob.question_version_id = qv.id AND ob.position = 2
LEFT JOIN content.question_options oc ON oc.question_version_id = qv.id AND oc.position = 3
LEFT JOIN content.question_options od ON od.question_version_id = qv.id AND od.position = 4
LEFT JOIN LATERAL (
  SELECT source_question_id
  FROM content.question_sources
  WHERE question_version_id = qv.id
  ORDER BY id
  LIMIT 1
) qs ON true
ORDER BY p.exam_year, p.track_code, p.session_code, pq.question_number
LIMIT 5000`

export async function loadPreviewQuestions() {
  const sql = getSql()
  const rows = await sql.query(PREVIEW_QUERY)
  return rows.map(row => (row as { question: unknown }).question)
}
