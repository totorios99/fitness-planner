const { execSync } = require('child_process')
const { mkdirSync } = require('fs')
const { dirname } = require('path')

const dbUrl = process.env.DATABASE_URL
if (dbUrl && dbUrl.startsWith('file:')) {
  const dbPath = dbUrl.slice(5)
  mkdirSync(dirname(dbPath), { recursive: true })
}

// Call the Prisma CLI directly (no npx — the .bin symlink isn't in the slim
// runtime image, and there's no network to fetch it).
const prismaCli = require.resolve('prisma/build/index.js')
console.log('Running Prisma db push...')
execSync(`node "${prismaCli}" db push`, { stdio: 'inherit' })
console.log('Database ready.')
