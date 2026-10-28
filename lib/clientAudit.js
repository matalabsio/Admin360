const CSV_FIELDS = ['id', 'exam', 'year', 'exam_date', 'course', 'shift', 'question_no', 'part', 'part_name', 'topic_code', 'topic', 'question_en', 'option_a', 'option_b', 'option_c', 'option_d', 'answer', 'answer_text']

function parseCsv(text) {
  const rows = []
  let row = []
  let cell = ''
  let inQuotes = false
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    const next = text[i + 1]
    if (inQuotes) {
      if (ch === '"' && next === '"') { cell += '"'; i++; continue }
      if (ch === '"') { inQuotes = false; continue }
      cell += ch
      continue
    }
    if (ch === '"') { inQuotes = true; continue }
    if (ch === ',') { row.push(cell); cell = ''; continue }
    if (ch === '\n' || (ch === '\r' && next === '\n')) {
      row.push(cell); cell = ''
      if (row.some(value => value !== '')) rows.push(row)
      row = []
      if (ch === '\r') i++
      continue
    }
    if (ch !== '\r') cell += ch
  }
  row.push(cell)
  if (row.some(value => value !== '')) rows.push(row)
  return rows
}

function auditRecords(records) {
  const issues = []
  const papers = new Set()
  const seen = new Set()
  let accepted = 0
  let rejected = 0
  let duplicate = 0
  let warnings = 0
  records.forEach((record, index) => {
    const row = index + 1
    const missing = CSV_FIELDS.filter(field => record[field] === undefined || record[field] === null || String(record[field]).trim() === '')
    if (missing.length) {
      rejected++
      issues.push({ row, message: `Missing fields: ${missing.join(', ')}` })
      return
    }
    const key = `${record.id}|${record.year}|${record.shift}|${record.question_no}`
    if (seen.has(key)) {
      duplicate++
      issues.push({ row, message: `Duplicate row for ${key}` })
      return
    }
    seen.add(key)
    papers.add(`${record.exam} · ${record.course} · ${record.year} · Shift ${record.shift}`)
    if (!record.topic || !record.topic_code) warnings++
    accepted++
  })
  return {
    total: records.length,
    accepted,
    rejected,
    duplicate,
    warnings,
    papers: [...papers].sort(),
    issues: issues.slice(0, 200),
  }
}

export function auditConvertedFile(text, format) {
  if (format === 'json') {
    const parsed = JSON.parse(text)
    if (!Array.isArray(parsed)) throw new Error('JSON must contain one array of question records')
    return auditRecords(parsed)
  }
  const rows = parseCsv(text)
  if (rows.length < 2) throw new Error('CSV must include a header row and at least one record')
  const header = rows[0].map(value => value.trim())
  const missing = CSV_FIELDS.filter(field => !header.includes(field))
  if (missing.length) throw new Error(`CSV is missing columns: ${missing.join(', ')}`)
  const records = rows.slice(1).map(values => {
    const record = {}
    header.forEach((name, index) => { record[name] = values[index] ?? '' })
    return record
  })
  return auditRecords(records)
}

export function validatePack(text) {
  const pack = JSON.parse(text)
  if (!pack || typeof pack !== 'object' || Array.isArray(pack)) throw new Error('Pack must be a JSON object')
  if (!pack.paper || typeof pack.paper !== 'object') throw new Error('Pack is missing paper metadata')
  if (!Array.isArray(pack.questions) || pack.questions.length === 0) throw new Error('Pack must include questions')
  return {
    questions: pack.questions.length,
    track: pack.paper.trackCode || pack.paper.track_code || 'unknown',
    year: pack.paper.year || 'unknown',
    session: pack.paper.session || pack.paper.session_code || 'unknown',
  }
}
