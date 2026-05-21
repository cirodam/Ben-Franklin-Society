import { randomUUID } from 'node:crypto';
import { writeFile, mkdir, unlink, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { db } from './db.js';

const ATTACHMENT_DIR = process.env.MAIL_ATTACHMENT_DIR || './data/attachments';
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB per file
const MAX_TOTAL_SIZE = 25 * 1024 * 1024; // 25MB per message

const ALLOWED_TYPES = [
	'application/pdf',
	'text/plain',
	'text/markdown',
	'text/csv',
	'image/png',
	'image/jpeg',
	'image/gif',
	'image/webp',
	'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // docx
	'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // xlsx
	'application/vnd.openxmlformats-officedocument.presentationml.presentation', // pptx
	'application/msword', // doc
	'application/vnd.ms-excel', // xls
	'application/vnd.ms-powerpoint', // ppt
];

export interface Attachment {
	uuid: string;
	message_uuid: string;
	filename: string;
	content_type: string;
	size_bytes: number;
	storage_path: string;
	uploaded_at: string;
}

export function getAttachments(message_uuid: string): Attachment[] {
	return db
		.prepare('SELECT * FROM attachment WHERE message_uuid = ? ORDER BY uploaded_at ASC')
		.all(message_uuid) as Attachment[];
}

export function getAttachment(uuid: string): Attachment | null {
	return db.prepare('SELECT * FROM attachment WHERE uuid = ?').get(uuid) as Attachment | null;
}

export async function saveAttachment(params: {
	message_uuid: string;
	filename: string;
	content_type: string;
	data: Buffer;
}): Promise<Attachment> {
	const { message_uuid, filename, content_type, data } = params;

	// Validate file size
	if (data.length > MAX_FILE_SIZE) {
		throw new Error(`File size exceeds maximum of ${MAX_FILE_SIZE / (1024 * 1024)}MB`);
	}

	// Validate content type
	if (!ALLOWED_TYPES.includes(content_type)) {
		throw new Error(`File type ${content_type} is not allowed`);
	}

	// Check total message attachment size
	const existing = getAttachments(message_uuid);
	const totalSize = existing.reduce((sum, att) => sum + att.size_bytes, 0) + data.length;
	if (totalSize > MAX_TOTAL_SIZE) {
		throw new Error(`Total attachment size exceeds maximum of ${MAX_TOTAL_SIZE / (1024 * 1024)}MB`);
	}

	const uuid = randomUUID();
	const now = new Date();
	const year = now.getFullYear();
	const month = String(now.getMonth() + 1).padStart(2, '0');
	const storage_path = join(String(year), month, uuid, filename);
	const full_path = join(ATTACHMENT_DIR, storage_path);

	// Ensure directory exists
	await mkdir(dirname(full_path), { recursive: true });

	// Write file
	await writeFile(full_path, data);

	// Save to database
	const uploaded_at = now.toISOString();
	db.prepare(
		`INSERT INTO attachment (uuid, message_uuid, filename, content_type, size_bytes, storage_path, uploaded_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
	).run(uuid, message_uuid, filename, content_type, data.length, storage_path, uploaded_at);

	return getAttachment(uuid)!;
}

export async function deleteAttachment(uuid: string): Promise<void> {
	const attachment = getAttachment(uuid);
	if (!attachment) return;

	const full_path = join(ATTACHMENT_DIR, attachment.storage_path);

	// Delete file if it exists
	if (existsSync(full_path)) {
		await unlink(full_path);
	}

	// Remove from database
	db.prepare('DELETE FROM attachment WHERE uuid = ?').run(uuid);
}

export async function readAttachment(uuid: string): Promise<Buffer | null> {
	const attachment = getAttachment(uuid);
	if (!attachment) return null;

	const full_path = join(ATTACHMENT_DIR, attachment.storage_path);

	if (!existsSync(full_path)) {
		return null;
	}

	return readFile(full_path);
}

export function canAccessAttachment(
	attachment_uuid: string,
	principal_uuid: string
): boolean {
	const result = db
		.prepare(
			`SELECT 1 FROM attachment a
       JOIN message m ON a.message_uuid = m.uuid
       LEFT JOIN message_recipient mr ON m.uuid = mr.message_uuid
       WHERE a.uuid = ? 
       AND (m.from_principal_uuid = ? OR mr.recipient_principal_uuid = ?)`
		)
		.get(attachment_uuid, principal_uuid, principal_uuid);

	return !!result;
}
