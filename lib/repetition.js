// Text comparisons suggest candidates only; no question or answer is changed.
export const normalizeText = text => (text || '').normalize('NFKC').toLocaleLowerCase('en').replace(/[?.,;:!"'’“”]+/gu, ' ').replace(/\s+/gu, ' ').trim()

// Soft key drops only articles so OCR near-duplicates group without changing meaning.
export const softExactKey = text => normalizeText(text)
  .replace(/\b(the|a|an)\b/gu, ' ')
  .replace(/\s+/gu, ' ')
  .trim()

const words = text => new Set(normalizeText(text).match(/[\p{L}\p{N}]+/gu) || [])
const samePaper = (a, b) => a.exam === b.exam && a.course === b.course && String(a.year) === String(b.year) && String(a.shift) === String(b.shift)
const sectionOf = q => q.part_name || q.part || ''
const answersConflict = items => new Set(items.map(q => String(q.answer || '').toUpperCase()).filter(Boolean)).size > 1

const unionFind = size => {
  const parent = Array.from({ length: size }, (_, i) => i)
  const find = i => (parent[i] === i ? i : (parent[i] = find(parent[i])))
  const unite = (a, b) => {
    const rootA = find(a), rootB = find(b)
    if (rootA !== rootB) parent[rootB] = rootA
  }
  return { find, unite }
}

export function findRepetitions(questions) {
  const normalized = questions.map(q => normalizeText(q.question_en))
  const softKeys = questions.map(q => softExactKey(q.question_en))
  const tokens = questions.map(q => words(q.question_en))

  const exactBuckets = new Map()
  questions.forEach((q, i) => {
    const key = softKeys[i]
    if (!key) return
    const list = exactBuckets.get(key) || []
    list.push(q)
    exactBuckets.set(key, list)
  })
  const exact = [...exactBuckets.values()]
    .filter(group => group.length > 1)
    .map(items => ({ kind: 'exact', items, answerConflict: answersConflict(items) }))
    .sort((a, b) => b.items.length - a.items.length)

  const { find, unite } = unionFind(questions.length)
  const pairScore = new Map()
  const linked = new Set()

  for (let i = 0; i < questions.length; i++) {
    if (tokens[i].size < 5) continue
    for (let j = i + 1; j < questions.length; j++) {
      if (tokens[j].size < 5) continue
      if (sectionOf(questions[i]) !== sectionOf(questions[j])) continue
      if (samePaper(questions[i], questions[j])) continue
      // Exact / near-exact pairs are already listed in the exact tab.
      if (!softKeys[i] || softKeys[i] === softKeys[j]) continue
      const small = tokens[i].size < tokens[j].size ? tokens[i] : tokens[j]
      const large = small === tokens[i] ? tokens[j] : tokens[i]
      if (small.size / large.size < 0.7) continue
      let intersection = 0
      for (const token of small) if (large.has(token)) intersection++
      const score = intersection / (tokens[i].size + tokens[j].size - intersection)
      if (score < 0.7) continue
      unite(i, j)
      linked.add(i)
      linked.add(j)
      const edge = i < j ? `${i}:${j}` : `${j}:${i}`
      pairScore.set(edge, Math.max(pairScore.get(edge) || 0, score))
    }
  }

  const clusters = new Map()
  for (const i of linked) {
    const root = find(i)
    if (!clusters.has(root)) clusters.set(root, [])
    clusters.get(root).push(i)
  }

  const similar = [...clusters.values()]
    .filter(indexes => indexes.length > 1)
    .map(indexes => {
      let best = 0
      for (let a = 0; a < indexes.length; a++) {
        for (let b = a + 1; b < indexes.length; b++) {
          const i = indexes[a], j = indexes[b]
          const edge = i < j ? `${i}:${j}` : `${j}:${i}`
          best = Math.max(best, pairScore.get(edge) || 0)
        }
      }
      const items = indexes.map(i => questions[i])
      return { kind: 'similar', items, score: best, answerConflict: answersConflict(items) }
    })
    .sort((a, b) => b.score - a.score || b.items.length - a.items.length)

  return { exact, similar }
}
