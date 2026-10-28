export function matchesBank(trackCode, bankId) {
  const code = trackCode || ''
  if (bankId === 'ts-ug') return code === 'TS-LLB3' || code === 'TS-LLB5'
  if (bankId === 'ap-ug') return code === 'AP-LLB3' || code === 'AP-LLB5'
  if (bankId === 'ts-pg') return code === 'TS-PG'
  if (bankId === 'ap-pg') return code === 'AP-PG'
  return false
}
