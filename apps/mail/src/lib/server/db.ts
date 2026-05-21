import { openDatabase, type BfsDb } from '@bfs/db';
import { schema, migrations } from './schema.js';

const path = process.env.DATABASE_PATH ?? './mail.sqlite';

export const db: BfsDb = openDatabase(path);

db.exec(schema);

// Run migrations (adding columns that may be missing)
// These will fail silently if columns already exist
for (const migration of migrations) {
	try {
		db.exec(migration);
	} catch (err: any) {
		// Ignore "duplicate column" errors, but log others
		if (!err.message?.includes('duplicate column')) {
			console.error('Migration error:', err.message);
		}
	}
}
