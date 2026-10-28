'use client'

import { useState } from 'react'

const paperLabel = q => `${q.exam} · ${q.course} · ${q.year} · Shift ${q.shift}`
const paperCount = group => new Set(group.items.map(paperLabel)).size

export default function RepetitionPreview({ questions, matches }) {
  const [kind, setKind] = useState('exact')
  const [year, setYear] = useState('All years')
  const [section, setSection] = useState('All sections')
  const [topic, setTopic] = useState('All topics')
  const [course, setCourse] = useState('All courses')
  const [shift, setShift] = useState('All shifts')
  const [page, setPage] = useState(1)

  const years = [...new Set(questions.map(q => String(q.year)))].sort().reverse()
  const sections = [...new Set(questions.map(q => q.part_name).filter(Boolean))].sort()
  const topics = [...new Set(questions.filter(q => section === 'All sections' || q.part_name === section).map(q => q.topic).filter(Boolean))].sort()
  const courses = [...new Set(questions.map(q => q.course).filter(Boolean))].sort()
  const shifts = [...new Set(questions.map(q => String(q.shift)))].sort()

  const results = [...matches[kind]]
    .sort((a, b) => kind === 'exact'
      ? paperCount(b) - paperCount(a) || b.items.length - a.items.length
      : b.score - a.score || b.items.length - a.items.length)
    .filter(group => group.items.some(q =>
      (year === 'All years' || String(q.year) === year) &&
      (section === 'All sections' || q.part_name === section) &&
      (topic === 'All topics' || q.topic === topic) &&
      (course === 'All courses' || q.course === course) &&
      (shift === 'All shifts' || String(q.shift) === shift)))

  const last = Math.max(1, Math.ceil(results.length / 10))
  const current = Math.min(page, last)
  const change = fn => event => { fn(event.target.value); setPage(1) }
  const mapped = matches.exact.reduce((n, g) => n + g.items.length, 0) + matches.similar.reduce((n, g) => n + g.items.length, 0)

  return <>
    <p className="lede">Compare original question occurrences across the supplied papers.</p>
    <div className="preview-banner">
      <strong>Review required</strong>
      <span>All {questions.length.toLocaleString()} imported questions were scanned. {mapped.toLocaleString()} occurrences sit in repeat clusters. Similar wording can still have different meaning or answers — verify every candidate against the source.</span>
    </div>
    <div className="match-tabs" role="group" aria-label="Match type">
      <button className={kind === 'exact' ? 'chosen' : ''} onClick={() => { setKind('exact'); setPage(1) }}>Exact / near-exact text <span>{matches.exact.length}</span></button>
      <button className={kind === 'similar' ? 'chosen' : ''} onClick={() => { setKind('similar'); setPage(1) }}>Possible similarity <span>{matches.similar.length}</span></button>
    </div>
    <div className="catalog-filters">
      <label>Year<select value={year} onChange={change(setYear)}><option>All years</option>{years.map(v => <option key={v}>{v}</option>)}</select></label>
      <label>Source section<select value={section} onChange={event => { setTopic('All topics'); change(setSection)(event) }}><option>All sections</option>{sections.map(v => <option key={v}>{v}</option>)}</select></label>
      <label>Source topic<select value={topic} onChange={change(setTopic)}><option>All topics</option>{topics.map(v => <option key={v}>{v}</option>)}</select></label>
      <label>Course<select value={course} onChange={change(setCourse)}><option>All courses</option>{courses.map(v => <option key={v}>{v}</option>)}</select></label>
      <label>Shift<select value={shift} onChange={change(setShift)}><option>All shifts</option>{shifts.map(v => <option key={v}>{v}</option>)}</select></label>
    </div>
    <section className="panel wide">
      <div className="panel-heading">
        <div>
          <h2>{kind === 'exact' ? 'Exact / near-exact groups' : 'Similar wording clusters'}</h2>
          <p>{results.length} {kind === 'exact' ? 'groups' : 'clusters'} match these filters. Each result lists every linked occurrence across papers, including those outside the active filter.</p>
        </div>
      </div>
      {results.length === 0 && <p>No matches found for these filters.</p>}
      {results.slice((current - 1) * 10, current * 10).map((group, index) => (
        <article className="match-group" key={`${kind}-${current}-${index}`}>
          <div className="match-heading">
            <strong>{kind === 'exact' ? 'Same normalized stem' : 'Possible similar wording'}</strong>
            <span>
              {kind === 'similar' ? `${Math.round(group.score * 100)}% word overlap · ${group.items.length} occurrences · unreviewed` : `${paperCount(group)} papers · ${group.items.length} occurrences · compare answers`}
              {group.answerConflict ? ' · answer conflict' : ''}
            </span>
          </div>
          {group.items.map((q, i) => (
            <div className="match-occurrence" key={`${q.id}-${i}`}>
              <div className="row-meta">{paperLabel(q)} · Q{q.question_no}</div>
              <p>{q.question_en}</p>
              <div className="row-meta">{q.part_name} · {q.topic_code || '—'} · {q.topic || 'Unclassified'} · Source {q.id}</div>
              <div className="row-meta">Provided answer: {q.answer || 'Not supplied'}{q.answer_text ? ` · ${q.answer_text}` : ''}{group.answerConflict ? ' · conflicts with another occurrence' : ''}</div>
              <details className="match-options">
                <summary>View supplied options</summary>
                <ol type="A">{['a', 'b', 'c', 'd'].map(option => <li key={option}>{q[`option_${option}`] || 'Not supplied'}</li>)}</ol>
              </details>
            </div>
          ))}
        </article>
      ))}
      <div className="pagination">
        <button disabled={current === 1} onClick={() => setPage(current - 1)}>Previous</button>
        <span>Page {current} of {last}</span>
        <button disabled={current === last} onClick={() => setPage(current + 1)}>Next</button>
      </div>
      <p className="small muted">Exact / near-exact compares stems after normalizing case, punctuation and common filler words. Similarity clusters linked word-overlap pairs within the same source section across different papers. Neither establishes verified concept repetition; options and answers still need human review.</p>
    </section>
  </>
}
