import path from 'path'
import { defineConfig } from 'prisma/config'

export default defineConfig({
  datasource: {
    url: process.env.DATABASE_URL ?? `file:${path.join(process.cwd(), 'prisma/forma.db')}`,
  },
})
