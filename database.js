import 'dotenv/config';

import { neonm, noemConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle/neon-http';

const sql = neon(process.env.DATABASE_URL);
const db = drizzle(sql);

export { db, sql };
