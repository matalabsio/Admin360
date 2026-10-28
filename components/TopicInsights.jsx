'use client'

import { useMemo, useState } from 'react'

const sectionName = q => q.part_name || 'Unclassified'
const topicKey = q => `${q.topic_code || '—'}\u0000${q.topic || 'Unclassified'}`
const paperKey = q => `${q.exam}|${q.course}|${q.year}|${q.shift}`

export default function TopicInsights({ questions, matches }) {
  const [section, setSection] = useState('All sections')
  const [selection, setSelection] = useState('')
  const [sort, setSort] = useState('volume')
  const sections = useMemo(() => {
    const groups = new Map()
    for (const q of questions) {
      const name = sectionName(q)
      if (!groups.has(name)) groups.set(name, [])
      groups.get(name).push(q)
    }
    return [...groups].sort((a,b) => b[1].length - a[1].length)
  }, [questions])
  const topics = useMemo(() => {
    const groups = new Map()
    for (const q of questions) {
      if (section !== 'All sections' && sectionName(q) !== section) continue
      const key = `${sectionName(q)}\u0000${topicKey(q)}`
      if (!groups.has(key)) groups.set(key, { key, section: sectionName(q), name: q.topic || 'Unclassified', code: String(q.topic_code || '—'), questions: [] })
      groups.get(key).questions.push(q)
    }
    const allMatches = [...matches.exact, ...matches.similar]
    for (const item of groups.values()) { const members = new Set(item.questions); item.candidates = allMatches.filter(group => group.items.some(q => members.has(q))).length }
    return [...groups.values()].sort((a,b) => sort === 'matches' ? b.candidates - a.candidates || b.questions.length - a.questions.length || a.name.localeCompare(b.name) : b.questions.length - a.questions.length || a.name.localeCompare(b.name))
  }, [questions, section, matches, sort])
  const selected = topics.find(t => t.key === selection) || topics[0]
  const related = useMemo(() => {
    if (!selected) return []
    const members = new Set(selected.questions)
    return [...matches.exact, ...matches.similar].filter(group => group.items.some(q => members.has(q))).sort((a,b) => a.kind === b.kind ? (b.score || 1) - (a.score || 1) : a.kind === 'exact' ? -1 : 1)
  }, [selected, matches])
  return <><p className="lede">Find the busiest sections, explore their source topics, and inspect possible repeated wording.</p><div className="preview-banner"><strong>Unreviewed source data</strong><span>Same-topic questions are not necessarily repetitions. Similarity uses word overlap, so paraphrases may be missed and suggested pairs need human review.</span></div><div className="insight-sections" aria-label="Filter by source section"><button className={section === 'All sections' ? 'chosen' : ''} onClick={() => { setSection('All sections'); setSelection('') }}>All sections <strong>{questions.length}</strong></button>{sections.map(([name, items]) => <button key={name} className={section === name ? 'chosen' : ''} onClick={() => { setSection(name); setSelection('') }}><span>{name}</span><strong>{items.length}</strong></button>)}</div><div className="insight-layout"><section className="panel wide insight-list"><h2>Rank source topics</h2><p>{topics.length} source topics</p><label className="insight-sort">Sort by<select value={sort} onChange={e => setSort(e.target.value)}><option value="volume">Most questions</option><option value="matches">Most text-match candidates</option></select></label>{topics.map((item,index) => <button key={item.key} className={`insight-topic ${selected?.key === item.key ? 'selected' : ''}`} aria-pressed={selected?.key === item.key} onClick={() => setSelection(item.key)}><span className="insight-rank">{index+1}</span><span><strong>{item.name}</strong><small>{item.section} · {item.code} · {item.candidates} candidate groups</small></span><b>{item.questions.length}</b></button>)}</section><section className="panel wide insight-detail"><h2>{selected?.name || 'No topics'}</h2>{selected && <><p>{selected.section} · {selected.questions.length} question occurrences across {new Set(selected.questions.map(paperKey)).size} papers</p><div className="insight-note"><strong>{related.length} text-based match {related.length === 1 ? 'group' : 'groups'}</strong><span>Matching stems and possible similarities involving this topic. Other occurrences may be tagged under another source topic.</span></div><h3>Compare questions</h3>{related.length === 0 ? <p>No text-based candidates were found for this topic. Browse its source questions to review related concepts manually.</p> : related.map((group,index) => <article className="match-group" key={index}><div className="match-heading"><strong>{group.kind === 'exact' ? 'Matching stem' : 'Possible similar wording'}</strong><span>{group.kind === 'exact' ? 'Compare options and answers' : `${Math.round(group.score * 100)}% word overlap · review`}</span></div>{group.items.map((q,i) => <div className="match-occurrence" key={`${q.id}-${i}`}><div className="row-meta">{q.exam} · {q.course} · {q.year} · Shift {q.shift} · Q{q.question_no}</div><p>{q.question_en}</p><div className="row-meta">{q.part_name} · {q.topic} · Provided answer: {q.answer || 'Not supplied'}{q.answer_text ? ` · ${q.answer_text}` : ''}</div><details className="match-options"><summary>View supplied options</summary><ol type="A">{['a','b','c','d'].map(option => <li key={option}>{q[`option_${option}`] || 'Not supplied'}</li>)}</ol></details></div>)}</article>)}<details className="source-questions"><summary>Browse all {selected.questions.length} questions in this topic</summary>{selected.questions.map((q,i) => <div className="match-occurrence" key={`${q.id}-${i}`}><div className="row-meta">{q.year} · {q.course} · Shift {q.shift} · Q{q.question_no}</div><p>{q.question_en}</p><div className="row-meta">Provided answer: {q.answer || 'Not supplied'}{q.answer_text ? ` · ${q.answer_text}` : ''}</div></div>)}</details></>}</section></div></>
}
