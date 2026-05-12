import { openDatabase, type BfsDb } from '@bfs/db';
import { schema } from './schema.js';

const path = process.env.DATABASE_PATH ?? './marketplace.sqlite';

export const db: BfsDb = openDatabase(path);

db.exec(schema);
