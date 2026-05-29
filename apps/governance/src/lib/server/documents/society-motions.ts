/**
 * Library Motions - Operations for motion documents
 */
import { readFileSync, readdirSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { db } from '../db.js';
import type { MotionDocument, MotionContent } from '@bfs/types';
import { 
	MOTION_STATUSES,
	getMotionFolder, 
	ensureMotionFolders, 
	getAllBodySlugs,
	getMotionLocationFromPath,
	moveMotion as moveMotionFile
} from './society-core.js';

/**
 * Load a motion from file (searches all bodies/statuses if not specified)
 */
export function loadMotion(slug: string, bodySlug?: string, status?: typeof MOTION_STATUSES[number]): MotionDocument | null {
	try {
		// If body and status are specified, look in that folder only
		if (bodySlug && status) {
			const filePath = join(getMotionFolder(bodySlug, status), `${slug}.json`);
			if (!existsSync(filePath)) {
				return null;
			}
			return readAndParseMotion(filePath);
		}

		// If only body is specified, search all status folders in that body
		if (bodySlug) {
			for (const statusFolder of MOTION_STATUSES) {
				const filePath = join(getMotionFolder(bodySlug, statusFolder), `${slug}.json`);
				if (existsSync(filePath)) {
					return readAndParseMotion(filePath);
				}
			}
			return null;
		}

		// Otherwise search all bodies and statuses
		const bodies = getAllBodySlugs();
		for (const body of bodies) {
			for (const statusFolder of MOTION_STATUSES) {
				const filePath = join(getMotionFolder(body, statusFolder), `${slug}.json`);
				if (existsSync(filePath)) {
					return readAndParseMotion(filePath);
				}
			}
		}

		return null;
	} catch (err) {
		console.error(`Error loading motion ${slug}:`, err);
		return null;
	}
}

/**
 * Read and parse a motion file
 */
function readAndParseMotion(filePath: string): MotionDocument {
	const content = readFileSync(filePath, 'utf-8');
	return JSON.parse(content) as MotionDocument;
}

/**
 * Save a motion to file in the appropriate body/status folder
 */
export function saveMotion(doc: MotionDocument, bodySlug: string, status: typeof MOTION_STATUSES[number] = 'inbox'): void {
	ensureMotionFolders(bodySlug);
	const folder = getMotionFolder(bodySlug, status);
	const filePath = join(folder, `${doc.slug}.json`);

	doc.updated_at = new Date().toISOString();
	
	writeFileSync(filePath, JSON.stringify(doc, null, 2), 'utf-8');
}

/**
 * Get motion by slug (searches all bodies/statuses)
 */
export function getMotionBySlug(slug: string): MotionDocument | null {
	return loadMotion(slug);
}

/**
 * Get motion by UUID (requires reading files to find it)
 */
export function getMotionByUuid(uuid: string): MotionDocument | null {
	const bodies = getAllBodySlugs();
	for (const body of bodies) {
		for (const status of MOTION_STATUSES) {
			const folder = getMotionFolder(body, status);
			if (!existsSync(folder)) continue;

			const files = readdirSync(folder).filter(f => f.endsWith('.json'));
			for (const file of files) {
				try {
					const motion = readAndParseMotion(join(folder, file));
					if (motion.uuid === uuid) {
						return motion;
					}
				} catch (err) {
					// Skip invalid files
				}
			}
		}
	}
	return null;
}

/**
 * List all motions for a body (optionally filtered by status)
 */
export function listMotions(bodySlug: string, status?: typeof MOTION_STATUSES[number]): MotionDocument[] {
	const motions: MotionDocument[] = [];

	const statusesToSearch = status ? [status] : MOTION_STATUSES;

	for (const statusFolder of statusesToSearch) {
		const folder = getMotionFolder(bodySlug, statusFolder);
		if (!existsSync(folder)) continue;

		try {
			const files = readdirSync(folder).filter(f => f.endsWith('.json'));
			for (const file of files) {
				const filePath = join(folder, file);
				try {
					const motion = readAndParseMotion(filePath);
					if (motion.type === 'motion') {
						motions.push(motion);
					}
				} catch (err) {
					console.error(`Error reading ${filePath}:`, err);
				}
			}
		} catch (err) {
			console.error(`Error listing motions in ${folder}:`, err);
		}
	}

	return motions;
}

/**
 * Create a new motion
 */
export function createMotion(input: {
	slug: string;
	title: string;
	provisions: Array<{ number: string; title?: string; text: string; reasoning?: string }>;
	introducer_uuid: string;
	owner_uuid: string;
	bodySlug: string;
	body_uuid?: string;
	body_name?: string;
	deliberation_rule_uuid?: string;
	deliberation_rule_name?: string;
	vote_rule_uuid?: string;
	vote_rule_name?: string;
	discussion_thread_uuid?: string;
	vote_session_uuid?: string;
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
			provisions: input.provisions,
			introducer_uuid: input.introducer_uuid,
			body_uuid: input.body_uuid,
			body_name: input.body_name,
			deliberation_rule_uuid: input.deliberation_rule_uuid,
			deliberation_rule_name: input.deliberation_rule_name,
			vote_rule_uuid: input.vote_rule_uuid,
			vote_rule_name: input.vote_rule_name,
			discussion_thread_uuid: input.discussion_thread_uuid,
			vote_session_uuid: input.vote_session_uuid,
		}
	};

	saveMotion(doc, input.bodySlug, 'inbox');
	return doc;
}

/**
 * Update motion content (must know body and current status)
 */
export function updateMotion(slug: string, bodySlug: string, currentStatus: typeof MOTION_STATUSES[number], updates: Partial<MotionContent>): MotionDocument {
	const doc = loadMotion(slug, bodySlug, currentStatus);
	if (!doc) throw new Error(`Motion not found: ${slug}`);

	// Merge updates into content
	Object.assign(doc.content, updates);

	saveMotion(doc, bodySlug, currentStatus);
	return doc;
}

/**
 * Update motion status (moves file between folders)
 */
export function updateMotionStatus(
	slug: string,
	bodySlug: string,
	fromStatus: typeof MOTION_STATUSES[number],
	toStatus: typeof MOTION_STATUSES[number],
	additionalUpdates: Partial<MotionContent> = {}
): MotionDocument {
	const doc = loadMotion(slug, bodySlug, fromStatus);
	if (!doc) throw new Error(`Motion not found: ${slug}`);

	// Apply any additional updates to content
	Object.assign(doc.content, additionalUpdates);

	// Save to new location
	saveMotion(doc, bodySlug, toStatus);

	// Delete from old location if different
	if (fromStatus !== toStatus) {
		const oldPath = join(getMotionFolder(bodySlug, fromStatus), `${slug}.json`);
		if (existsSync(oldPath)) {
			const { unlinkSync } = require('node:fs');
			unlinkSync(oldPath);
		}
	}

	return doc;
}
