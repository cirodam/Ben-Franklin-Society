import { db } from './db.js';
import { getUserAssociations, isAssociationMember } from './associations.js';

export interface Bucket {
	id: number;
	bucket_key: string;
	owner_type: 'user' | 'association';
	owner_id: string;
	created_at: string;
	name?: string; // Display name for UI (user's name or association name)
}

export function ensureBucket(ownerType: 'user' | 'association', ownerId: string): Bucket {
	const bucketKey = `${ownerType}-${ownerId}`;
	
	const existing = db
		.prepare('SELECT * FROM buckets WHERE owner_type = ? AND owner_id = ?')
		.get(ownerType, ownerId) as Bucket | undefined;

	if (existing) {
		return existing;
	}

	console.log(`[library/buckets] Creating ${ownerType} bucket for:`, ownerId);

	const now = new Date().toISOString();
	const result = db
		.prepare(
			'INSERT INTO buckets (bucket_key, owner_type, owner_id, created_at) VALUES (?, ?, ?, ?)'
		)
		.run(bucketKey, ownerType, ownerId, now);

	return {
		id: result.lastInsertRowid as number,
		bucket_key: bucketKey,
		owner_type: ownerType,
		owner_id: ownerId,
		created_at: now
	};
}

export function getBucket(ownerType: 'user' | 'association', ownerId: string): Bucket | null {
	const bucket = db
		.prepare('SELECT * FROM buckets WHERE owner_type = ? AND owner_id = ?')
		.get(ownerType, ownerId) as Bucket | undefined;

	return bucket ?? null;
}

export function getBucketById(bucketId: number): Bucket | null {
	const bucket = db
		.prepare('SELECT * FROM buckets WHERE id = ?')
		.get(bucketId) as Bucket | undefined;

	return bucket ?? null;
}

export function getUserBuckets(userUuid: string): Bucket[] {
	const buckets: Bucket[] = [];

	// User's personal bucket
	const userBucket = ensureBucket('user', userUuid);
	buckets.push({
		...userBucket,
		name: 'My Files'
	});

	// Association buckets (for associations user is a member of)
	const associations = getUserAssociations(userUuid);
	for (const association of associations) {
		const associationBucket = ensureBucket('association', association.handle);
		buckets.push({
			...associationBucket,
			name: association.name
		});
	}

	return buckets;
}

/**
 * Check if a user has access to a bucket
 */
export function canAccessBucket(userUuid: string, bucket: Bucket): boolean {
	if (bucket.owner_type === 'user') {
		return bucket.owner_id === userUuid;
	} else if (bucket.owner_type === 'association') {
		return isAssociationMember(userUuid, bucket.owner_id);
	}
	return false;
}
