import { openDatabase, type BfsDb } from '@bfs/db';
import { schema } from './schema.js';
import { env } from '$env/dynamic/private';

let _db: BfsDb | null = null;

function initDb(): BfsDb {
	if (!_db) {
		const path = env.DATABASE_PATH ?? './federation.sqlite';
		_db = openDatabase(path);
		_db.exec(schema);
	}
	return _db;
}

export const db = new Proxy({} as BfsDb, {
	get(target, prop) {
		const database = initDb();
		const value = database[prop as keyof BfsDb];
		return typeof value === 'function' ? value.bind(database) : value;
	}
});
