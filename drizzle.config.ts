import type { Config } from 'drizzle-kit'
import { resolve } from 'path'

export default {
  schema: './src/main/database/schema/index.ts',
  out: './src/main/database/migrations',
  dialect: 'sqlite',
  dbCredentials: {
    url: './data/manuelmotos.db'
  },
  verbose: true,
  strict: true
} satisfies Config