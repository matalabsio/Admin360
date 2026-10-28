'use client'

import { useEffect, useState } from 'react'
import QuestionPreview from './QuestionPreview'
import { auditConvertedFile, validatePack } from '@/lib/clientAudit'

const pages = ['Overview', 'Papers & questions', 'Import & review', 'Topics & concepts', 'Topic insights', 'Repetition', 'Analytics']

async function api(path, options = {}) {
  const response = await fetch(`/api/admin${path}`, { credentials: 'same-origin', ...options })
  const data = response.status === 204 ? {} : await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.error || 'The service is unavailable. Please try again.')
  return data
}

export default function AdminApp() {
  const [session, setSession] = useState('loading')
  const [email, setEmail] = useState('director@matalabs.io')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [page, setPage] = useState('Overview')
  const [file, setFile] = useState(null)
  const [report, setReport] = useState(null)
  const [format, setFormat] = useState('csv')

  useEffect(() => {
    api('/session')
      .then(data => setSession(data.authenticated ? 'signed-in' : 'signed-out'))
      .catch(() => {
        setError('Cannot reach the admin API. Check Next.js is running with ADMIN_* env vars.')
        setSession('signed-out')
      })
  }, [])

  async function login(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      await api('/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      setPassword('')
      setSession('signed-in')
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function logout() {
    setBusy(true)
    setError('')
    try {
      await api('/logout', { method: 'POST' })
      setSession('signed-out')
      setReport(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function validate(event) {
    event.preventDefault()
    if (!file) return
    setBusy(true)
    setError('')
    setReport(null)
    try {
      if (file.size > 8 * 1024 * 1024) throw new Error('Choose a file smaller than 8 MiB.')
      const text = await file.text()
      if (format === 'pack') {
        setReport({ kind: 'pack', ...validatePack(text) })
      } else {
        setReport({ kind: 'audit', ...auditConvertedFile(text, format) })
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  if (session === 'loading') return <main className="center"><p role="status">Checking your session…</p></main>

  if (session === 'signed-out') {
    return (
      <main className="center">
        <form className="login" onSubmit={login}>
          <p className="brand">CHATTAM <span>360</span></p>
          <p className="eyebrow">Admin workspace</p>
          <h1>Sign in to curate</h1>
          <p className="muted">Manage question sources and review content for law entrance preparation.</p>
          <label>Email<input type="email" autoComplete="username" value={email} onChange={e => setEmail(e.target.value)} required /></label>
          <label>Password<input type="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} required /></label>
          {error && <p className="error" role="alert">{error}</p>}
          <button className="primary" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
          <p className="muted small">Server-backed Neon catalog · email/password auth</p>
        </form>
      </main>
    )
  }

  return (
    <div className="shell">
      <aside>
        <div className="brand">CHATTAM <span>360</span><small>Admin</small></div>
        <nav aria-label="Admin navigation">
          {pages.map(item => (
            <button key={item} className={page === item ? 'active' : ''} aria-current={page === item ? 'page' : undefined} onClick={() => { setPage(item); setError('') }}>
              {item}
            </button>
          ))}
        </nav>
        <button className="logout" onClick={logout} disabled={busy}>Sign out</button>
      </aside>
      <main className="workspace">
        <header>
          <span>Question intelligence</span>
          <span>Director · Neon catalog</span>
        </header>
        <div className="content">
          <p className="eyebrow">Curator workspace</p>
          <h1>{page}</h1>
          {error && <p className="error" role="alert">{error}</p>}
          {page !== 'Import & review' ? (
            <QuestionPreview page={page} openPage={setPage} />
          ) : (
            <>
              <p className="muted">Audit converted question data or validate an existing format-1 pack in the browser. This does not write to Neon.</p>
              <form className="panel" onSubmit={validate}>
                <h2>Check a source file</h2>
                <p>Validation does not write to the database or verify answers against the original papers.</p>
                <label>
                  File format
                  <select value={format} onChange={e => { setFormat(e.target.value); setReport(null) }}>
                    <option value="csv">Converted CSV</option>
                    <option value="json">Converted JSON</option>
                    <option value="pack">Prepared format-1 JSON pack</option>
                  </select>
                </label>
                <label>
                  Question file
                  <input type="file" accept={format === 'csv' ? '.csv,text/csv' : '.json,application/json'} onChange={e => { setFile(e.target.files?.[0] || null); setReport(null) }} required />
                </label>
                <button className="primary" disabled={busy || !file}>{busy ? 'Checking…' : 'Check file'}</button>
                {report && (
                  <div className="success" role="status">
                    {report.kind === 'pack' ? (
                      <>
                        <strong>Pack is valid</strong>
                        <p>{report.questions} questions · {report.track} · {report.year} · {report.session}</p>
                      </>
                    ) : (
                      <>
                        <strong>Audit complete</strong>
                        <p>{report.total} rows · {report.accepted} accepted · {report.rejected} rejected · {report.duplicate} duplicate rows · {report.warnings} warnings</p>
                        <p>Identified papers: {report.papers.join('; ') || 'None'}</p>
                        {report.issues.length > 0 && (
                          <details>
                            <summary>Review {report.issues.length} issues</summary>
                            <ul>{report.issues.map((issue, index) => <li key={index}>Row {issue.row}: {issue.message}</li>)}</ul>
                          </details>
                        )}
                      </>
                    )}
                    <p>No records were imported.</p>
                  </div>
                )}
              </form>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
