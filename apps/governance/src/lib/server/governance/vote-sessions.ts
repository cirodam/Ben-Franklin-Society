import { randomUUID } from 'node:crypto';
import { db } from '../db.js';
import { enactMotion, rejectMotion } from './motions.js';

// --- Types ---

export type VoteSessionStatus = 'scheduled' | 'open' | 'closed' | 'finalized';
export type VoteChoice = 'aye' | 'nay' | 'abstain';
export type VoteOutcome = 'passed' | 'failed';

export interface VoteSession {
	uuid: string;
	motion_uuid: string;
	opened_by: string;
	meeting_uuid: string | null;
	passing_threshold: number;
	requires_quorum: number; // 0 or 1 (boolean)
	quorum_threshold: number | null;
	opens_at: string;
	closes_at: string;
	status: VoteSessionStatus;
	closed_at: string | null;
	finalized_at: string | null;
	outcome: VoteOutcome | null;
	created_at: string;
}

export interface VoteSessionTally {
	session_uuid: string;
	motion_uuid: string;
	eligible_count: number;
	aye_count: number;
	nay_count: number;
	abstain_count: number;
	total_votes: number;
	participation_rate: number;
}

function now(): string {
	return new Date().toISOString();
}

// --- Session Management ---

/**
 * Create a new vote session
 */
export function createVoteSession(input: {
	motion_uuid: string;
	opened_by: string;
	meeting_uuid?: string | null;
	passing_threshold?: number;
	requires_quorum?: boolean;
	quorum_threshold?: number | null;
	opens_at: string;
	closes_at: string;
}): VoteSession {
	const uuid = randomUUID();
	const created_at = now();
	
	// Default to simple majority if not specified
	const passing_threshold = input.passing_threshold ?? 0.5;
	const requires_quorum = input.requires_quorum ? 1 : 0;
	const quorum_threshold = input.quorum_threshold ?? null;
	
	// Determine initial status based on opens_at
	const status: VoteSessionStatus = new Date(input.opens_at) <= new Date() ? 'open' : 'scheduled';
	
	db.prepare(`
		INSERT INTO vote_session (
			uuid, motion_uuid, opened_by, meeting_uuid,
			passing_threshold, requires_quorum, quorum_threshold,
			opens_at, closes_at, status, created_at
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	`).run(
		uuid,
		input.motion_uuid,
		input.opened_by,
		input.meeting_uuid ?? null,
		passing_threshold,
		requires_quorum,
		quorum_threshold,
		input.opens_at,
		input.closes_at,
		status,
		created_at
	);
	
	return getVoteSession(uuid)!;
}

/**
 * Get vote session by UUID
 */
export function getVoteSession(uuid: string): VoteSession | null {
	return (db.prepare('SELECT * FROM vote_session WHERE uuid = ?').get(uuid) as VoteSession | undefined) ?? null;
}

/**
 * List vote sessions with optional filters
 */
export function listVoteSessions(filters: {
	motion_uuid?: string;
	meeting_uuid?: string;
	status?: VoteSessionStatus;
	opened_by?: string;
}): VoteSession[] {
	let query = 'SELECT * FROM vote_session WHERE 1=1';
	const params: any[] = [];
	
	if (filters.motion_uuid) {
		query += ' AND motion_uuid = ?';
		params.push(filters.motion_uuid);
	}
	
	if (filters.meeting_uuid) {
		query += ' AND meeting_uuid = ?';
		params.push(filters.meeting_uuid);
	}
	
	if (filters.status) {
		query += ' AND status = ?';
		params.push(filters.status);
	}
	
	if (filters.opened_by) {
		query += ' AND opened_by = ?';
		params.push(filters.opened_by);
	}
	
	query += ' ORDER BY opens_at DESC';
	
	return db.prepare(query).all(...params) as VoteSession[];
}

/**
 * Get all vote sessions for a motion
 */
export function getVoteSessionsForMotion(motionUuid: string): VoteSession[] {
	return listVoteSessions({ motion_uuid: motionUuid });
}

/**
 * Get active vote sessions (open status)
 */
export function getActiveVoteSessions(): VoteSession[] {
	return listVoteSessions({ status: 'open' });
}

// --- Session Lifecycle ---

/**
 * Open a scheduled vote session (scheduled → open)
 */
export function openVoteSession(uuid: string): void {
	const session = getVoteSession(uuid);
	if (!session) throw new Error('Vote session not found');
	
	if (session.status !== 'scheduled') {
		throw new Error(`Cannot open session with status ${session.status}`);
	}
	
	// Check if opens_at time has been reached
	if (new Date(session.opens_at) > new Date()) {
		throw new Error('Session opening time has not been reached yet');
	}
	
	db.prepare('UPDATE vote_session SET status = ? WHERE uuid = ?').run('open', uuid);
}

/**
 * Close an open vote session (open → closed)
 */
export function closeVoteSession(uuid: string): void {
	const session = getVoteSession(uuid);
	if (!session) throw new Error('Vote session not found');
	
	if (session.status !== 'open') {
		throw new Error(`Cannot close session with status ${session.status}`);
	}
	
	const closed_at = now();
	db.prepare('UPDATE vote_session SET status = ?, closed_at = ? WHERE uuid = ?').run('closed', closed_at, uuid);
}

/**
 * Finalize a closed vote session - determine outcome and advance motion (closed → finalized)
 */
export function finalizeVoteSession(uuid: string): void {
	const session = getVoteSession(uuid);
	if (!session) throw new Error('Vote session not found');
	
	if (session.status !== 'closed') {
		throw new Error(`Cannot finalize session with status ${session.status}`);
	}
	
	// Determine outcome based on votes
	const outcome = determineOutcome(uuid);
	const finalized_at = now();
	
	// Update session status and outcome
	db.prepare('UPDATE vote_session SET status = ?, outcome = ?, finalized_at = ? WHERE uuid = ?')
		.run('finalized', outcome, finalized_at, uuid);
	
	// Advance motion based on outcome
	if (outcome === 'passed') {
		enactMotion(session.motion_uuid, uuid);
	} else {
		rejectMotion(session.motion_uuid, uuid);
	}
}

/**
 * Auto-open scheduled sessions that have reached their opens_at time
 */
export function openScheduledSessions(): number {
	const now_timestamp = now();
	const scheduled = db.prepare(`
		SELECT uuid FROM vote_session 
		WHERE status = 'scheduled' AND opens_at <= ?
	`).all(now_timestamp) as { uuid: string }[];
	
	for (const session of scheduled) {
		try {
			openVoteSession(session.uuid);
		} catch (err) {
			console.error(`Failed to auto-open session ${session.uuid}:`, err);
		}
	}
	
	return scheduled.length;
}

/**
 * Auto-close expired sessions (checks closes_at timestamp)
 */
export function closeExpiredSessions(): number {
	const now_timestamp = now();
	const expired = db.prepare(`
		SELECT uuid FROM vote_session 
		WHERE status = 'open' AND closes_at <= ?
	`).all(now_timestamp) as { uuid: string }[];
	
	for (const session of expired) {
		try {
			closeVoteSession(session.uuid);
			finalizeVoteSession(session.uuid);
		} catch (err) {
			console.error(`Failed to auto-close session ${session.uuid}:`, err);
		}
	}
	
	return expired.length;
}

// --- Voting ---

/**
 * Check if a person can vote in this session
 */
export function canVote(sessionUuid: string, personUuid: string): boolean {
	const session = getVoteSession(sessionUuid);
	if (!session) return false;
	
	// Must be in open status
	if (session.status !== 'open') return false;
	
	// Check if person has already voted
	if (hasVoted(sessionUuid, personUuid)) return false;
	
	// Check if person is eligible (member of motion's owner body)
	const motion = db.prepare('SELECT owner_uuid FROM library_item WHERE uuid = ? AND type = ?')
		.get(session.motion_uuid, 'motion') as { owner_uuid: string } | undefined;
	
	if (!motion) return false;
	
	const isMember = db.prepare(`
		SELECT 1 FROM association_member 
		WHERE association_uuid = ? AND person_uuid = ? AND removed_at IS NULL
	`).get(motion.owner_uuid, personUuid);
	
	return !!isMember;
}

/**
 * Check if a person has already voted in this session
 */
export function hasVoted(sessionUuid: string, personUuid: string): boolean {
	const session = getVoteSession(sessionUuid);
	if (!session) return false;
	
	const receipt = db.prepare(`
		SELECT 1 FROM vote_receipt 
		WHERE vote_session_uuid = ? AND voter_uuid = ?
	`).get(sessionUuid, personUuid);
	
	return !!receipt;
}

/**
 * Cast a vote in a session (always secret)
 */
export function castVote(sessionUuid: string, voterUuid: string, choice: VoteChoice): void {
	if (!canVote(sessionUuid, voterUuid)) {
		throw new Error('Not eligible to vote in this session');
	}
	
	const session = getVoteSession(sessionUuid)!;
	
	// Record vote
	db.prepare(`
		INSERT INTO vote_receipt (uuid, vote_session_uuid, voter_uuid, choice, voted_at)
		VALUES (?, ?, ?, ?, ?)
	`).run(randomUUID(), sessionUuid, voterUuid, choice, now());
}

// --- Tallies and Outcomes ---

/**
 * Get vote tally for a session
 */
export function getSessionTally(sessionUuid: string): VoteSessionTally | null {
	const session = getVoteSession(sessionUuid);
	if (!session) return null;
	
	// Count votes by choice from vote_receipt
	const votes = db.prepare(`
		SELECT choice, COUNT(*) as count 
		FROM vote_receipt 
		WHERE vote_session_uuid = ?
		GROUP BY choice
	`).all(sessionUuid) as { choice: string; count: number }[];
	
	let aye_count = 0;
	let nay_count = 0;
	let abstain_count = 0;
	
	for (const vote of votes) {
		if (vote.choice === 'aye') aye_count = vote.count;
		else if (vote.choice === 'nay') nay_count = vote.count;
		else if (vote.choice === 'abstain') abstain_count = vote.count;
	}
	
	// Get eligible voter count (members of the motion's owner association)
	const motion = db.prepare('SELECT owner_uuid FROM library_item WHERE uuid = ? AND type = ?')
		.get(session.motion_uuid, 'motion') as { owner_uuid: string } | undefined;
	
	const eligible_count = motion ? (db.prepare(`
		SELECT COUNT(*) as c FROM association_member 
		WHERE association_uuid = ? AND removed_at IS NULL
	`).get(motion.owner_uuid) as { c: number }).c : 0;
	
	const total_votes = aye_count + nay_count + abstain_count;
	const participation_rate = eligible_count > 0 ? total_votes / eligible_count : 0;
	
	return {
		session_uuid: sessionUuid,
		motion_uuid: session.motion_uuid,
		eligible_count,
		aye_count,
		nay_count,
		abstain_count,
		total_votes,
		participation_rate
	};
}

/**
 * Determine if session passed or failed based on votes and rules
 */
function determineOutcome(sessionUuid: string): VoteOutcome {
	const session = getVoteSession(sessionUuid);
	if (!session) throw new Error('Session not found');
	
	const tally = getSessionTally(sessionUuid);
	if (!tally) throw new Error('No votes recorded');
	
	// Check quorum if required
	if (session.requires_quorum && session.quorum_threshold) {
		if (tally.participation_rate < session.quorum_threshold) {
			return 'failed'; // Quorum not met
		}
	}
	
	// Calculate passing threshold
	// Threshold is based on aye / (aye + nay), abstentions don't count
	const decisive_votes = tally.aye_count + tally.nay_count;
	
	if (decisive_votes === 0) {
		return 'failed'; // No decisive votes cast
	}
	
	const aye_ratio = tally.aye_count / decisive_votes;
	
	return aye_ratio >= session.passing_threshold ? 'passed' : 'failed';
}

/**
 * Get outcome of a finalized session
 */
export function getSessionOutcome(sessionUuid: string): VoteOutcome | null {
	const session = getVoteSession(sessionUuid);
	return session?.outcome ?? null;
}
