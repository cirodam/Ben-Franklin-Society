/**
 * Society Core - Shared utilities and cross-type operations for society code documents
 */
import { readFileSync, readdirSync, writeFileSync, mkdirSync, existsSync, unlinkSync, renameSync } from 'node:fs';
import { join } from 'node:path';
import { db } from '../db.js';
import type { LibraryDocument, GoverningStatus, MotionStatus } from '@bfs/types';

// --- Constants ---

const DATA_DIR = join(process.cwd(), 'data');
const SOCIETY_CODE_BASE = join(DATA_DIR, 'society-code');
const MOTIONS_BASE = join(DATA_DIR, 'motions');

// Society Code folders (by status)
export const SOCIETY_CODE_FOLDERS = {
	inbox: join(SOCIETY_CODE_BASE, 'inbox'),
	enacted: join(SOCIETY_CODE_BASE, 'enacted'),
	repealed: join(SOCIETY_CODE_BASE, 'repealed'),
	sunsetted: join(SOCIETY_CODE_BASE, 'sunsetted'),
} as const;

// Motion folders (per body)
export const MOTION_STATUSES = ['inbox', 'queued', 'deliberating', 'rejected', 'adopted', 'enacted'] as const;

// Map old status values to new folder names for migration
export const GOVERNING_STATUS_MAP: Record<string, keyof typeof SOCIETY_CODE_FOLDERS> = {
	draft: 'inbox',
	enacted: 'enacted',
	repealed: 'repealed',
	sunsetted: 'sunsetted',
};

export const MOTION_STATUS_MAP: Record<string, typeof MOTION_STATUSES[number]> = {
	draft: 'inbox',
	introduced: 'queued',
	deliberation: 'deliberating',
	voting: 'deliberating', // Keep in deliberating during voting
	adopted: 'adopted',
	enacted: 'enacted',
	rejected: 'rejected',
	withdrawn: 'rejected', // Treat withdrawn as rejected
};

// Ensure directories exist
function ensureSocietyCodeFolders() {
	Object.values(SOCIETY_CODE_FOLDERS).forEach(dir => {
		if (!existsSync(dir)) {
			mkdirSync(dir, { recursive: true });
		}
	});
}

// Ensure motion folders exist for a body
export function ensureMotionFolders(bodySlug: string) {
	MOTION_STATUSES.forEach(status => {
		const dir = join(MOTIONS_BASE, bodySlug, status);
		if (!existsSync(dir)) {
			mkdirSync(dir, { recursive: true });
		}
	});
}

// Initialize folder structure
ensureSocietyCodeFolders();

// --- Utilities ---

/**
 * Get the society association UUID (internal use only)
 */
export function getSocietyUuid(): string | null {
	const result = db
		.prepare("SELECT uuid FROM association WHERE type = 'society' LIMIT 1")
		.get() as { uuid: string } | undefined;
	return result?.uuid ?? null;
}

/**
 * Get the folder path for a governing document based on status
 */
export function getGoverningFolder(status: keyof typeof SOCIETY_CODE_FOLDERS): string {
	return SOCIETY_CODE_FOLDERS[status];
}

/**
 * Get the folder path for a motion based on body and status
 */
export function getMotionFolder(bodySlug: string, status: typeof MOTION_STATUSES[number]): string {
	ensureMotionFolders(bodySlug);
	return join(MOTIONS_BASE, bodySlug, status);
}

/**
 * Extract status from a governing document file path
 */
export function getGoverningStatusFromPath(filePath: string): keyof typeof SOCIETY_CODE_FOLDERS | null {
	for (const [status, folder] of Object.entries(SOCIETY_CODE_FOLDERS)) {
		if (filePath.startsWith(folder)) {
			return status as keyof typeof SOCIETY_CODE_FOLDERS;
		}
	}
	return null;
}

/**
 * Extract body slug and status from a motion file path
 */
export function getMotionLocationFromPath(filePath: string): { bodySlug: string; status: typeof MOTION_STATUSES[number] } | null {
	const relativePath = filePath.replace(MOTIONS_BASE + '/', '');
	const parts = relativePath.split('/');
	if (parts.length >= 2) {
		const bodySlug = parts[0];
		const status = parts[1] as typeof MOTION_STATUSES[number];
		if (MOTION_STATUSES.includes(status)) {
			return { bodySlug, status };
		}
	}
	return null;
}

/**
 * List all body slugs that have motion folders
 */
export function getAllBodySlugs(): string[] {
	if (!existsSync(MOTIONS_BASE)) {
		return [];
	}
	return readdirSync(MOTIONS_BASE, { withFileTypes: true })
		.filter(dirent => dirent.isDirectory())
		.map(dirent => dirent.name);
}

/**
 * Move a governing document to a new status folder
 */
export function moveGoverningDocument(slug: string, fromStatus: keyof typeof SOCIETY_CODE_FOLDERS, toStatus: keyof typeof SOCIETY_CODE_FOLDERS): boolean {
	try {
		const fromPath = join(SOCIETY_CODE_FOLDERS[fromStatus], `${slug}.json`);
		const toPath = join(SOCIETY_CODE_FOLDERS[toStatus], `${slug}.json`);
		
		if (!existsSync(fromPath)) {
			console.error(`Document not found at ${fromPath}`);
			return false;
		}
		
		renameSync(fromPath, toPath);
		return true;
	} catch (err) {
		console.error(`Error moving governing document ${slug}:`, err);
		return false;
	}
}

/**
 * Move a motion to a new status folder (within same body)
 */
export function moveMotion(slug: string, bodySlug: string, fromStatus: typeof MOTION_STATUSES[number], toStatus: typeof MOTION_STATUSES[number]): boolean {
	try {
		const fromPath = join(getMotionFolder(bodySlug, fromStatus), `${slug}.json`);
		const toPath = join(getMotionFolder(bodySlug, toStatus), `${slug}.json`);
		
		if (!existsSync(fromPath)) {
			console.error(`Motion not found at ${fromPath}`);
			return false;
		}
		
		renameSync(fromPath, toPath);
		return true;
	} catch (err) {
		console.error(`Error moving motion ${slug}:`, err);
		return false;
	}
}

/**
 * Delete a document file
 */
export function deleteDocumentFile(filePath: string): boolean {
	try {
		if (existsSync(filePath)) {
			unlinkSync(filePath);
			return true;
		}
		return false;
	} catch (err) {
		console.error(`Error deleting file ${filePath}:`, err);
		return false;
	}
}
