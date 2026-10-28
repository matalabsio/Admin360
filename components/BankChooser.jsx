'use client'

import { useEffect, useState } from 'react'

export default function BankChooser({ onSelect, onLogout }) {
  const [banks, setBanks] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    fetch('/api/admin/preview/banks', { credentials: 'same-origin', signal: controller.signal })
      .then(async response => {
        const result = await response.json()
        if (!response.ok) throw new Error(result.error || 'Unable to load question banks')
        setBanks(result.banks)
      })
      .catch(err => {
        if (err.name !== 'AbortError') setError(err.message)
      })
    return () => controller.abort()
  }, [])

  return (
    <main className="bank-screen">
      <div className="bank-shell">
        <header className="bank-top">
          <div className="bank-brand-block">
            <p className="brand">CHATTAM <span>360</span></p>
            <p className="bank-scope">Curator workspace · TS and AP entrance banks</p>
          </div>
          <button type="button" className="ghost" onClick={onLogout}>Sign out</button>
        </header>

        <section className="bank-panel">
          <div className="bank-intro">
            <p className="eyebrow">Question banks</p>
            <h1>Choose a bank to curate</h1>
            <p className="lede">Open the imported Neon catalog for one exam level. Counts come from papers already in the database.</p>
          </div>

          {error && <p className="error" role="alert">{error}</p>}
          {!banks && !error && <p className="muted bank-status" role="status">Loading banks from Neon…</p>}

          {banks && (
            <div className="bank-grid" role="list">
              {banks.map(bank => (
                <article key={bank.id} className={`bank-card ${bank.available ? '' : 'is-empty'}`} role="listitem">
                  <div className="bank-card-head">
                    <h2>{bank.label}</h2>
                    <span className={`bank-pill ${bank.available ? 'ready' : 'empty'}`}>
                      {bank.available ? 'Ready' : 'No papers yet'}
                    </span>
                  </div>
                  <p className="bank-exam">{bank.exam}</p>
                  <p className="muted bank-copy">{bank.description}</p>
                  <dl className="bank-stats">
                    <div>
                      <dt>Questions</dt>
                      <dd>{bank.questions.toLocaleString()}</dd>
                    </div>
                    <div>
                      <dt>Papers</dt>
                      <dd>{bank.papers.toLocaleString()}</dd>
                    </div>
                    <div>
                      <dt>Years</dt>
                      <dd className="bank-years">{bank.years.length ? bank.years.join(', ') : '—'}</dd>
                    </div>
                  </dl>
                  {bank.tracks.length > 0 && (
                    <p className="bank-tracks">Tracks · {bank.tracks.join(' · ')}</p>
                  )}
                  <button
                    type="button"
                    className="primary"
                    disabled={!bank.available}
                    onClick={() => onSelect(bank.id)}
                  >
                    {bank.available ? `Open ${bank.label}` : 'Waiting on import'}
                  </button>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
