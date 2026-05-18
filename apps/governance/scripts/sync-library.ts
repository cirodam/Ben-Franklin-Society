/**
 * Sync all library files to the database
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import Database from 'better-sqlite3';

const dbPath = process.env.DATABASE_PATH || './dev.sqlite';
const db = new Database(dbPath);

const LIBRARY_DIR = join(process.cwd(), 'data', 'library');
const GOVERNING_DIR = join(LIBRARY_DIR, 'governing');
const MOTIONS_DIR = join(LIBRARY_DIR, 'motions');
const PROSE_DIR = join(LIBRARY_DIR, 'prose');
const CONTRACTS_DIR = join(LIBRARY_DIR, 'contracts');

interface BaseDocument {
	uuid: string;
	type: string;
	slug: string;
	title: string;
	owner_uuid: string;
	created_at: string;
	updated_at: string;
	content: any;
}

function syncToDatabase(doc: BaseDocument): void {
	// Extract metadata based on document type
	let metadata: any = {};
	if (doc.type === 'governing' && doc.content) {
		metadata = {
			status: doc.content.status,
			seniority: doc.content.seniority,
		};
	} else if (doc.type === 'motion' && doc.content) {
		metadata = {
			status: doc.content.status,
			motion_number: doc.content.motion_number,
		};
	} else if (doc.type === 'prose' && doc.content) {
		metadata = {
			status: doc.content.status,
			paragraph_count: doc.content.paragraphs?.length || 0,
		};
	} else if (doc.type === 'contract' && doc.content) {
		metadata = {
			status: doc.content.status,
			party_a_name: doc.content.party_a?.principal_name,
			party_b_name: doc.content.party_b?.principal_name,
		};
	}

	const metadataJson = JSON.stringify(metadata);
	const dirName = doc.type === 'governing' ? 'governing' : doc.type === 'motion' ? 'motions' : doc.type === 'contract' ? 'contracts' : 'prose';
	const filePath = `${dirName}/${doc.slug}.json`;

	const existing = db
		.prepare('SELECT uuid FROM library_item WHERE slug = ?')
		.get(doc.slug) as { uuid: string } | undefined;

	if (existing) {
		console.log(`  Updating ${doc.slug}...`);
		db.prepare(
			`UPDATE library_item 
			 SET type = ?, title = ?, owner_uuid = ?, updated_at = ?, file_path = ?, metadata_json = ?
			 WHERE slug = ?`
		).run(doc.type, doc.title, doc.owner_uuid, doc.updated_at, filePath, metadataJson, doc.slug);
	} else {
		console.log(`  Inserting ${doc.slug}...`);
		db.prepare(
			`INSERT INTO library_item (uuid, type, slug, title, owner_uuid, created_at, updated_at, file_path, metadata_json)
			 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
		).run(
			doc.uuid,
			doc.type,
			doc.slug,
			doc.title,
			doc.owner_uuid,
			doc.created_at,
			doc.updated_at,
			filePath,
			metadataJson
		);
	}
}

function syncDirectory(dir: string, type: string): number {
	let count = 0;
	try {
		const files = readdirSync(dir);
		for (const file of files) {
			if (file.endsWith('.json')) {
				const filePath = join(dir, file);
				const content = readFileSync(filePath, 'utf-8');
				const doc = JSON.parse(content) as BaseDocument;
				
				// Set type if not present
				if (!doc.type) {
					doc.type = type;
				}
				
				syncToDatabase(doc);
				count++;
			}
		}
	} catch (err) {
		console.error(`Error syncing directory ${dir}:`, err);
	}
	return count;
}

console.log('Syncing library files to database...\n');

console.log('Syncing governing documents...');
const governingCount = syncDirectory(GOVERNING_DIR, 'governing');
console.log(`Synced ${governingCount} governing documents\n`);

console.log('Syncing motions...');
const motionsCount = syncDirectory(MOTIONS_DIR, 'motion');
console.log(`Synced ${motionsCount} motions\n`);

console.log('Syncing prose documents...');
const proseCount = syncDirectory(PROSE_DIR, 'prose');
console.log(`Synced ${proseCount} prose documents\n`);

console.log('Syncing contracts...');
const contractsCount = syncDirectory(CONTRACTS_DIR, 'contract');
console.log(`Synced ${contractsCount} contracts\n`);

console.log(`Total: ${governingCount + motionsCount + proseCount + contractsCount} documents synced`);
