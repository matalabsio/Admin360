import { neon } from '@neondatabase/serverless'

export function getSql() {
  const url = process.env.ADMIN_DATABASE_URL
  if (!url) {
    throw new Error('ADMIN_DATABASE_URL is not configured')
  }
  return neon(url)
}
