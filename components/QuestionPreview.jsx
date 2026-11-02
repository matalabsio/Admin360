'use client'

import { useEffect, useMemo, useState } from 'react'
import RepetitionPreview from './RepetitionPreview'
import TopicInsights from './TopicInsights'
import { matchesBank } from '@/lib/bankMatch'
import { findRepetitions } from '@/lib/repetition'

const paperKey = q => `${q.exam} · ${q.course} · ${q.year} · Shift ${q.shift}`
const countBy = (items, key) => Object.entries(items.reduce((result, item) => {
  const value = key(item) || 'Unclassified'
  result[value] = (result[value] || 0) + 1
  return result
}, {})).sort((a, b) => b[1] - a[1])

const SECTION_ORDER = [
  'General Knowledge & Mental Ability',
  'Current Affairs',
  'Aptitude for the Study of Law',
]

const SECTION_META = {
  'General Knowledge & Mental Ability': { part: 'A', short: 'GK & Mental Ability' },
  'Current Affairs': { part: 'B', short: 'Current Affairs' },
  'Aptitude for the Study of Law': { part: 'C', short: 'Legal Aptitude' },
}

const shortStem = (text, max = 108) => {
  const value = (text || '').replace(/\s+/g, ' ').trim()
  if (value.length <= max) return value
  return `${value.slice(0, max - 1).trimEnd()}…`
}

const topicLabel = q => q.topic || 'Unclassified'
const sectionLabel = q => q.part_name || 'Unclassified'

function orderedSections(questions) {
  const counts = Object.fromEntries(countBy(questions, sectionLabel))
  const preferred = SECTION_ORDER.filter(name => counts[name])
  const rest = Object.keys(counts).filter(name => !SECTION_ORDER.includes(name)).sort()
  return [...preferred, ...rest].map(name => ({
    name,
    count: counts[name] || 0,
    part: SECTION_META[name]?.part || (name === 'Unclassified' ? '—' : name.slice(0, 1).toUpperCase()),
    short: SECTION_META[name]?.short || name,
  }))
}

export default function QuestionPreview({ page, openPage, examLevel }) {
  const [questions, setQuestions] = useState(null)
  const [source, setSource] = useState('files')
  const [error, setError] = useState('')
  const [year, setYear] = useState('All years')
  const [course, setCourse] = useState('All courses')
  const [topic, setTopic] = useState('All topics')
  const [topicCode, setTopicCode] = useState(null)
  const [section, setSection] = useState('All sections')
  const [shift, setShift] = useState('All shifts')
  const [paper, setPaper] = useState('All papers')
  const [match, setMatch] = useState('All questions')
  const [current, setCurrent] = useState(1)
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    const controller = new AbortController()
    fetch('/api/admin/preview/questions', { credentials: 'same-origin', signal: controller.signal })
      .then(async response => {
        const result = await response.json()
        if (!response.ok) throw new Error(result.error || 'Unable to load questions')
        setQuestions(result.questions.filter(q => matchesBank(q.track_code, examLevel)))
        setSource(result.source || 'files')
      })
      .catch(err => {
        if (err.name !== 'AbortError') setError(err.message)
      })
    return () => controller.abort()
  }, [examLevel])

  const sourceBanner = source === 'database'
    ? { title: 'Database catalog', detail: 'Imported papers from Neon · Topic codes stay empty until review assigns taxonomy.' }
    : { title: 'Source preview', detail: 'Converted OCR data · Answers and tags require review against the original papers.' }

  const matches = useMemo(() => findRepetitions(questions || []), [questions])
  const matchTags = useMemo(() => {
    const tags = new Map()
    for (const kind of ['exact', 'similar']) {
      for (const group of matches[kind]) {
        for (const q of group.items) {
          const entry = tags.get(q) || new Set()
          entry.add(kind)
          tags.set(q, entry)
        }
      }
    }
    return tags
  }, [matches])

  // Catalog filters: section → topic cascade; year for narrowing. Other dims used by deep links from Overview.
  const filtered = useMemo(() => (questions || []).filter(q =>
    (year === 'All years' || String(q.year) === year) &&
    (course === 'All courses' || q.course === course) &&
    (topic === 'All topics' || topicLabel(q) === topic) &&
    (topicCode === null || String(q.topic_code || '—') === topicCode) &&
    (section === 'All sections' || sectionLabel(q) === section) &&
    (shift === 'All shifts' || String(q.shift) === shift) &&
    (paper === 'All papers' || paperKey(q) === paper) &&
    (match === 'All questions' || matchTags.get(q)?.has(match))
  ), [questions, year, course, topic, topicCode, section, shift, paper, match, matchTags])

  if (error) {
    return (
      <section className="panel">
        <h2>Question data unavailable</h2>
        <p>{error}</p>
        <p>Check ADMIN_DATABASE_URL in the Admin server env, then restart the Next.js app.</p>
      </section>
    )
  }
  if (!questions) return <section className="panel" role="status">Loading question data…</section>
  if (questions.length === 0) {
    return (
      <section className="panel">
        <h2>No papers in this bank yet</h2>
        <p>Neon has no imported questions for this bank yet.</p>
        <p className="muted">Import papers for this level, then reopen the bank.</p>
      </section>
    )
  }

  const papers = countBy(questions, paperKey)
  const topics = countBy(questions, topicLabel)
  const years = countBy(questions, q => String(q.year))
  const courses = countBy(questions, q => q.course)
  const sections = orderedSections(questions)
  const pages = Math.max(1, Math.ceil(filtered.length / 12))
  const pageNumber = Math.min(current, pages)
  const pageItems = filtered.slice((pageNumber - 1) * 12, pageNumber * 12)

  const topicsInScope = countBy(
    questions.filter(q => section === 'All sections' || sectionLabel(q) === section),
    topicLabel
  )

  const resetPage = () => { setCurrent(1); setSelected(null) }
  const reset = fn => event => { fn(event.target.value); resetPage() }

  const pickSection = name => {
    setSection(name)
    setTopic('All topics')
    setTopicCode(null)
    resetPage()
  }

  const openCatalog = () => {
    setYear('All years')
    setCourse('All courses')
    setSection('All sections')
    setTopic('All topics')
    setTopicCode(null)
    setShift('All shifts')
    setPaper('All papers')
    setMatch('All questions')
    resetPage()
    openPage('Papers & questions')
  }

  if (page === 'Overview') {
    return (
      <>
        <p className="lede">A clearer view of the papers, topics, and questions behind your preparation content.</p>
        <div className="preview-banner"><strong>{sourceBanner.title}</strong><span>{sourceBanner.detail}</span></div>
        <div className="metrics">
          <button type="button" onClick={openCatalog}><span>Question occurrences</span><strong>{questions.length.toLocaleString()}</strong><small>View all questions →</small></button>
          <button type="button" onClick={() => openPage('Exam papers')}><span>Exam papers</span><strong>{papers.length}</strong><small>View papers →</small></button>
          <button type="button" onClick={() => openPage('Topics & concepts')}><span>Source topics</span><strong>{topics.length}</strong><small>View topics →</small></button>
          <button type="button" onClick={() => openPage('Analytics')}><span>Years covered</span><strong>{years.length}</strong><small>View year breakdown →</small></button>
        </div>
        <section className="panel wide section-overview">
          <div className="panel-heading">
            <div>
              <h2>Browse by section</h2>
              <p>Open a paper part, then refine by topic.</p>
            </div>
            <button type="button" className="text-button" onClick={() => openPage('Repetition')}>Review repeated wording →</button>
          </div>
          <div className="topic-list">
            {sections.map(item => (
              <button key={item.name} type="button" onClick={() => { openCatalog(); setSection(item.name) }}>
                <span><span className="part-mark">Part {item.part}</span> {item.name}</span>
                <strong>{item.count} questions →</strong>
              </button>
            ))}
          </div>
        </section>
        <button type="button" className="insights-card" onClick={() => openPage('Topic insights')}>
          <span><strong>Topic insights</strong><small>See which sections and topics have the most questions, then compare possible repeats.</small></span>
          <span aria-hidden="true">Explore insights →</span>
        </button>
        <div className="overview-grid">
          <section className="panel wide">
            <div className="panel-heading">
              <div><h2>Explore the question bank</h2><p>Explore original questions, options and source tags.</p></div>
              <button type="button" className="text-button" onClick={openCatalog}>Open catalog →</button>
            </div>
            <button type="button" className="sample-question" onClick={() => { openCatalog(); setSelected(questions[0]) }}>
              <span>From the collection</span>
              <p>{questions[0]?.question_en}</p>
              <small>{paperKey(questions[0])} · {topicLabel(questions[0])} →</small>
            </button>
          </section>
          <section className="panel">
            <h2>By exam year</h2>
            {years.sort((a, b) => Number(b[0]) - Number(a[0])).map(([name, count]) => (
              <button type="button" className="count-row year-link" key={name} onClick={() => { openCatalog(); setYear(name) }}>
                <span>{name}</span><strong>{count} →</strong>
              </button>
            ))}
            <p className="small muted">Counts are question occurrences, not verified answers.</p>
          </section>
        </div>
      </>
    )
  }

  if (page === 'Topic insights') return <TopicInsights questions={questions} matches={matches} />

  if (page === 'Exam papers') {
    return (
      <>
        <p className="lede">Select a paper to see its questions.</p>
        <section className="panel wide">
          <h2>Exam papers</h2>
          <div className="topic-list">
            {papers.map(([name, count]) => (
              <button key={name} type="button" onClick={() => { openCatalog(); setPaper(name) }}>
                <span>{name}</span><strong>{count} questions →</strong>
              </button>
            ))}
          </div>
        </section>
      </>
    )
  }

  if (page === 'Topics & concepts') {
    return (
      <>
        <p className="lede">Sections map to paper parts. Topics sit under each section until taxonomy review.</p>
        <div className="preview-banner">
          <strong>Source labels</strong>
          <span>Pick a section, then a topic. Codes are shown as imported; similar names are not merged.</span>
        </div>
        <div className="map-stack">
          {sections.map(item => (
            <section className="panel wide map-section" key={item.name}>
              <div className="panel-heading">
                <div>
                  <p className="map-part">Part {item.part}</p>
                  <h2>{item.name}</h2>
                  <p>{item.count.toLocaleString()} questions · topics below open the catalog</p>
                </div>
                <button type="button" className="text-button" onClick={() => { openCatalog(); setSection(item.name) }}>
                  Open section →
                </button>
              </div>
              <div className="topic-list">
                {countBy(questions.filter(q => sectionLabel(q) === item.name), q => `${q.topic_code || '—'} · ${topicLabel(q)}`).map(([label, count]) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => {
                      setPaper('All papers')
                      setMatch('All questions')
                      setYear('All years')
                      setCourse('All courses')
                      setShift('All shifts')
                      setSection(item.name)
                      setTopicCode(label.slice(0, label.indexOf(' · ')))
                      setTopic(label.slice(label.indexOf(' · ') + 3))
                      setCurrent(1)
                      openPage('Papers & questions')
                    }}
                  >
                    <span>{label}</span>
                    <strong>{count} <span aria-hidden="true">→</span></strong>
                  </button>
                ))}
              </div>
            </section>
          ))}
        </div>
      </>
    )
  }

  if (page === 'Analytics') {
    return (
      <>
        <p className="lede">Understand the coverage of the supplied papers.</p>
        <div className="preview-banner"><strong>Source preview</strong><span>These counts describe the supplied records; they do not predict future exams.</span></div>
        <section className="panel wide">
          <h2>Occurrences by year</h2>
          <p>Counts reflect question occurrences. Topic names have not been normalized or curator-approved.</p>
          {years.map(([name, count]) => (
            <div className="bar-row" key={name}>
              <span>{name}</span>
              <div className="bar-track"><div style={{ width: `${(count / years[0][1]) * 100}%` }} /></div>
              <strong>{count}</strong>
            </div>
          ))}
        </section>
      </>
    )
  }

  if (page === 'Repetition') return <RepetitionPreview questions={questions} matches={matches} />

  const activeFilters = [
    section !== 'All sections' ? section : null,
    topic !== 'All topics' ? topic : null,
    year !== 'All years' ? year : null,
  ].filter(Boolean)

  return (
    <>
      <div className="catalog-head">
        <div>
          <p className="eyebrow">Papers & questions</p>
          <h1 className="catalog-title">Browse the bank</h1>
          <p className="lede catalog-lede">Section first, then topic. Stems stay short until you expand a row.</p>
        </div>
        <p className="catalog-count" aria-live="polite">
          <strong>{filtered.length.toLocaleString()}</strong>
          <span> matching</span>
        </p>
      </div>

      <div className="section-tabs" role="tablist" aria-label="Source section">
        <button
          type="button"
          role="tab"
          aria-selected={section === 'All sections'}
          className={section === 'All sections' ? 'chosen' : ''}
          onClick={() => pickSection('All sections')}
        >
          All sections
          <span>{questions.length.toLocaleString()}</span>
        </button>
        {sections.map(item => (
          <button
            key={item.name}
            type="button"
            role="tab"
            aria-selected={section === item.name}
            className={section === item.name ? 'chosen' : ''}
            onClick={() => pickSection(item.name)}
            title={item.name}
          >
            <em>Part {item.part}</em>
            {item.short}
            <span>{item.count.toLocaleString()}</span>
          </button>
        ))}
      </div>

      <div className="catalog-toolbar">
        <label className="catalog-field">
          <span>Topic</span>
          <select
            value={topic}
            onChange={event => {
              setTopicCode(null)
              setTopic(event.target.value)
              resetPage()
            }}
          >
            <option>All topics</option>
            {topicsInScope.map(([name]) => <option key={name}>{name}</option>)}
          </select>
        </label>
        <label className="catalog-field">
          <span>Year</span>
          <select value={year} onChange={reset(setYear)}>
            <option>All years</option>
            {years.sort((a, b) => Number(b[0]) - Number(a[0])).map(([name]) => <option key={name}>{name}</option>)}
          </select>
        </label>
        {(topic !== 'All topics' || year !== 'All years' || section !== 'All sections') && (
          <button
            type="button"
            className="catalog-clear"
            onClick={() => {
              setSection('All sections')
              setTopic('All topics')
              setTopicCode(null)
              setYear('All years')
              resetPage()
            }}
          >
            Clear
          </button>
        )}
      </div>

      {activeFilters.length > 0 && (
        <p className="catalog-crumbs">
          {activeFilters.map((label, index) => (
            <span key={`${label}-${index}`}>{index > 0 ? ' / ' : ''}{label}</span>
          ))}
          {topicCode !== null && topicCode !== '—' && <span className="muted"> · code {topicCode}</span>}
        </p>
      )}

      <section className="catalog-sheet" aria-label="Questions">
        {filtered.length === 0 ? (
          <p className="catalog-empty">No questions match this section and topic.</p>
        ) : (
          <div className="question-table" role="list">
            <div className="question-table-head" aria-hidden="true">
              <span>Sr</span>
              <span>Question</span>
              <span>Map</span>
              <span />
            </div>
            {pageItems.map((q, i) => {
              const srno = (pageNumber - 1) * 12 + i + 1
              const open = selected === q
              return (
                <details
                  key={`${q.id}-${srno}`}
                  className={`question-drop ${open ? 'open' : ''}`}
                  role="listitem"
                  open={open}
                  onToggle={event => {
                    if (event.currentTarget.open) setSelected(q)
                    else if (selected === q) setSelected(null)
                  }}
                >
                  <summary>
                    <span className="question-srno">{srno}</span>
                    <span className="question-short">
                      <strong>{shortStem(q.question_en)}</strong>
                      <span className="row-meta">Q{q.question_no} · {q.year} · {q.course} · Shift {q.shift}</span>
                    </span>
                    <span className="question-source row-meta">
                      <span className="map-chip">Part {q.part || '—'}</span>
                      {topicLabel(q)}
                    </span>
                  </summary>
                  <div className="question-drop-body">
                    <p className="question-full">{q.question_en}</p>
                    <ol className="options" type="A">
                      {['a', 'b', 'c', 'd'].map(option => (
                        <li className={q.answer?.toLowerCase() === option ? 'answer' : ''} key={option}>
                          {q[`option_${option}`] || 'Not supplied'}
                          {q.answer?.toLowerCase() === option && <small>Provided answer</small>}
                        </li>
                      ))}
                    </ol>
                    <dl>
                      <dt>Source ID</dt><dd>{q.id}</dd>
                      <dt>Section</dt><dd>Part {q.part} · {sectionLabel(q)}</dd>
                      <dt>Topic</dt><dd>{q.topic_code || '—'} · {topicLabel(q)}</dd>
                      <dt>Paper</dt><dd>{paperKey(q)}</dd>
                      <dt>Exam date</dt><dd>{q.exam_date || 'Not supplied'}</dd>
                    </dl>
                    {matchTags.get(q)?.size > 0 && (
                      <span className="question-tags">
                        {matchTags.get(q).has('exact') && <span>Matching stem · review</span>}
                        {matchTags.get(q).has('similar') && <span>Possible similar · review</span>}
                      </span>
                    )}
                    <p className="small muted">Source answer: {q.answer || 'Not supplied'} · Verify against the original paper.</p>
                  </div>
                </details>
              )
            })}
          </div>
        )}

        <div className="pagination">
          <button type="button" disabled={pageNumber === 1} onClick={() => setCurrent(pageNumber - 1)}>Previous</button>
          <span>Page {pageNumber} of {pages}</span>
          <button type="button" disabled={pageNumber === pages} onClick={() => setCurrent(pageNumber + 1)}>Next</button>
        </div>
      </section>
    </>
  )
}
