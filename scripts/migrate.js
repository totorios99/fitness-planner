const { execSync } = require('child_process')
const { mkdirSync } = require('fs')
const { dirname } = require('path')

const dbUrl = process.env.DATABASE_URL
if (dbUrl && dbUrl.startsWith('file:')) {
  const dbPath = dbUrl.slice(5)
  mkdirSync(dirname(dbPath), { recursive: true })
}

console.log('Running Prisma db push...')
execSync('npx prisma db push --skip-generate', { stdio: 'inherit' })
console.log('Database ready.')
