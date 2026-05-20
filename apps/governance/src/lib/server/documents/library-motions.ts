/**
 * Library Motions - Operations for motion documents
 */
import { readFileSync, readdirSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { db } from '../db.js';
import type { MotionDocument, MotionContent } from './library-types.js';
import { MOTIONS_DIR, syncToDatabase } from './library-core.js';

/**
 * Load a motion from file
 */
export function loadMotion(slug: string): MotionDocument | null {
	try {
		const filePath = join(MOTIONS_DIR, `${slug}.json`);
		if (!existsSync(filePath)) {
			return null;
		}

		const content = readFileSync(filePath, 'utf-8');
		const doc = JSON.parse(content) as MotionDocument;
		return doc;
	} catch (err) {
		console.error(`Error loading motion ${slug}:`, err);
		return null;
	}
}

/**
 * Save a motion to file and sync to database
 */
function saveMotion(doc: MotionDocument): void {
	const filePath = join(MOTIONS_DIR, `${doc.slug}.json`);
	doc.updated_at = new Date().toISOString();
	
	writeFileSync(filePath, JSON.stringify(doc, null, 2), 'utf-8');
	syncToDatabase(doc);
}

/**
 * Get motion by slug
 */
export function getMotionBySlug(slug: string): MotionDocument | null {
	return loadMotion(slug);
}

/**
 * Get motion by UUID
 */
export function getMotionByUuid(uuid: string): MotionDocument | null {
	// Query library_item to find slug
	const row = db.prepare(
		'SELECT slug FROM library_item WHERE uuid = ? AND type = ?'
	).get(uuid, 'motion') as { slug: string } | undefined;
	
	if (!row) return null;
	return loadMotion(row.slug);
}

/**
 * List all motions
 */
export function listMotions(opts: {
	status?: string;
	owner_uuid?: string;
} = {}): MotionDocument[] {
	const motions: MotionDocument[] = [];

	if (!existsSync(MOTIONS_DIR)) return motions;

	try {
		const files = readdirSync(MOTIONS_DIR);
		for (const file of files) {
			if (file.endsWith('.json')) {
				const slug = file.replace('.json', '');
				const motion = loadMotion(slug);
				if (motion) {
					// Apply filters
					if (opts.status && motion.content.status !== opts.status) continue;
					if (opts.owner_uuid && motion.owner_uuid !== opts.owner_uuid) continue;
					motions.push(motion);
				}
			}
		}
	} catch (err) {
		console.error(`Error listing motions:`, err);
	}

	return motions;
}

/**
 * Create a new motion
 */
export function createMotion(input: {
	slug: string;
	title: string;
	body: string;
	introducer_uuid: string;
	owner_uuid: string;
	motion_number: string;
	deliberation_rule_uuid?: string;
	vote_rule_uuid?: string;
	reasoning?: string;
	thread_uuid?: string;
}): MotionDocument {
	const uuid = randomUUID();
	const now = new Date().toISOString();

	const doc: MotionDocument = {
		uuid,
		type: 'motion',
		slug: input.slug,
		document_id: null,
		version: 1,
		title: input.title,
		owner_uuid: input.owner_uuid,
		created_at: now,
		updated_at: now,
		content: {
			status: 'draft',
			body: input.body,
			introducer_uuid: input.introducer_uuid,
			motion_number: input.motion_number,
			deliberation_rule_uuid: input.deliberation_rule_uuid,
			vote_rule_uuid: input.vote_rule_uuid,
			reasoning: input.reasoning,
			body_uuid: input.owner_uuid,
			thread_uuid: input.thread_uuid,
		}
	};

	saveMotion(doc);
	return doc;
}

/**
 * Update motion content
 */
export function updateMotion(slug: string, updates: Partial<MotionContent>): MotionDocument {
	const doc = loadMotion(slug);
	if (!doc) throw new Error(`Motion not found: ${slug}`);

	// Merge updates into content
	Object.assign(doc.content, updates);

	saveMotion(doc);
	return doc;
}

/**
 * Update motion status and related timestamps
 */
export function updateMotionStatus(
	slug: string,
	status: string,
	metadata?: {
		introduced_at?: string;
		vote_opened_at?: string;
		vote_closed_at?: string;
		enacted_at?: string;
	}
): MotionDocument {
	const doc = loadMotion(slug);
	if (!doc) throw new Error(`Motion not found: ${slug}`);

	doc.content.status = status as any;
	if (metadata) {
		Object.assign(doc.content, metadata);
	}

	saveMotion(doc);
	return doc;
}
