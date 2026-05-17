import { randomUUID } from 'node:crypto';
import { db } from './db.js';
import { getVoteRuleByUuid, evaluateTally } from './vote_rules.js';
import * as library from './library.js';

// --- Types ---

export type MotionStatus =
	| 'draft'
	| 'introduced'
	| 'deliberation' // Combined deliberation and voting phase
	| 'enacted'
	| 'rejected'
	| 'withdrawn';

export type VoteChoice = 'aye' | 'nay' | 'abstain';

export interface Motion {
	uuid: string;
	slug: string;
	motion_number: number;
	title: string;
	type: string; // e.g., 'motion', 'governing_document', etc.
	seniority: number | null; // null for regular motions, 1-6 for governing documents
	owner_uuid: string; // the association that owns this (typically same as body_uuid)
	body: string;
	reasoning: string | null;
	introduced_by_uuid: string;
	body_uuid: string; // every motion belongs to a body; use the community association for society-wide motions
	deliberation_rule_uuid: string | null;
	vote_rule_uuid: string | null;
	status: MotionStatus;
	clerk_notes: string | null;
	parliamentarian_notes: string | null;
	created_at: string;
	adopted_at: string | null; // when enacted
	adopted_by_motion_uuid: string | null; // self-reference for amendments
	repealed_at: string | null;
	repealed_by_motion_uuid: string | null;
	deliberation_opened_at: string | null;
	enacted_at: string | null;
	resolved_at: string | null;
}

export interface VoteTally {
	motion_uuid: string;
	eligible_count: number;
	aye_count: number;
	nay_count: number;
	abstain_count: number;
	opened_at: string;
	closed_at: string | null;
}

export interface MotionComment {
	uuid: string;
	motion_uuid: string;
	author_uuid: string;
	body: string;
	created_at: string;
	edited_at: string | null;
	deleted_at: string | null;
}

// --- Helpers ---

function now(): string {
	return new Date().toISOString();
}

const ALLOWED_TRANSITIONS: Partial<Record<MotionStatus, MotionStatus[]>> = {
	draft: ['introduced', 'withdrawn'],
	introduced: ['deliberation', 'withdrawn'],
	deliberation: ['withdrawn'], // deliberation → enacted/rejected goes through closeVote()
};

// --- Motion queries ---

export function getMotionByUuid(uuid: string): Motion | null {
	return library.getMotionByUuid(uuid);
}

export function getMotionBySlug(slug: string): Motion | null {
	return library.getMotionBySlug(slug);
}

export function listMotions(opts: {
	bodyUuid?: string;
	status?: MotionStatus;
} = {}): Motion[] {
	return library.listMotions({
		owner_uuid: opts.bodyUuid,
		status: opts.status,
	});
}

export function listEnactedMotions(): (Motion & { body_name: string; body_abbreviation: string | null })[] {
	return db.prepare(
		`SELECT m.*, a.name AS body_name, a.abbreviation AS body_abbreviation
		 FROM motion m
		 JOIN association a ON a.uuid = m.body_uuid
		 WHERE m.status = 'enacted'
		 ORDER BY m.enacted_at DESC`
	).all() as (Motion & { body_name: string; body_abbreviation: string | null })[];
}

// --- Motion writes ---

export function createMotion(input: {
	title: string;
	body: string;
	reasoning?: string | null;
	introduced_by_uuid: string;
	body_uuid: string;
	deliberation_rule_uuid?: string | null;
	type?: string;
	seniority?: number | null;
	slug?: string;
}): Motion {
	const uuid = randomUUID();
	
	// Get next motion number for this body
	// Check both database (old) and library (new) for highest number
	const dbResult = db.prepare(
		'SELECT COALESCE(MAX(motion_number), 0) AS max_number FROM motion WHERE body_uuid = ?'
	).get(input.body_uuid) as { max_number: number };
	
	const libraryMotions = library.listMotions({ owner_uuid: input.body_uuid });
	const libraryMaxNumber = libraryMotions.reduce((max, m) => Math.max(max, m.motion_number), 0);
	
	const motionNumber = Math.max(dbResult.max_number, libraryMaxNumber) + 1;
	
	// Generate slug if not provided
	const slug = input.slug ?? `motion-${uuid.substring(0, 8)}`;
	const year = new Date().getFullYear();
	const paddedNumber = motionNumber.toString().padStart(3, '0');
	const motionNumberStr = `M-${year}-${paddedNumber}`;
	
	const motion = library.createMotion({
		slug,
		title: input.title,
		body: input.body,
		reasoning: input.reasoning ?? undefined,
		introducer_uuid: input.introduced_by_uuid,
		owner_uuid: input.body_uuid,
		motion_number: motionNumberStr,
		deliberation_rule_uuid: input.deliberation_rule_uuid ?? undefined,
	});
	
	// Set status to introduced (library creates as draft)
	return library.updateMotionStatus(slug, 'introduced', {
		introduced_at: now(),
	});
}

export function advanceMotion(uuid: string, to: MotionStatus): Motion {
	const motion = getMotionByUuid(uuid);
	if (!motion) throw new Error(`Motion not found: ${uuid}`);

	const allowed = ALLOWED_TRANSITIONS[motion.status] ?? [];
	if (!allowed.includes(to)) {
		throw new Error(`Cannot transition motion from '${motion.status}' to '${to}'`);
	}

	// Require 15 readiness votes to advance from introduced to deliberation
	if (motion.status === 'introduced' && to === 'deliberation') {
		const readinessCount = getReadinessCount(uuid);
		if (readinessCount < 15) {
			throw new Error(`Motion requires 15 members to mark it ready before deliberation. Currently ${readinessCount}/15.`);
		}
	}

	const resolvedAt = (to === 'withdrawn') ? now() : null;
	const deliberationOpenedAt = (to === 'deliberation' && !motion.deliberation_opened_at) ? now() : null;
	
	// When advancing to deliberation, open voting immediately
	if (to === 'deliberation') {
		// Check if vote rule is set
		if (!motion.vote_rule_uuid) {
			throw new Error('A vote rule must be assigned before deliberation can begin');
		}

		// Get eligible voter count
		const row = db.prepare(
			`SELECT COUNT(*) as c FROM association_member WHERE association_uuid = ? AND removed_at IS NULL`
		).get(motion.body_uuid) as { c: number };
		const count = row.c;

		// Create vote tally
		db.prepare(
			`INSERT INTO motion_vote_tally (motion_uuid, eligible_count, aye_count, nay_count, abstain_count, opened_at)
			 VALUES (?, ?, 0, 0, 0, ?)`
		).run(uuid, count, deliberationOpenedAt);
	}
	
	// Update motion status in library
	return library.updateMotionStatus(motion.slug, to, {
		introduced_at: deliberationOpenedAt || undefined,
		vote_closed_at: resolvedAt || undefined,
	});
}

export function setMotionVoteRule(motionUuid: string, voteRuleUuid: string | null): Motion {
	const motion = getMotionByUuid(motionUuid);
	if (!motion) throw new Error(`Motion not found: ${motionUuid}`);
	if (motion.status === 'deliberation' || motion.status === 'enacted' || motion.status === 'rejected' || motion.status === 'withdrawn') {
		throw new Error(`Cannot change vote rule on a motion in status '${motion.status}'`);
	}
	return library.updateMotion(motion.slug, { vote_rule_uuid: voteRuleUuid ?? undefined });
}

export function setMotionDeliberationRule(motionUuid: string, deliberationRuleUuid: string | null): Motion {
	const motion = getMotionByUuid(motionUuid);
	if (!motion) throw new Error(`Motion not found: ${motionUuid}`);
	if (motion.status === 'deliberation' || motion.status === 'enacted' || motion.status === 'rejected' || motion.status === 'withdrawn') {
		throw new Error(`Cannot change deliberation rule on a motion in status '${motion.status}'`);
	}
	return library.updateMotion(motion.slug, { deliberation_rule_uuid: deliberationRuleUuid ?? undefined });
}

export function setMotionClerkNotes(motionUuid: string, clerkNotes: string | null): Motion {
	const motion = getMotionByUuid(motionUuid);
	if (!motion) throw new Error(`Motion not found: ${motionUuid}`);
	return library.updateMotion(motion.slug, { clerk_notes: clerkNotes ?? undefined });
}

export function setMotionParliamentarianNotes(motionUuid: string, parliamentarianNotes: string | null): Motion {
	const motion = getMotionByUuid(motionUuid);
	if (!motion) throw new Error(`Motion not found: ${motionUuid}`);
	return library.updateMotion(motion.slug, { parliamentarian_notes: parliamentarianNotes ?? undefined });
}

// --- Vote ---

// openVote is now called internally by advanceMotion when moving to deliberation
// This function is kept for backward compatibility but should not be called directly
export function openVote(motionUuid: string, eligibleCount?: number): VoteTally {
	throw new Error('openVote should not be called directly. Vote opens automatically when advancing to deliberation.');
}

export function getVoteTally(motionUuid: string): VoteTally | null {
	return (
		(db
			.prepare('SELECT * FROM motion_vote_tally WHERE motion_uuid = ?')
			.get(motionUuid) as VoteTally | undefined) ?? null
	);
}

export function hasVoted(motionUuid: string, voterUuid: string): boolean {
	return !!db
		.prepare('SELECT 1 FROM motion_vote_receipt WHERE motion_uuid = ? AND voter_uuid = ?')
		.get(motionUuid, voterUuid);
}

export function castVote(motionUuid: string, voterUuid: string, choice: VoteChoice): void {
	const motion = getMotionByUuid(motionUuid);
	if (!motion) throw new Error(`Motion not found: ${motionUuid}`);
	if (motion.status !== 'deliberation') throw new Error('Motion is not in deliberation/voting phase');
	if (hasVoted(motionUuid, voterUuid)) throw new Error('Already voted');

	const tally = getVoteTally(motionUuid);
	if (!tally) throw new Error('Vote tally not found');
	if (tally.closed_at) throw new Error('Vote has already closed');

	const col = choice === 'aye' ? 'aye_count' : choice === 'nay' ? 'nay_count' : 'abstain_count';

	db.transaction(() => {
		db.prepare(
			'INSERT INTO motion_vote_receipt (uuid, motion_uuid, voter_uuid, voted_at) VALUES (?, ?, ?, ?)'
		).run(randomUUID(), motionUuid, voterUuid, now());
		// col is derived from a controlled enum, not user input — safe to interpolate
		db.prepare(`UPDATE motion_vote_tally SET ${col} = ${col} + 1 WHERE motion_uuid = ?`).run(motionUuid);
	})();
}

// Close the vote and transition to enacted or rejected.
// Returns the final status.
export function closeVote(motionUuid: string): 'enacted' | 'rejected' {
	const tally = getVoteTally(motionUuid);
	if (!tally) throw new Error('Vote tally not found');
	if (tally.closed_at) throw new Error('Vote is already closed');

	const motion = getMotionByUuid(motionUuid);
	if (!motion || motion.status !== 'deliberation') throw new Error('Motion is not in deliberation status');

	let outcome: 'enacted' | 'rejected';
	if (motion.vote_rule_uuid) {
		const rule = getVoteRuleByUuid(motion.vote_rule_uuid);
		if (!rule) throw new Error(`Vote rule not found: ${motion.vote_rule_uuid}`);
		outcome = evaluateTally(rule, tally).passed ? 'enacted' : 'rejected';
	} else {
		// Fallback: simple majority of aye vs nay
		outcome = tally.aye_count > tally.nay_count ? 'enacted' : 'rejected';
	}
	const resolvedAt = now();

	// Update vote tally
	db.prepare('UPDATE motion_vote_tally SET closed_at = ? WHERE motion_uuid = ?').run(resolvedAt, motionUuid);
	
	// Update motion status and timestamps
	library.updateMotionStatus(motion.slug, outcome, {
		vote_closed_at: resolvedAt,
		enacted_at: outcome === 'enacted' ? resolvedAt : undefined,
	});

	// Update adopted_at if enacted (library doesn't track this in content currently)
	if (outcome === 'enacted') {
		library.updateMotion(motion.slug, { adopted_at: resolvedAt });
	}

	return outcome;
}

// --- Comments ---

export function addComment(motionUuid: string, authorUuid: string, body: string): MotionComment {
	const uuid = randomUUID();
	const createdAt = now();
	db.prepare(
		`INSERT INTO motion_comment (uuid, motion_uuid, author_uuid, body, created_at)
		 VALUES (?, ?, ?, ?, ?)`
	).run(uuid, motionUuid, authorUuid, body, createdAt);
	return db.prepare('SELECT * FROM motion_comment WHERE uuid = ?').get(uuid) as MotionComment;
}

export function editComment(commentUuid: string, body: string): void {
	db.prepare(
		'UPDATE motion_comment SET body = ?, edited_at = ? WHERE uuid = ? AND deleted_at IS NULL'
	).run(body, now(), commentUuid);
}

export function deleteComment(commentUuid: string): void {
	db.prepare(
		'UPDATE motion_comment SET deleted_at = ? WHERE uuid = ? AND deleted_at IS NULL'
	).run(now(), commentUuid);
}

export function getComments(motionUuid: string): MotionComment[] {
	return db
		.prepare(
			'SELECT * FROM motion_comment WHERE motion_uuid = ? AND deleted_at IS NULL ORDER BY created_at'
		)
		.all(motionUuid) as MotionComment[];
}

// --- Motion Readiness ---

export function markReady(motionUuid: string, memberUuid: string): void {
	const motion = getMotionByUuid(motionUuid);
	if (!motion) throw new Error(`Motion not found: ${motionUuid}`);
	if (motion.status !== 'introduced') throw new Error('Motion must be in introduced status');

	// Check if already marked
	const existing = db
		.prepare('SELECT 1 FROM motion_readiness WHERE motion_uuid = ? AND member_uuid = ?')
		.get(motionUuid, memberUuid);
	
	if (existing) return; // Already marked, no-op

	db.prepare(
		'INSERT INTO motion_readiness (uuid, motion_uuid, member_uuid, marked_at) VALUES (?, ?, ?, ?)'
	).run(randomUUID(), motionUuid, memberUuid, now());
}

export function unmarkReady(motionUuid: string, memberUuid: string): void {
	db.prepare('DELETE FROM motion_readiness WHERE motion_uuid = ? AND member_uuid = ?')
		.run(motionUuid, memberUuid);
}

export function hasMarkedReady(motionUuid: string, memberUuid: string): boolean {
	return !!db
		.prepare('SELECT 1 FROM motion_readiness WHERE motion_uuid = ? AND member_uuid = ?')
		.get(motionUuid, memberUuid);
}

export function getReadinessCount(motionUuid: string): number {
	const result = db
		.prepare('SELECT COUNT(*) as count FROM motion_readiness WHERE motion_uuid = ?')
		.get(motionUuid) as { count: number };
	return result.count;
}

export function getReadinessSigners(motionUuid: string): Array<{
	uuid: string;
	given_name: string;
	family_name: string;
	handle: string;
	marked_at: string;
}> {
	return db.prepare(`
		SELECT p.uuid, p.given_name, p.family_name, p.handle, mr.marked_at
		FROM motion_readiness mr
		JOIN person p ON p.uuid = mr.member_uuid
		WHERE mr.motion_uuid = ?
		ORDER BY mr.marked_at ASC
	`).all(motionUuid) as Array<{
		uuid: string;
		given_name: string;
		family_name: string;
		handle: string;
		marked_at: string;
	}>;
}

// --- Motion as Document ---

/**
 * Export a motion in a document-compatible structure.
 * This allows enacted motions to be viewed and treated like governing documents.
 */
export interface MotionAsDocument {
	slug: string;
	title: string;
	type: string;
	seniority: number | null;
	owner_uuid: string;
	status: 'draft' | 'adopted' | 'repealed';
	created_at: string;
	adopted_at: string | null;
	adopted_by_motion_uuid: string | null;
	repealed_at: string | null;
	repealed_by_motion_uuid: string | null;
	articles: Array<{
		number: string;
		title: string;
		sections: Array<{
			title: string;
			body: string;
			rationale?: string;
		}>;
	}>;
}

export function motionAsDocument(motion: Motion): MotionAsDocument {
	// Map motion status to document status
	let docStatus: 'draft' | 'adopted' | 'repealed';
	if (motion.status === 'enacted') {
		docStatus = motion.repealed_at ? 'repealed' : 'adopted';
	} else if (motion.status === 'draft' || motion.status === 'introduced' || motion.status === 'deliberation') {
		docStatus = 'draft';
	} else {
		docStatus = 'draft'; // withdrawn/rejected treated as draft
	}

	return {
		slug: motion.slug,
		title: motion.title,
		type: motion.type,
		seniority: motion.seniority,
		owner_uuid: motion.owner_uuid,
		status: docStatus,
		created_at: motion.created_at,
		adopted_at: motion.adopted_at,
		adopted_by_motion_uuid: motion.adopted_by_motion_uuid,
		repealed_at: motion.repealed_at,
		repealed_by_motion_uuid: motion.repealed_by_motion_uuid,
		articles: [
			{
				number: 'I',
				title: 'Motion Text',
				sections: [
					{
						title: 'Body',
						body: motion.body,
						rationale: motion.reasoning ?? undefined
					}
				]
			}
		]
	};
}

