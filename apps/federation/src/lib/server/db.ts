import { openDatabase, type BfsDb } from '@bfs/db';
import { schema } from './schema.js';
import { env } from '$env/dynamic/private';

const path = env.DATABASE_PATH ?? './federation.sqlite';
export const db: BfsDb = openDatabase(path);
db.exec(schema);
